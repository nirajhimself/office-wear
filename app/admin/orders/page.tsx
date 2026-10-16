import Link from "next/link";
import { prisma } from "@/lib/prisma";

import {
  updateOrderStatus,
  createShipmentForOrder,
  updateShipmentStatus,
} from "@/lib/admin/actions";

type SearchParams = Promise<{
  q?: string;
  status?: string;
  paymentMethod?: string;
}>;

const ORDER_STATUSES = [
  "PENDING",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
];

const PAYMENT_METHODS = ["COD", "RAZORPAY"];

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatAddress(address: unknown) {
  if (!address) return "No delivery address saved.";

  if (typeof address === "string") return address;

  if (typeof address === "object") {
    const data = address as Record<string, unknown>;

    const preferredKeys = [
      "name",
      "fullName",
      "phone",
      "address",
      "addressLine1",
      "addressLine2",
      "line1",
      "line2",
      "landmark",
      "city",
      "state",
      "postalCode",
      "pincode",
      "zip",
      "country",
    ];

    const parts = preferredKeys
      .map((key) => data[key])
      .filter(
        (value) => typeof value === "string" && value.trim().length > 0,
      ) as string[];

    if (parts.length) return parts.join(", ");

    return JSON.stringify(address, null, 2);
  }

  return String(address);
}

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = params.status ?? "";
  const paymentMethod = params.paymentMethod ?? "";

  const validStatus = ORDER_STATUSES.includes(status) ? status : "";
  const validPaymentMethod = PAYMENT_METHODS.includes(paymentMethod)
    ? paymentMethod
    : "";

  const orders = await prisma.order.findMany({
    where: {
      ...(validStatus ? { status: validStatus as never } : {}),
      ...(validPaymentMethod
        ? { paymentMethod: validPaymentMethod as never }
        : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: "insensitive" } },
              { customerName: { contains: q, mode: "insensitive" } },
              { guestEmail: { contains: q, mode: "insensitive" } },
              { customerPhone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      items: true,
      payment: true,
      shipment: true,
    },
  });

  const [totalOrders, pendingOrders, codDueOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: { status: "PENDING" },
    }),
    prisma.order.count({
      where: {
        paymentMethod: "COD",
        paymentStatus: { notIn: ["PAID", "REFUNDED"] },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
    }),
  ]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <span className="eyebrow-dark">ORDERS / FULFILMENT</span>
          <h1>
            Every order,
            <br />
            <em>under control.</em>
          </h1>
          <p>Search orders, review payment collection and manage fulfilment.</p>
        </div>
        <Link className="button button-dark" href="/shop">
          View storefront →
        </Link>
      </div>

      <div className="admin-stats">
        <div>
          <span>All orders</span>
          <strong>{totalOrders}</strong>
        </div>
        <div>
          <span>Pending orders</span>
          <strong>{pendingOrders}</strong>
        </div>
        <div>
          <span>COD collection pending</span>
          <strong>{codDueOrders}</strong>
        </div>
        <div>
          <span>Results shown</span>
          <strong>{orders.length}</strong>
        </div>
      </div>

      <form method="GET" className="admin-order-filters">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search order, customer, email or phone"
          aria-label="Search orders"
        />

        <select
          name="status"
          defaultValue={validStatus}
          aria-label="Filter by order status"
        >
          <option value="">All order statuses</option>
          {ORDER_STATUSES.map((item) => (
            <option key={item} value={item}>
              {formatLabel(item)}
            </option>
          ))}
        </select>

        <select
          name="paymentMethod"
          defaultValue={validPaymentMethod}
          aria-label="Filter by payment method"
        >
          <option value="">All payment methods</option>
          <option value="COD">Cash on delivery</option>
          <option value="RAZORPAY">Online payment</option>
        </select>

        <button className="button button-dark" type="submit">
          Apply filters
        </button>

        <Link className="admin-filter-reset" href="/admin/orders">
          Reset
        </Link>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Order status</th>
              <th>Update status</th>
              <th>Shipment</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => {
              const isCod = order.paymentMethod === "COD";
              const isPaid = order.paymentStatus === "PAID";
              const isClosed = ["CANCELLED", "REFUNDED"].includes(order.status);

              const paymentLabel = isCod
                ? isPaid
                  ? "COD collected"
                  : isClosed
                    ? "Not collectible"
                    : "Payment due on delivery"
                : formatLabel(order.paymentStatus);

              return (
                <>
                  <tr key={order.id}>
                    <td>
                      <strong>{order.orderNumber}</strong>
                      <small>{order.createdAt.toLocaleString("en-IN")}</small>
                      <small>{order.items.length} line items</small>
                    </td>

                    <td>
                      <strong>{order.customerName}</strong>
                      <small>{order.guestEmail || "Account customer"}</small>
                      {order.customerPhone && (
                        <small>{order.customerPhone}</small>
                      )}
                    </td>

                    <td>
                      <strong>{formatMoney(order.total)}</strong>
                      <small>{formatLabel(order.paymentMethod)}</small>
                    </td>

                    <td>
                      <strong>{paymentLabel}</strong>
                      <small>Status: {formatLabel(order.paymentStatus)}</small>
                      {order.payment?.providerPaymentId && (
                        <small>Ref: {order.payment.providerPaymentId}</small>
                      )}
                    </td>

                    <td>
                      <span
                        className={`status-pill status-${order.status.toLowerCase()}`}
                      >
                        {formatLabel(order.status)}
                      </span>
                    </td>

                    <td>
                      <form action={updateOrderStatus} className="inline-form">
                        <input type="hidden" name="id" value={order.id} />
                        <select
                          name="status"
                          defaultValue={order.status}
                          aria-label={`Status for ${order.orderNumber}`}
                        >
                          {ORDER_STATUSES.map((item) => (
                            <option key={item} value={item}>
                              {formatLabel(item)}
                            </option>
                          ))}
                        </select>
                        <button type="submit">Save</button>
                      </form>
                    </td>

                    <td>
                      {order.shipment ? (
                        <div className="admin-shipment-controls">
                          <strong>
                            {order.shipment.awb || "Shipment created"}
                          </strong>
                          <small>
                            {order.shipment.courierName ||
                              "Courier not assigned"}
                          </small>

                          {order.shipment.trackingUrl && (
                            <small>
                              <a
                                href={order.shipment.trackingUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Track shipment ↗
                              </a>
                            </small>
                          )}

                          <small>
                            Current:{" "}
                            {order.shipment.status.replaceAll("_", " ")}
                          </small>

                          <form
                            action={updateShipmentStatus}
                            className="inline-form"
                          >
                            <input
                              type="hidden"
                              name="shipmentId"
                              value={order.shipment.id}
                            />

                            <select
                              name="status"
                              defaultValue={order.shipment.status}
                              aria-label={`Shipment status for ${order.orderNumber}`}
                            >
                              {[
                                "PENDING",
                                "LABEL_CREATED",
                                "PICKED_UP",
                                "IN_TRANSIT",
                                "OUT_FOR_DELIVERY",
                                "DELIVERED",
                                "CANCELLED",
                                "RETURNED",
                              ].map((shipmentStatus) => (
                                <option
                                  key={shipmentStatus}
                                  value={shipmentStatus}
                                >
                                  {shipmentStatus.replaceAll("_", " ")}
                                </option>
                              ))}
                            </select>

                            <button type="submit">Update shipment</button>
                          </form>
                        </div>
                      ) : (
                        <form action={createShipmentForOrder}>
                          <input
                            type="hidden"
                            name="orderId"
                            value={order.id}
                          />
                          <button
                            className="admin-ship-button"
                            type="submit"
                            disabled={
                              !order.deliveryAddress ||
                              ["CANCELLED", "REFUNDED"].includes(order.status)
                            }
                          >
                            Create shipment
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>

                  <tr key={`${order.id}-details`}>
                    <td colSpan={7}>
                      <details className="admin-order-details">
                        <summary>View full order · {order.orderNumber}</summary>

                        <div className="admin-order-detail-grid">
                          <section>
                            <h3>Delivery address</h3>
                            <p>{formatAddress(order.deliveryAddress)}</p>
                          </section>

                          <section>
                            <h3>Payment breakdown</h3>
                            <p>Subtotal: {formatMoney(order.subtotal)}</p>
                            <p>Shipping: {formatMoney(order.shipping)}</p>
                            <p>Discount: {formatMoney(order.discount)}</p>
                            <p>
                              <strong>Total: {formatMoney(order.total)}</strong>
                            </p>
                            <p>Method: {formatLabel(order.paymentMethod)}</p>
                            <p>Status: {formatLabel(order.paymentStatus)}</p>
                            {order.couponCode && (
                              <p>Coupon: {order.couponCode}</p>
                            )}
                          </section>

                          <section>
                            <h3>Items ordered</h3>
                            {order.items.map((item) => (
                              <div className="admin-order-item" key={item.id}>
                                <div>
                                  <strong>{item.productName}</strong>
                                  <small>SKU: {item.sku}</small>
                                  <small>
                                    Size: {item.size} · Colour: {item.color}
                                  </small>
                                  <small>
                                    Quantity: {item.quantity} ×{" "}
                                    {formatMoney(item.unitPrice)}
                                  </small>
                                </div>
                                <strong>
                                  {formatMoney(item.unitPrice * item.quantity)}
                                </strong>
                              </div>
                            ))}
                          </section>

                          <section>
                            <h3>Fulfilment</h3>
                            <p>Order status: {formatLabel(order.status)}</p>
                            <p>
                              Shipment:{" "}
                              {order.shipment
                                ? formatLabel(order.shipment.status)
                                : "Not created"}
                            </p>
                            {order.shipment?.awb && (
                              <p>AWB: {order.shipment.awb}</p>
                            )}
                            {order.shipment?.courierName && (
                              <p>Courier: {order.shipment.courierName}</p>
                            )}
                          </section>
                        </div>
                      </details>
                    </td>
                  </tr>
                </>
              );
            })}

            {orders.length === 0 && (
              <tr>
                <td colSpan={7}>
                  No orders match these filters. Try another search or reset the
                  filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="admin-order-note">
        Showing up to 100 matching orders, newest first. COD is marked as
        collected only when the payment status is PAID; this page does not mark
        a COD payment as collected automatically.
      </p>
    </div>
  );
}
