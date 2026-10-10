import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { quoteCart, reserveInventory, confirmInventory } from "@/lib/commerce";
import { createRazorpayOrder } from "@/lib/payments/razorpay";

const schema = z.object({
  items: z.array(z.object({ productId: z.string(), size: z.string(), color: z.string(), quantity: z.number().int().min(1).max(10) })).min(1),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  couponCode: z.string().trim().max(32).optional(),
  customer: z.object({ name: z.string().trim().min(2).max(100), email: z.string().email().optional(), phone: z.string().trim().min(10).max(15), line1: z.string().trim().min(3).max(150), line2: z.string().trim().max(150).optional(), city: z.string().trim().min(2).max(80), state: z.string().trim().min(2).max(80), postalCode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code."), country: z.string().default("India") })
});

function orderNumber() { const now = new Date(); return `OW${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${crypto.randomUUID().slice(0,8).toUpperCase()}`; }

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid checkout details." }, { status: 400 });
    const user = await getCurrentUser();
    if (!user && !parsed.data.customer.email) return NextResponse.json({ error: "Email is required for guest checkout." }, { status: 400 });
    const quote = await quoteCart(parsed.data.items, parsed.data.couponCode);
    const number = orderNumber();
    const guestAccessToken = user ? null : crypto.randomUUID().replaceAll("-", "");
    const created = await prisma.$transaction(async (tx) => {
      await reserveInventory(tx, quote.lines, number);
      const address = user ? await tx.address.create({ data: { userId: user.id, name: parsed.data.customer.name, phone: parsed.data.customer.phone, line1: parsed.data.customer.line1, line2: parsed.data.customer.line2 || null, city: parsed.data.customer.city, state: parsed.data.customer.state, postalCode: parsed.data.customer.postalCode, country: parsed.data.customer.country } }) : null;
      const order = await tx.order.create({ data: { orderNumber: number, userId: user?.id, addressId: address?.id, guestEmail: user ? null : parsed.data.customer.email, guestAccessToken, customerName: parsed.data.customer.name, customerPhone: parsed.data.customer.phone, deliveryAddress: parsed.data.customer, subtotal: quote.subtotal, shipping: quote.shipping, discount: quote.discount, total: quote.total, couponCode: quote.coupon?.code, paymentMethod: parsed.data.paymentMethod, items: { create: quote.lines.map((line) => ({ variantId: line.variant.id, productName: line.variant.product.name, sku: line.variant.sku, size: line.variant.size, color: line.variant.color, image: line.variant.product.images[0]?.url, unitPrice: line.variant.price, quantity: line.quantity })) }, payment: { create: { amount: quote.total, status: "PENDING" } }, ...(quote.coupon ? { } : {}) } });
      if (quote.coupon) await tx.coupon.update({ where: { id: quote.coupon.id }, data: { usedCount: { increment: 1 }, usages: { create: { userId: user?.id, orderId: order.id } } } });
      return order;
    });

    if (parsed.data.paymentMethod === "COD") {
      await prisma.$transaction(async (tx) => { await tx.payment.update({ where: { orderId: created.id }, data: { status: "AUTHORIZED", provider: "cod" } }); await tx.order.update({ where: { id: created.id }, data: { status: "PAYMENT_CONFIRMED", paymentStatus: "AUTHORIZED" } }); await confirmInventory(tx, created.id); });
      return NextResponse.json({ success: true, orderNumber: created.orderNumber, guestAccessToken: guestAccessToken || undefined, paymentMethod: "COD" });
    }

    try {
      const rp = await createRazorpayOrder({ amount: quote.total, receipt: created.orderNumber, notes: { orderNumber: created.orderNumber } });
      await prisma.payment.update({ where: { orderId: created.id }, data: { providerOrderId: rp.id } });
      return NextResponse.json({ success: true, orderNumber: created.orderNumber, guestAccessToken: guestAccessToken || undefined, razorpayOrderId: rp.id, amount: rp.amount, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
      await prisma.$transaction(async (tx) => { const order = await tx.order.findUnique({ where: { id: created.id }, select: { status: true } }); if (order?.status === "PENDING") { await tx.payment.update({ where: { orderId: created.id }, data: { status: "FAILED" } }); await tx.order.update({ where: { id: created.id }, data: { status: "CANCELLED", paymentStatus: "FAILED" } }); await (await import("@/lib/commerce")).releaseInventory(tx, created.id); if (created.couponCode) { const coupon = await tx.coupon.findUnique({ where: { code: created.couponCode } }); if (coupon) { await tx.couponUsage.deleteMany({ where: { orderId: created.id } }); await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { decrement: 1 } } }); } } } });
      throw error;
    }
  } catch (error) {
    console.error("checkout/create-order", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout failed. Please try again." }, { status: 500 });
  }
}
