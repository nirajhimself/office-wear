import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  quoteCart,
  reserveInventory,
  confirmInventory,
  releaseInventory,
} from "@/lib/commerce";
import { createRazorpayOrder } from "@/lib/payments/razorpay";

export const runtime = "nodejs";
export const maxDuration = 30;

const transactionOptions = {
  maxWait: 10000,
  timeout: 20000,
};

const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        size: z.string(),
        color: z.string(),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  couponCode: z.string().trim().max(32).optional(),
  savedAddressId: z.string().min(1).optional(),
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().email().optional(),
    phone: z.string().trim().min(10).max(15),
    line1: z.string().trim().min(3).max(150),
    line2: z.string().trim().max(150).optional(),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    postalCode: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Enter a valid 6-digit PIN code."),
    country: z.string().default("India"),
  }),
});

function orderNumber() {
  const now = new Date();

  return `OW${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid checkout details.",
        },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const user = await getCurrentUser();

    if (!user && !data.customer.email) {
      return NextResponse.json(
        { error: "Email is required for guest checkout." },
        { status: 400 },
      );
    }

    // Only an authenticated owner can use a saved address.
    let savedAddress = null;

    if (data.savedAddressId) {
      if (!user) {
        return NextResponse.json(
          { error: "Sign in to use a saved address." },
          { status: 401 },
        );
      }

      savedAddress = await prisma.address.findFirst({
        where: {
          id: data.savedAddressId,
          userId: user.id,
        },
      });

      if (!savedAddress) {
        return NextResponse.json(
          {
            error: "Saved address not found. Please select another address.",
          },
          { status: 400 },
        );
      }
    }

    const deliveryAddress = savedAddress
      ? {
          name: savedAddress.name,
          phone: savedAddress.phone,
          line1: savedAddress.line1,
          line2: savedAddress.line2 ?? "",
          city: savedAddress.city,
          state: savedAddress.state,
          postalCode: savedAddress.postalCode,
          country: savedAddress.country,
        }
      : {
          name: data.customer.name,
          phone: data.customer.phone,
          line1: data.customer.line1,
          line2: data.customer.line2 ?? "",
          city: data.customer.city,
          state: data.customer.state,
          postalCode: data.customer.postalCode,
          country: data.customer.country,
        };

    const quote = await quoteCart(data.items, data.couponCode);
    const number = orderNumber();
    const guestAccessToken = user
      ? null
      : crypto.randomUUID().replaceAll("-", "");

    // Create the order and reserve stock atomically.
    const created = await prisma.$transaction(async (tx) => {
      await reserveInventory(tx, quote.lines, number);

      const address = savedAddress
        ? savedAddress
        : user
          ? await tx.address.create({
              data: {
                ...deliveryAddress,
                userId: user.id,
                label: "Checkout",
                isDefault: false,
              },
            })
          : null;

      const order = await tx.order.create({
        data: {
          orderNumber: number,
          userId: user?.id,
          addressId: address?.id,
          guestEmail: user ? null : data.customer.email,
          guestAccessToken,
          customerName: deliveryAddress.name,
          customerPhone: deliveryAddress.phone,
          deliveryAddress,
          subtotal: quote.subtotal,
          shipping: quote.shipping,
          discount: quote.discount,
          total: quote.total,
          couponCode: quote.coupon?.code,
          paymentMethod: data.paymentMethod,
          items: {
            create: quote.lines.map((line) => ({
              variantId: line.variant.id,
              productName: line.variant.product.name,
              sku: line.variant.sku,
              size: line.variant.size,
              color: line.variant.color,
              image: line.variant.product.images[0]?.url,
              unitPrice: line.variant.price,
              quantity: line.quantity,
            })),
          },
          payment: {
            create: {
              amount: quote.total,
              status: "PENDING",
            },
          },
        },
      });

      if (quote.coupon) {
        await tx.coupon.update({
          where: { id: quote.coupon.id },
          data: {
            usedCount: { increment: 1 },
            usages: {
              create: {
                userId: user?.id,
                orderId: order.id,
              },
            },
          },
        });
      }

      return order;
    }, transactionOptions);

    // COD: confirm payment and reserved inventory atomically.
    if (data.paymentMethod === "COD") {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { orderId: created.id },
          data: {
            status: "AUTHORIZED",
            provider: "cod",
          },
        });

        await tx.order.update({
          where: { id: created.id },
          data: {
            status: "PAYMENT_CONFIRMED",
            paymentStatus: "AUTHORIZED",
          },
        });

        await confirmInventory(tx, created.id);
      }, transactionOptions);

      return NextResponse.json({
        success: true,
        orderNumber: created.orderNumber,
        guestAccessToken: guestAccessToken || undefined,
        paymentMethod: "COD",
      });
    }

    // Razorpay: create the provider order after the database transaction.
    try {
      const rp = await createRazorpayOrder({
        amount: quote.total,
        receipt: created.orderNumber,
        notes: { orderNumber: created.orderNumber },
      });

      await prisma.payment.update({
        where: { orderId: created.id },
        data: { providerOrderId: rp.id },
      });

      return NextResponse.json({
        success: true,
        orderNumber: created.orderNumber,
        guestAccessToken: guestAccessToken || undefined,
        razorpayOrderId: rp.id,
        amount: rp.amount,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      // Mark the pending order failed and release its reserved inventory.
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: created.id },
          select: { status: true },
        });

        if (order?.status !== "PENDING") {
          return;
        }

        await tx.payment.update({
          where: { orderId: created.id },
          data: { status: "FAILED" },
        });

        await tx.order.update({
          where: { id: created.id },
          data: {
            status: "CANCELLED",
            paymentStatus: "FAILED",
          },
        });

        await releaseInventory(tx, created.id);

        if (created.couponCode) {
          const coupon = await tx.coupon.findUnique({
            where: { code: created.couponCode },
          });

          if (coupon) {
            await tx.couponUsage.deleteMany({
              where: { orderId: created.id },
            });

            await tx.coupon.update({
              where: { id: coupon.id },
              data: {
                usedCount: { decrement: 1 },
              },
            });
          }
        }
      }, transactionOptions);

      throw error;
    }
  } catch (error) {
    console.error("checkout/create-order", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Checkout failed. Please try again.",
      },
      { status: 500 },
    );
  }
}
