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

    // Verify that the webhook came from Razorpay.
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

    // This endpoint handles only captured and failed payment events.
    if (eventType !== "payment.captured" && eventType !== "payment.failed") {
      return NextResponse.json({ received: true });
    }

    const payment = event.payload?.payment?.entity;

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
      // Return an error so Razorpay can retry delivery.
      return NextResponse.json(
        { error: "Matching order not found." },
        { status: 500 },
      );
    }

    // Validate amount and currency for captured payments.
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

    await prisma.$transaction(
      async (tx) => {
        // Unique eventId prevents duplicate webhook processing.
        await tx.razorpayWebhookEvent.create({
          data: {
            eventId,
            eventType,
          },
        });

        const currentPayment = await tx.payment.findUnique({
          where: { id: record.id },
        });

        const currentOrder = await tx.order.findUnique({
          where: { id: record.orderId },
        });

        if (!currentPayment || !currentOrder) {
          throw new Error("Payment or order no longer exists.");
        }

        // Never confirm inventory a second time.
        if (currentPayment.status === "PAID") {
          await tx.razorpayWebhookEvent.update({
            where: { eventId },
            data: { processedAt: new Date() },
          });
          return;
        }

        if (eventType === "payment.failed") {
          // A failed attempt can be retried. Do not overwrite a paid
          // payment or change an order that has already been cancelled.
          if (currentOrder.status !== "CANCELLED") {
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
          }
        } else {
          // Mark the captured payment as paid exactly once.
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
            if (currentOrder.status === "CANCELLED") {
              // Do not revive a cancelled order or touch its inventory.
              // This payment requires refund/reconciliation.
              await tx.order.update({
                where: { id: record.orderId },
                data: { paymentStatus: "PAID" },
              });

              console.error(
                "ACTION REQUIRED: Payment captured for a cancelled order",
                {
                  orderNumber: currentOrder.orderNumber,
                  paymentId: payment.id,
                },
              );
            } else {
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
        }

        await tx.razorpayWebhookEvent.update({
          where: { eventId },
          data: { processedAt: new Date() },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    // Duplicate event IDs are expected when Razorpay retries delivery.
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
