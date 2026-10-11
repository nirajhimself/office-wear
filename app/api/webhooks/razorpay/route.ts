import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { confirmInventory } from "@/lib/commerce";

export const runtime = "nodejs";

type RazorpayPayment = {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
};

type RazorpayWebhook = {
  event?: string;
  payload?: {
    payment?: {
      entity?: RazorpayPayment;
    };
  };
};

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    const eventId = request.headers.get("x-razorpay-event-id");

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 },
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { error: "Missing Razorpay event ID." },
        { status: 400 },
      );
    }

    let event: RazorpayWebhook;

    try {
      event = JSON.parse(rawBody) as RazorpayWebhook;
    } catch {
      return NextResponse.json(
        { error: "Invalid webhook payload." },
        { status: 400 },
      );
    }

    const eventType = event.event ?? "unknown";
    const payment = event.payload?.payment?.entity;

    // Ignore event types this endpoint does not process.
    if (eventType !== "payment.captured" && eventType !== "payment.failed") {
      return NextResponse.json({ received: true });
    }

    if (!payment?.id || !payment.order_id) {
      return NextResponse.json(
        { error: "Missing payment details." },
        { status: 400 },
      );
    }

    const record = await prisma.payment.findFirst({
      where: { providerOrderId: payment.order_id },
      include: { order: true },
    });

    if (!record) {
      // Let Razorpay retry if the matching order is not yet available.
      return NextResponse.json(
        { error: "Matching order not found." },
        { status: 500 },
      );
    }

    if (eventType === "payment.captured") {
      const expectedAmount = Math.round(Number(record.order.total) * 100);

      if (payment.amount !== expectedAmount || payment.currency !== "INR") {
        console.error("Razorpay webhook amount mismatch", {
          orderNumber: record.order.orderNumber,
          eventId,
        });

        return NextResponse.json(
          { error: "Payment amount or currency mismatch." },
          { status: 400 },
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      // The unique eventId makes duplicate deliveries detectable.
      await tx.razorpayWebhookEvent.create({
        data: {
          eventId,
          eventType,
        },
      });

      if (eventType === "payment.failed") {
        // A failed attempt is not necessarily a final failed order.
        // Keep the order pending so the customer can retry payment.
        await tx.payment.updateMany({
          where: {
            id: record.id,
            status: { not: "PAID" },
          },
          data: {
            providerPaymentId: payment.id,
            status: "FAILED",
          },
        });
      } else {
        // Atomic conditional update prevents two concurrent events
        // from both confirming inventory for the same payment record.
        const updated = await tx.payment.updateMany({
          where: {
            id: record.id,
            status: { not: "PAID" },
          },
          data: {
            providerPaymentId: payment.id,
            status: "PAID",
          },
        });

        if (updated.count === 1) {
          await tx.order.update({
            where: { id: record.orderId },
            data: {
              status: "PAYMENT_CONFIRMED",
              paymentStatus: "PAID",
            },
          });

          await confirmInventory(tx, record.orderId);
        }
      }

      await tx.razorpayWebhookEvent.update({
        where: { eventId },
        data: { processedAt: new Date() },
      });
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    // A previously recorded event is an expected duplicate.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({
        received: true,
        duplicate: true,
      });
    }

    console.error("Razorpay webhook error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
