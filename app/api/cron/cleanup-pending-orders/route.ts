
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { releaseInventory } from "@/lib/commerce";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPIRY_MINUTES = 30;
const BATCH_SIZE = 50;

type RazorpayPaymentsResponse = {
  items?: Array<{
    status?: string;
    id?: string;
  }>;
};

async function checkRazorpayPayments(
  razorpayOrderId: string,
): Promise<"SAFE_TO_EXPIRE" | "PAYMENT_EXISTS" | "UNKNOWN"> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) return "UNKNOWN";

  try {
    const response = await fetch(
      `https://api.razorpay.com/v1/orders/${encodeURIComponent(
        razorpayOrderId,
      )}/payments`,
      {
        method: "GET",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) return "UNKNOWN";

    const result =
      (await response.json()) as RazorpayPaymentsResponse;

    if (!Array.isArray(result.items)) return "UNKNOWN";

    // Do not cancel while a payment is captured or authorized.
    if (
      result.items.some(
        (payment) =>
          payment.status === "captured" ||
          payment.status === "authorized",
      )
    ) {
      return "PAYMENT_EXISTS";
    }

    return "SAFE_TO_EXPIRE";
  } catch (error) {
    console.error("Razorpay payment lookup failed:", error);
    return "UNKNOWN";
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("CRON_SECRET is not configured.");
    return NextResponse.json(
      { error: "Cron is not configured." },
      { status: 500 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  const cutoff = new Date(
    Date.now() - EXPIRY_MINUTES * 60 * 1000,
  );

  try {
    const candidates = await prisma.order.findMany({
      where: {
        paymentMethod: "RAZORPAY",
        status: "PENDING",
        paymentStatus: "PENDING",
        createdAt: { lt: cutoff },
      },
      include: { payment: true },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    });

    let cancelled = 0;
    let skipped = 0;
    let errors = 0;

    for (const order of candidates) {
      const payment = order.payment;

      // Never release stock without a corresponding Razorpay order.
      if (
        !payment?.providerOrderId ||
        payment.status === "PAID"
      ) {
        skipped++;
        continue;
      }

      const paymentCheck = await checkRazorpayPayments(
        payment.providerOrderId,
      );

      if (paymentCheck !== "SAFE_TO_EXPIRE") {
        skipped++;
        continue;
      }

      try {
        const didCancel = await prisma.$transaction(
          async (tx) => {
            // Recheck the order state atomically. Only one cleanup
            // execution can win this transition.
            const orderUpdate = await tx.order.updateMany({
              where: {
                id: order.id,
                paymentMethod: "RAZORPAY",
                status: "PENDING",
                paymentStatus: "PENDING",
                createdAt: { lt: cutoff },
              },
              data: {
                status: "CANCELLED",
                paymentStatus: "FAILED",
              },
            });

            if (orderUpdate.count !== 1) return false;

            // If another process has already confirmed payment,
            // throw so the order cancellation rolls back.
            const paymentUpdate = await tx.payment.updateMany({
              where: {
                id: payment.id,
                status: { not: "PAID" },
              },
              data: { status: "FAILED" },
            });

            if (paymentUpdate.count !== 1) {
              throw new Error(
                "Payment state changed during cleanup.",
              );
            }

            // Release the stock reservation only after this cleanup
            // successfully transitions the order to CANCELLED.
            await releaseInventory(tx, order.id);

            // Free coupon usage only if this order actually had one.
            const couponUsage = await tx.couponUsage.findUnique({
              where: { orderId: order.id },
            });

            if (couponUsage) {
              await tx.couponUsage.delete({
                where: { orderId: order.id },
              });

              await tx.coupon.updateMany({
                where: {
                  id: couponUsage.couponId,
                  usedCount: { gt: 0 },
                },
                data: {
                  usedCount: { decrement: 1 },
                },
              });
            }

            return true;
          },
          {
            isolationLevel:
              Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        if (didCancel) {
          cancelled++;
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        console.error("Pending-order cleanup failed:", {
          orderNumber: order.orderNumber,
          error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      expiryMinutes: EXPIRY_MINUTES,
      checked: candidates.length,
      cancelled,
      skipped,
      errors,
    });
  } catch (error) {
    console.error("Cleanup cron failed:", error);

    return NextResponse.json(
      { error: "Cleanup job failed." },
      { status: 500 },
    );
  }
}
