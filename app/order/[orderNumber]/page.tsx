import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  ArrowRight,
  PackageCheck,
  Wallet,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ReturnForm } from "@/components/orders/return-form";
import { CancelButton } from "@/components/orders/cancel-button";

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function orderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Order received",
    PAYMENT_CONFIRMED: "Order confirmed",
    PROCESSING: "Being prepared",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    RETURN_REQUESTED: "Return requested",
    RETURNED: "Returned",
    REFUNDED: "Refunded",
  };

  return labels[status] ?? status.replaceAll("_", " ");
}

function paymentStatusLabel(status: string, paymentMethod: string) {
  if (paymentMethod === "COD" && status !== "PAID" && status !== "REFUNDED") {
    return "Payment due on delivery";
  }

  const labels: Record<string, string> = {
    PENDING: "Payment pending",
    AUTHORIZED: "Payment authorized",
    PAID: "Paid",
    FAILED: "Payment failed",
    REFUNDED: "Refunded",
    PARTIALLY_REFUNDED: "Partially refunded",
  };

  return labels[status] ?? status.replaceAll("_", " ");
}

function statusTone(status: string) {
  if (["CANCELLED", "FAILED", "RETURNED"].includes(status)) {
    return "order-status-pill order-status-muted";
  }

  if (["DELIVERED", "PAID", "PAYMENT_CONFIRMED"].includes(status)) {
    return "order-status-pill order-status-success";
  }

  return "order-status-pill";
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ success?: string; token?: string }>;
}) {
  const { orderNumber } = await params;
  const { token } = await searchParams;
  const user = await getCurrentUser();

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      shipment: true,
    },
  });

  if (
    !order ||
    (order.userId && order.userId !== user?.id) ||
    (!order.userId && order.guestAccessToken !== token)
  ) {
    notFound();
  }

  const isCOD = order.paymentMethod === "COD";
  const orderLabel = orderStatusLabel(order.status);
  const paymentLabel = paymentStatusLabel(
    order.paymentStatus,
    order.paymentMethod,
  );

  return (
    <main className="order-confirmation">
      <header className="order-hero">
        <div className="order-success-icon">
          <CheckCircle2 size={28} strokeWidth={1.5} />
        </div>

        <span className="eyebrow-dark">OFFICE WEAR / ORDER</span>

        <h1>
          {order.status === "CANCELLED"
            ? "Order cancelled."
            : order.status === "DELIVERED"
              ? "Enjoy your order."
              : `Thank you, ${order.customerName.split(" ")[0]}.`}
        </h1>

        <p className="order-lede">
          {order.status === "CANCELLED"
            ? "This order has been cancelled. You can continue exploring our collection."
            : order.status === "DELIVERED"
              ? "Your order has been delivered. We hope these pieces become part of your everyday wardrobe."
              : "Your order details are below. We’ll keep you updated as your pieces make their way to your door."}
        </p>

        <div className="order-number-chip">
          <span>ORDER NUMBER</span>
          <strong>{order.orderNumber}</strong>
        </div>
      </header>

      <div className="order-confirmation-grid">
        <section className="order-items-panel">
          <div className="order-section-heading">
            <div>
              <span className="panel-kicker">YOUR SELECTION</span>
              <h2>Order items</h2>
            </div>
            <span className="order-item-count">
              {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
            </span>
          </div>

          <div className="order-items-list">
            {order.items.map((item) => (
              <article className="order-item" key={item.id}>
                <div className="order-item-mark">
                  <ShoppingBag size={19} strokeWidth={1.4} />
                </div>

                <div className="order-item-copy">
                  <strong>{item.productName}</strong>
                  <span>
                    {item.color} · {item.size} · Qty {item.quantity}
                  </span>
                  {item.sku && <small>SKU: {item.sku}</small>}
                </div>

                <b>{formatPrice(item.unitPrice * item.quantity)}</b>
              </article>
            ))}
          </div>

          {order.shipment?.trackingUrl && (
            <a
              href={order.shipment.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="order-track-link"
            >
              <PackageCheck size={17} />
              Track your shipment
              <ArrowRight size={15} />
            </a>
          )}
        </section>

        <aside className="order-details-panel">
          <span className="panel-kicker">ORDER OVERVIEW</span>

          <div className="order-detail-status">
            <div className="order-detail-icon">
              <PackageCheck size={18} />
            </div>

            <div className="order-detail-copy">
              <span>Order status</span>
              <strong>{orderLabel}</strong>
            </div>

            <span className={statusTone(order.status)}>
              {order.status === "CANCELLED"
                ? "Cancelled"
                : order.status === "DELIVERED"
                  ? "Delivered"
                  : "Confirmed"}
            </span>
          </div>

          <div className="order-detail-status">
            <div className="order-detail-icon">
              <Wallet size={18} />
            </div>

            <div className="order-detail-copy">
              <span>Payment method</span>
              <strong>{isCOD ? "Cash on Delivery" : "Online payment"}</strong>
            </div>
          </div>

          <div className="order-detail-status">
            <div className="order-detail-icon">
              <CheckCircle2 size={18} />
            </div>

            <div className="order-detail-copy">
              <span>Payment status</span>
              <strong>{paymentLabel}</strong>
            </div>
          </div>

          <div className="order-total-row">
            <span>Total amount</span>
            <strong>{formatPrice(order.total)}</strong>
          </div>

          {isCOD &&
            order.paymentStatus !== "PAID" &&
            order.status !== "CANCELLED" && (
              <p className="order-payment-note">
                <Wallet size={15} />
                Pay when your order arrives. No online payment has been
                collected for this COD order.
              </p>
            )}

          {user &&
            ["PENDING", "PAYMENT_CONFIRMED", "PROCESSING"].includes(
              order.status,
            ) && (
              <div className="order-action">
                <CancelButton orderNumber={order.orderNumber} />
              </div>
            )}

          {user && (
            <div className="order-action">
              <ReturnForm
                orderNumber={order.orderNumber}
                items={order.items.map((item) => ({
                  id: item.id,
                  productName: item.productName,
                  quantity: item.quantity,
                }))}
              />
            </div>
          )}
        </aside>
      </div>

      <footer className="order-next">
        <Link href="/shop">
          Continue shopping <ArrowRight size={15} />
        </Link>

        {user && (
          <Link href="/account">
            View your account <ArrowRight size={15} />
          </Link>
        )}
      </footer>
    </main>
  );
}
