import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { releaseInventory } from "@/lib/commerce";

export const runtime = "nodejs";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to cancel this order." },
        { status: 401 },
      );
    }

    const { orderNumber } = await params;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true, userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.userId !== user.id) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const current = await tx.order.findUnique({
          where: { id: order.id },
          include: { payment: true },
        });

        if (!current) return "NOT_FOUND" as const;

        // This first patch handles only pending, unpaid Razorpay orders.
        // Paid orders require a separate refund workflow.
        if (
          current.status !== "PENDING" ||
          current.paymentMethod !== "RAZORPAY" ||
          !["PENDING", "FAILED"].includes(current.paymentStatus) ||
          !current.payment?.providerOrderId ||
          !["PENDING", "FAILED"].includes(current.payment.status)
        ) {
          return "NOT_CANCELLABLE" as const;
        }

        const claimed = await tx.order.updateMany({
          where: {
            id: current.id,
            userId: user.id,
            status: "PENDING",
            paymentMethod: "RAZORPAY",
            paymentStatus: current.paymentStatus,
          },
          data: {
            status: "CANCELLED",
            paymentStatus: "FAILED",
          },
        });

        if (claimed.count !== 1) {
          return "NOT_CANCELLABLE" as const;
        }

        const paymentUpdated = await tx.payment.updateMany({
          where: {
            id: current.payment.id,
            status: { in: ["PENDING", "FAILED"] },
          },
          data: { status: "FAILED" },
        });

        if (paymentUpdated.count !== 1) {
          throw new Error("Payment state changed during cancellation.");
        }

        // Release inventory only after the cancellation transition succeeds.
        await releaseInventory(tx, current.id);

        // Release this order's coupon usage, if one exists.
        const usage = await tx.couponUsage.findUnique({
          where: { orderId: current.id },
        });

        if (usage) {
          await tx.couponUsage.delete({
            where: { orderId: current.id },
          });

          await tx.coupon.updateMany({
            where: {
              id: usage.couponId,
              usedCount: { gt: 0 },
            },
            data: { usedCount: { decrement: 1 } },
          });
        }

        return "CANCELLED" as const;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    if (result === "NOT_FOUND") {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (result === "NOT_CANCELLABLE") {
      return NextResponse.json(
        {
          error:
            "This order cannot be cancelled here. Paid orders and confirmed COD orders require the appropriate cancellation or refund process.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        {
          error:
            "The order changed at the same time. Please refresh and try again.",
        },
        { status: 409 },
      );
    }

    console.error("orders/cancel", error);

    return NextResponse.json(
      { error: "Could not cancel the order. Please try again." },
      { status: 500 },
    );
  }
}
