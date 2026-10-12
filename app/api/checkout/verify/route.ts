
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/payments/razorpay";
import { confirmInventory } from "@/lib/commerce";

const schema = z.object({
  orderNumber: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payment response." },
        { status: 400 },
      );
    }

    const data = parsed.data;

    if (
      !verifyRazorpaySignature(
        data.razorpayOrderId,
        data.razorpayPaymentId,
        data.razorpaySignature,
      )
    ) {
      return NextResponse.json(
        { error: "Payment verification failed." },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber: data.orderNumber },
      include: { payment: true },
    });

    if (
      !order ||
      !order.payment ||
      order.payment.providerOrderId !== data.razorpayOrderId
    ) {
      return NextResponse.json(
        { error: "Order could not be verified." },
        { status: 404 },
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const current = await tx.order.findUnique({
          where: { id: order.id },
          include: { payment: true },
        });

        if (!current || !current.payment) {
          return { kind: "NOT_FOUND" as const };
        }

        if (current.payment.providerOrderId !== data.razorpayOrderId) {
          return { kind: "MISMATCH" as const };
        }

        if (
          current.payment.status === "PAID" &&
          current.payment.providerPaymentId === data.razorpayPaymentId
        ) {
          return { kind: "ALREADY_PAID" as const };
        }

        if (current.status === "CANCELLED") {
          // Do not revive a cancelled order or change its inventory.
          // A real captured payment must be reconciled via the webhook.
          return { kind: "CANCELLED" as const };
        }

        const paymentUpdate = await tx.payment.updateMany({
          where: {
            id: current.payment.id,
            status: { not: "PAID" },
          },
          data: {
            providerPaymentId: data.razorpayPaymentId,
            signature: data.razorpaySignature,
            status: "PAID",
          },
        });

        if (paymentUpdate.count !== 1) {
          return { kind: "RETRY" as const };
        }

        const orderUpdate = await tx.order.updateMany({
          where: {
            id: current.id,
            status: { not: "CANCELLED" },
          },
          data: {
            status: "PAYMENT_CONFIRMED",
            paymentStatus: "PAID",
          },
        });

        if (orderUpdate.count !== 1) {
          throw new Error("Order state changed during payment verification.");
        }

        await confirmInventory(tx, current.id);

        return { kind: "PAID" as const };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (result.kind === "CANCELLED") {
      return NextResponse.json(
        {
          error:
            "This order has been cancelled. If your payment was captured, it will be checked for reconciliation.",
        },
        { status: 409 },
      );
    }

    if (result.kind === "NOT_FOUND" || result.kind === "MISMATCH") {
      return NextResponse.json(
        { error: "Order could not be verified." },
        { status: 404 },
      );
    }

    if (result.kind === "RETRY") {
      return NextResponse.json(
        { error: "Payment status changed. Please refresh your order." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Payment status changed concurrently. Please retry." },
        { status: 409 },
      );
    }

    console.error("checkout/verify", error);

    return NextResponse.json(
      { error: "Payment verification failed." },
      { status: 500 },
    );
  }
}
