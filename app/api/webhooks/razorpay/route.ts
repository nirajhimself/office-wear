import { NextResponse } from "next/server";
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
    // Verify the exact raw body sent by Razorpay.
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 },
      );
    }

    const event = JSON.parse(rawBody) as RazorpayWebhook;
    const payment = event.payload?.payment?.entity;

    if (!payment?.order_id || !payment.id) {
      // Acknowledge unrelated or unsupported event payloads.
      return NextResponse.json({ received: true });
    }

    const record = await prisma.payment.findFirst({
      where: { providerOrderId: payment.order_id },
      include: { order: true },
    });

    if (!record) {
      // Don't repeatedly retry an event for an unknown order.
      console.error("Razorpay webhook: order not found", payment.order_id);
      return NextResponse.json({ received: true });
    }

    if (event.event === "payment.failed") {
      // A failed attempt can be retried, so keep the order and its
      // reservation pending until the expiry cleanup is implemented.
      await prisma.payment.updateMany({
        where: { id: record.id, status: { not: "PAID" } },
        data: {
          providerPaymentId: payment.id,
          status: "FAILED",
        },
      });

      return NextResponse.json({ received: true });
    }

    if (event.event !== "payment.captured" && event.event !== "order.paid") {
      return NextResponse.json({ received: true });
    }

    // Reject a payment that doesn't match the order amount/currency.
    const expectedAmount = Math.round(Number(record.order.total) * 100);

    if (payment.amount !== expectedAmount || payment.currency !== "INR") {
      console.error("Razorpay webhook: amount/currency mismatch", {
        orderNumber: record.order.orderNumber,
        receivedAmount: payment.amount,
        expectedAmount,
        currency: payment.currency,
      });

      return NextResponse.json(
        { error: "Payment amount or currency mismatch." },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      const current = await tx.payment.findUnique({
        where: { id: record.id },
      });

      // Prevent duplicate webhook deliveries from confirming stock twice.
      if (!current || current.status === "PAID") return;

      await tx.payment.update({
        where: { id: record.id },
        data: {
          providerPaymentId: payment.id,
          status: "PAID",
        },
      });

      await tx.order.update({
        where: { id: record.orderId },
        data: {
          status: "PAYMENT_CONFIRMED",
          paymentStatus: "PAID",
        },
      });

      await confirmInventory(tx, record.orderId);
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
