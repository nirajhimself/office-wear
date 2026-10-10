import "server-only";
import { prisma } from "@/lib/prisma";

export type CheckoutItem = { productId: string; size: string; color: string; quantity: number };

export function money(value: number) { return `₹${value.toLocaleString("en-IN")}`; }

export async function quoteCart(items: CheckoutItem[], couponCode?: string) {
  if (!items.length) throw new Error("Your bag is empty.");
  const variants = await prisma.productVariant.findMany({ where: { id: { in: items.map((i) => `${i.productId}-${i.size}-${i.color}`) } }, include: { inventory: true, product: { include: { images: { orderBy: { sortOrder: "asc" } } } } } });
  if (variants.length !== items.length) throw new Error("One or more items are no longer available.");
  const lines = items.map((item) => {
    const variant = variants.find((v) => v.id === `${item.productId}-${item.size}-${item.color}`)!;
    const available = (variant.inventory?.stock ?? 0);
    if (item.quantity < 1 || item.quantity > 10) throw new Error("Quantity must be between 1 and 10.");
    if (available < item.quantity) throw new Error(`${variant.product.name} is not available in the requested quantity.`);
    return { variant, quantity: item.quantity, lineTotal: variant.price * item.quantity };
  });
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  let discount = 0;
  let coupon: { id: string; code: string } | null = null;
  if (couponCode) {
    const code = couponCode.trim().toUpperCase();
    const found = await prisma.coupon.findUnique({ where: { code } });
    const now = new Date();
    if (found && found.active && (!found.startsAt || found.startsAt <= now) && (!found.endsAt || found.endsAt >= now) && subtotal >= found.minOrderValue && (!found.maxUses || found.usedCount < found.maxUses)) {
      discount = found.type === "PERCENT" ? Math.min(subtotal, Math.floor(subtotal * found.value / 100)) : Math.min(subtotal, found.value);
      coupon = { id: found.id, code: found.code };
    }
  }
  const shipping = Math.max(0, subtotal - discount) >= 1999 ? 0 : 99;
  return { lines, subtotal, shipping, discount, total: subtotal + shipping - discount, coupon };
}

export async function reserveInventory(tx: any, lines: Awaited<ReturnType<typeof quoteCart>>["lines"], reference: string) {
  for (const line of lines) {
    const inventory = await tx.inventory.findUnique({ where: { variantId: line.variant.id } });
    if (!inventory || inventory.stock < line.quantity) throw new Error(`${line.variant.product.name} went out of stock. Please refresh your bag.`);
    await tx.inventory.update({ where: { id: inventory.id }, data: { stock: { decrement: line.quantity }, reserved: { increment: line.quantity }, transactions: { create: { type: "RESERVATION", quantity: line.quantity, reference } } } });
  }
}

export async function confirmInventory(tx: any, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    const inventory = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
    if (!inventory) continue;
    await tx.inventory.update({ where: { id: inventory.id }, data: { reserved: { decrement: item.quantity }, transactions: { create: { type: "SALE", quantity: item.quantity, reference: orderId } } } });
  }
}

export async function releaseInventory(tx: any, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    const inventory = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
    if (!inventory) continue;
    await tx.inventory.update({ where: { id: inventory.id }, data: { stock: { increment: item.quantity }, reserved: { decrement: item.quantity }, transactions: { create: { type: "RELEASE", quantity: item.quantity, reference: orderId } } } });
  }
}

export async function restockInventory(tx: any, orderId: string, type: "RETURN" | "ADJUSTMENT" = "RETURN") {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    const inventory = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
    if (!inventory) continue;
    await tx.inventory.update({ where: { id: inventory.id }, data: { stock: { increment: item.quantity }, transactions: { create: { type, quantity: item.quantity, reference: orderId } } } });
  }
}

export async function restockReturnItems(tx: any, returnId: string) {
  const items = await tx.returnItem.findMany({ where: { returnId }, include: { orderItem: true } });
  for (const item of items) {
    const inventory = await tx.inventory.findUnique({ where: { variantId: item.orderItem.variantId } });
    if (!inventory) continue;
    await tx.inventory.update({ where: { id: inventory.id }, data: { stock: { increment: item.quantity }, transactions: { create: { type: "RETURN", quantity: item.quantity, reference: returnId } } } });
  }
}
