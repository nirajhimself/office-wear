import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { releaseInventory, restockInventory } from "@/lib/commerce";
import { refundRazorpayPayment } from "@/lib/payments/razorpay";
export async function POST(_: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params; const user = await getCurrentUser();
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { payment: true } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.userId && order.userId !== user?.id) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!["PENDING", "PAYMENT_CONFIRMED", "PROCESSING"].includes(order.status)) return NextResponse.json({ error: "This order can no longer be cancelled." }, { status: 400 });
  if (order.paymentStatus === "PAID" && order.payment?.providerPaymentId) await refundRazorpayPayment(order.payment.providerPaymentId, order.total);
  await prisma.$transaction(async (tx) => { await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED", paymentStatus: order.paymentStatus === "PAID" ? "REFUNDED" : order.paymentStatus } }); await tx.payment.update({ where: { orderId: order.id }, data: { status: order.paymentStatus === "PAID" ? "REFUNDED" : order.paymentStatus } }); if (order.status === "PENDING") await releaseInventory(tx, order.id); else await restockInventory(tx, order.id); });
  return NextResponse.json({ success: true });
}
