import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/payments/razorpay";
import { confirmInventory } from "@/lib/commerce";

const schema = z.object({ orderNumber: z.string(), razorpayOrderId: z.string(), razorpayPaymentId: z.string(), razorpaySignature: z.string() });
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid payment response." }, { status: 400 });
    if (!verifyRazorpaySignature(parsed.data.razorpayOrderId, parsed.data.razorpayPaymentId, parsed.data.razorpaySignature)) return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
    const order = await prisma.order.findUnique({ where: { orderNumber: parsed.data.orderNumber }, include: { payment: true } });
    if (!order || !order.payment || order.payment.providerOrderId !== parsed.data.razorpayOrderId) return NextResponse.json({ error: "Order could not be verified." }, { status: 404 });
    if (order.payment.status === "PAID") return NextResponse.json({ success: true, orderNumber: order.orderNumber });
    await prisma.$transaction(async (tx) => { const paymentUpdate = await tx.payment.updateMany({ where: { orderId: order.id, status: { not: "PAID" } }, data: { providerPaymentId: parsed.data.razorpayPaymentId, signature: parsed.data.razorpaySignature, status: "PAID" } }); if (paymentUpdate.count) { await tx.order.update({ where: { id: order.id }, data: { status: "PAYMENT_CONFIRMED", paymentStatus: "PAID" } }); await confirmInventory(tx, order.id); } });
    return NextResponse.json({ success: true, orderNumber: order.orderNumber });
  } catch (error) { console.error("checkout/verify", error); return NextResponse.json({ error: "Payment verification failed." }, { status: 500 }); }
}
