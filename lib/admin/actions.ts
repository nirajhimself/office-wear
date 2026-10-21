"use server";

import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { restockReturnItems } from "@/lib/commerce";

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();

  const status = z
    .enum([
      "PENDING",
      "PAYMENT_CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "RETURN_REQUESTED",
      "RETURNED",
      "REFUNDED",
    ])
    .parse(formData.get("status"));

  if (!id) {
    throw new Error("Order ID is required.");
  }

  const existing = await prisma.order.findUnique({
    where: { id },
    include: {
      payment: true,
      shipment: true,
    },
  });

  if (!existing) {
    throw new Error("Order not found.");
  }

  if (existing.status === status) {
    revalidatePath("/admin/orders");
    return;
  }

  if (["CANCELLED", "RETURNED", "REFUNDED"].includes(existing.status)) {
    throw new Error(
      "This order is already closed. Use the appropriate return or refund workflow.",
    );
  }

  if (["RETURN_REQUESTED", "RETURNED", "REFUNDED"].includes(status)) {
    throw new Error("Process returns and refunds through the Returns section.");
  }

  if (existing.status === "DELIVERED") {
    throw new Error("Delivered orders cannot be changed through this action.");
  }

  if (status === "CANCELLED") {
    if (existing.paymentStatus === "PAID") {
      throw new Error(
        "This order has been paid. Use the cancellation and refund workflow.",
      );
    }

    if (existing.shipment) {
      throw new Error(
        "A shipment already exists. Resolve the shipment before cancelling this order.",
      );
    }

    if (
      !["PENDING", "PAYMENT_CONFIRMED", "PROCESSING"].includes(existing.status)
    ) {
      throw new Error(
        "This order cannot be cancelled from its current status.",
      );
    }
  }

  const allowedTransitions: Record<string, string[]> = {
    PENDING: ["PAYMENT_CONFIRMED", "PROCESSING", "CANCELLED"],
    PAYMENT_CONFIRMED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
  };

  if (!allowedTransitions[existing.status]?.includes(status)) {
    throw new Error(
      `Cannot change an order from ${existing.status.replaceAll("_", " ")} to ${status.replaceAll("_", " ")}.`,
    );
  }

  await prisma.$transaction(async (tx) => {
    if (status === "CANCELLED") {
      const { releaseInventory, restockInventory } =
        await import("@/lib/commerce");

      if (existing.status === "PENDING") {
        await releaseInventory(tx, id);
      } else {
        await restockInventory(tx, id, "ADJUSTMENT");
      }
    }

    await tx.order.update({
      where: { id },
      data: { status },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/analytics");
  revalidatePath("/account");
  revalidatePath(`/order/${existing.orderNumber}`);
}

export async function adjustInventory(formData: FormData) {
  await requireAdmin();
  const variantId = String(formData.get("variantId"));
  const quantity = Number(formData.get("quantity"));
  if (!Number.isInteger(quantity) || quantity === 0)
    throw new Error("Quantity must be a non-zero integer.");
  await prisma.$transaction(async (tx) => {
    const inv = await tx.inventory.findUnique({ where: { variantId } });
    if (!inv) throw new Error("Inventory record not found.");
    const next = inv.stock + quantity;
    if (next < 0) throw new Error("Stock cannot be negative.");
    await tx.inventory.update({
      where: { id: inv.id },
      data: {
        stock: next,
        transactions: {
          create: {
            type: quantity > 0 ? "RECEIPT" : "ADJUSTMENT",
            quantity: Math.abs(quantity),
            note: String(formData.get("note") || "Admin adjustment"),
          },
        },
      },
    });
  });
  revalidatePath("/admin/inventory");
  revalidatePath("/shop");
}
export async function createCoupon(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get("code")).trim().toUpperCase();
  const type = z.enum(["PERCENT", "FIXED"]).parse(formData.get("type"));
  const value = Number(formData.get("value"));
  const minOrderValue = Number(formData.get("minOrderValue") || 0);
  if (!code || !Number.isInteger(value) || value <= 0)
    throw new Error("Invalid coupon.");
  await prisma.coupon.create({
    data: { code, type, value, minOrderValue, active: true },
  });
  revalidatePath("/admin/coupons");
}
/*
  Variant IDs MUST be `${productId}-${size}-${color}` with the size and colour
  spelled exactly as they are stored. quoteCart() in lib/commerce.ts rebuilds
  this string from the cart payload to find the variant — nothing in the schema
  enforces the shape, so a different format here silently breaks checkout with
  "One or more items are no longer available."
*/
function variantKey(productId: string, size: string, color: string) {
  return `${productId}-${size}-${color}`;
}

function splitList(value: FormDataEntryValue | null) {
  return [
    ...new Set(
      String(value ?? "")
        .split(/[,\n]/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  ];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Mirrors prisma/seed.js: OW-<id>-<SIZE>-<COLOUR>
function skuFor(base: string, size: string, color: string) {
  const part = (value: string) =>
    value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${part(base)}-${part(size)}-${part(color)}`;
}

/*
  Local files under public/ (e.g. /products/oxford-shirt-01.jpg) need no
  next.config allowlist. A remote URL does — see images.remotePatterns there.
*/
function assertImageAllowed(url: string) {
  if (url.startsWith("/")) return;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      `"${url}" is not a valid image. Use /products/your-file.jpg for an uploaded photo, or a full https:// URL.`,
    );
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Remote images must be served over https.");
  }
  const allowed = (process.env.IMAGE_HOSTS ?? "images.unsplash.com")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
  if (!allowed.includes(parsed.host)) {
    throw new Error(
      `Images from ${parsed.host} are blocked. Add it to IMAGE_HOSTS in .env and to images.remotePatterns in next.config.ts, or upload the file to public/products/ and use /products/your-file.jpg.`,
    );
  }
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "") || name);
  const description = String(formData.get("description") ?? "").trim();
  const gender = String(formData.get("gender") ?? "Unisex");
  const categorySlug = slugify(String(formData.get("category") ?? ""));
  const price = Number(formData.get("price"));
  const compareAtRaw = String(formData.get("compareAt") ?? "").trim();
  const compareAt = compareAtRaw ? Number(compareAtRaw) : null;
  const stock = Number(formData.get("stock") ?? 0);
  const sizes = splitList(formData.get("sizes"));
  const colors = splitList(formData.get("colors"));
  const images = splitList(formData.get("images"));
  const skuBase = String(formData.get("skuBase") ?? "").trim();
  const featured = formData.get("featured") === "on";
  const status = z
    .enum(["DRAFT", "ACTIVE"])
    .parse(formData.get("status") ?? "DRAFT");

  if (!name) throw new Error("Product name is required.");
  if (!slug) throw new Error("Could not build a URL slug from that name.");
  if (!description) throw new Error("A description is required.");
  if (!skuBase) throw new Error("An SKU prefix is required (e.g. OW-201).");
  if (!Number.isInteger(price) || price <= 0)
    throw new Error("Price must be a whole number of rupees, e.g. 2490.");
  if (compareAt !== null && (!Number.isInteger(compareAt) || compareAt <= price))
    throw new Error(
      "The compare-at price must be a whole number higher than the selling price.",
    );
  if (!Number.isInteger(stock) || stock < 0)
    throw new Error("Opening stock must be zero or a positive whole number.");
  if (!sizes.length) throw new Error("Add at least one size, e.g. S, M, L, XL.");
  if (!colors.length) throw new Error("Add at least one colour.");
  if (!images.length)
    throw new Error("Add at least one image. Two makes the hover effect work.");
  images.forEach(assertImageAllowed);

  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
  });
  if (!category)
    throw new Error(
      `No category matches "${categorySlug}". Pick one from the list.`,
    );

  const clash = await prisma.product.findUnique({ where: { slug } });
  if (clash)
    throw new Error(
      `The slug "${slug}" is already used by ${clash.name}. Choose another.`,
    );

  const collection = await prisma.collection.findUnique({
    where: { slug: "the-sectioned-edit" },
  });

  const productId = `ow-${crypto.randomUUID().slice(0, 8)}`;

  const variants = sizes.flatMap((size) =>
    colors.map((color) => ({
      id: variantKey(productId, size, color),
      sku: skuFor(skuBase, size, color),
      size,
      color,
      price,
      ...(compareAt !== null ? { compareAt } : {}),
      inventory: { create: { stock } },
    })),
  );

  const takenSkus = await prisma.productVariant.findMany({
    where: { sku: { in: variants.map((variant) => variant.sku) } },
    select: { sku: true },
  });
  if (takenSkus.length)
    throw new Error(
      `These SKUs already exist: ${takenSkus.map((v) => v.sku).join(", ")}. Use a different SKU prefix.`,
    );

  await prisma.product.create({
    data: {
      id: productId,
      name,
      slug,
      description,
      gender,
      categoryId: category.id,
      collectionId: collection?.id,
      status,
      featured,
      variants: { create: variants },
      images: {
        create: images.map((url, index) => ({
          url,
          alt: name,
          sortOrder: index,
        })),
      },
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath(`/product/${slug}`);
}

export async function processReturn(formData: FormData) {
  await requireAdmin();
  const returnId = String(formData.get("returnId"));
  const action = String(formData.get("action"));
  const ret = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { order: { include: { payment: true } }, items: true },
  });
  if (!ret) throw new Error("Return request not found.");
  if (action === "REJECT") {
    await prisma.returnRequest.update({
      where: { id: returnId },
      data: { status: "REJECTED" },
    });
    revalidatePath("/admin/returns");
    return;
  }
  if (action !== "APPROVE") throw new Error("Invalid return action.");
  if (ret.status !== "REQUESTED")
    throw new Error("This return has already been processed.");
  if (
    ret.order.paymentStatus === "PAID" &&
    ret.order.payment?.providerPaymentId
  ) {
    const { refundRazorpayPayment } = await import("@/lib/payments/razorpay");
    const response = await refundRazorpayPayment(
      ret.order.payment.providerPaymentId,
      ret.refundAmount,
    );
    await prisma.$transaction(async (tx) => {
      await tx.refund.create({
        data: {
          returnId,
          paymentId: ret.order.payment?.id,
          providerRefundId: response?.id,
          amount: ret.refundAmount,
          status: "REFUNDED",
          rawResponse: response,
        },
      });
      await tx.returnRequest.update({
        where: { id: returnId },
        data: { status: "REFUNDED" },
      });
      await restockReturnItems(tx, returnId);
      await tx.order.update({
        where: { id: ret.order.id },
        data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
      });
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.refund.create({
        data: {
          returnId,
          paymentId: ret.order.payment?.id,
          amount: ret.refundAmount,
          status: "AUTHORIZED",
        },
      });
      await tx.returnRequest.update({
        where: { id: returnId },
        data: { status: "REFUNDED" },
      });
      await restockReturnItems(tx, returnId);
      await tx.order.update({
        where: { id: ret.order.id },
        data: { status: "REFUNDED" },
      });
    });
  }
  revalidatePath("/admin/returns");
  revalidatePath("/admin/orders");
}

export async function createShipmentForOrder(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId"));
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, shipment: true },
  });
  if (!order || !order.deliveryAddress || order.shipment)
    throw new Error(
      "Order is missing a shipment-ready address or already has a shipment.",
    );
  const { shippingProvider } = await import("@/lib/shipping");
  const result = await shippingProvider.createShipment({
    orderNumber: order.orderNumber,
    address: order.deliveryAddress as any,
    items: order.items.map((i) => ({
      name: i.productName,
      sku: i.sku,
      quantity: i.quantity,
      price: i.unitPrice,
    })),
    total: order.total,
    paymentMethod: order.paymentMethod,
  });
  await prisma.shipment.create({
    data: {
      orderId: order.id,
      providerOrderId: result.providerOrderId,
      shipmentId: result.shipmentId,
      awb: result.awb,
      courierName: result.courierName,
      trackingUrl: result.trackingUrl,
      status: "LABEL_CREATED",
      rawResponse: result.rawResponse as any,
    },
  });
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "PROCESSING" },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/order/${order.orderNumber}`);
}

export async function updateShipmentStatus(formData: FormData) {
  await requireAdmin();

  const shipmentId = String(formData.get("shipmentId") ?? "").trim();

  const status = z
    .enum([
      "PENDING",
      "LABEL_CREATED",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
    ])
    .parse(formData.get("status"));

  if (!shipmentId) {
    throw new Error("Shipment ID is required.");
  }

  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { order: true },
  });

  if (!shipment) {
    throw new Error("Shipment not found.");
  }

  if (shipment.status === status) {
    revalidatePath("/admin/orders");
    return;
  }

  if (["CANCELLED", "RETURNED", "DELIVERED"].includes(shipment.status)) {
    throw new Error("This shipment is already in a final state.");
  }

  const allowedTransitions: Record<string, string[]> = {
    PENDING: ["LABEL_CREATED", "CANCELLED"],
    LABEL_CREATED: ["PICKED_UP", "CANCELLED"],
    PICKED_UP: ["IN_TRANSIT", "CANCELLED"],
    IN_TRANSIT: ["OUT_FOR_DELIVERY", "DELIVERED"],
    OUT_FOR_DELIVERY: ["DELIVERED"],
  };

  if (!allowedTransitions[shipment.status]?.includes(status)) {
    throw new Error(
      `Cannot change shipment from ${shipment.status.replaceAll("_", " ")} to ${status.replaceAll("_", " ")}.`,
    );
  }

  if (["CANCELLED", "REFUNDED", "RETURNED"].includes(shipment.order.status)) {
    throw new Error("This order is closed and cannot be advanced.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.shipment.update({
      where: { id: shipmentId },
      data: { status },
    });

    if (status === "DELIVERED") {
      await tx.order.update({
        where: { id: shipment.orderId },
        data: { status: "DELIVERED" },
      });
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/analytics");
  revalidatePath(`/order/${shipment.order.orderNumber}`);
  revalidatePath("/account");
}

function mapShiprocketStatus(
  raw: unknown,
):
  | "PENDING"
  | "LABEL_CREATED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | null {
  if (!raw || typeof raw !== "object") return null;

  const root = raw as Record<string, any>;
  const tracking =
    root.tracking_data ?? root.data?.tracking_data ?? root.data ?? root;

  const firstTrack = Array.isArray(tracking?.shipment_track)
    ? tracking.shipment_track[0]
    : null;

  const candidates = [
    tracking?.shipment_status,
    tracking?.current_status,
    firstTrack?.current_status,
    tracking?.shipment_track_activities?.[0]?.activity,
    tracking?.shipment_track_activities?.[0]?.["sr-status-label"],
  ];

  const text = candidates
    .filter((value) => typeof value === "string")
    .join(" ")
    .toUpperCase()
    .replaceAll("_", " ");

  if (
    /\bRTO DELIVERED\b|\bRETURNED TO SELLER\b|\bRETURN DELIVERED\b/.test(text)
  ) {
    return "RETURNED";
  }

  if (/\bDELIVERED\b/.test(text) && !/\bOUT FOR DELIVERY\b/.test(text)) {
    return "DELIVERED";
  }

  if (/\bOUT FOR DELIVERY\b/.test(text)) {
    return "OUT_FOR_DELIVERY";
  }

  if (/\bCANCELLED\b|\bCANCELED\b/.test(text)) {
    return "CANCELLED";
  }

  if (/\bIN TRANSIT\b|\bSHIPPED\b|\bREACHED AT DESTINATION\b/.test(text)) {
    return "IN_TRANSIT";
  }

  if (/\bPICKED UP\b|\bPICKUP COMPLETE\b|\bPICKUP DONE\b/.test(text)) {
    return "PICKED_UP";
  }

  if (
    /\bAWB ASSIGNED\b|\bLABEL GENERATED\b|\bLABEL CREATED\b|\bMANIFEST GENERATED\b|\bPICKUP SCHEDULED\b/.test(
      text,
    )
  ) {
    return "LABEL_CREATED";
  }

  return null;
}

export async function refreshShipmentTracking(formData: FormData) {
  await requireAdmin();

  const shipmentId = String(formData.get("shipmentId") ?? "").trim();

  if (!shipmentId) {
    throw new Error("Shipment ID is required.");
  }

  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { order: true },
  });

  if (!shipment) {
    throw new Error("Shipment not found.");
  }

  if (!shipment.awb) {
    throw new Error("This shipment has no AWB. Assign a courier first.");
  }

  const { shippingProvider } = await import("@/lib/shipping");
  const trackingResponse = await shippingProvider.trackShipment(shipment.awb);
  const mappedStatus = mapShiprocketStatus(trackingResponse);

  await prisma.$transaction(async (tx) => {
    const updateData: {
      rawResponse: any;
      status?: typeof shipment.status;
    } = {
      rawResponse: trackingResponse as any,
    };

    if (mappedStatus) {
      updateData.status = mappedStatus;
    }

    await tx.shipment.update({
      where: { id: shipment.id },
      data: updateData,
    });

    if (
      mappedStatus === "DELIVERED" &&
      !["CANCELLED", "REFUNDED", "RETURNED"].includes(shipment.order.status)
    ) {
      await tx.order.update({
        where: { id: shipment.orderId },
        data: { status: "DELIVERED" },
      });
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/analytics");
  revalidatePath(`/order/${shipment.order.orderNumber}`);
  revalidatePath("/account");
}

export async function markCodPaymentCollected(formData: FormData) {
  const admin = await requireAdmin();

  const orderId = String(formData.get("orderId") ?? "").trim();

  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  const collectedAt = new Date();

  const orderNumber = await prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { payment: true },
      });

      if (!order) {
        throw new Error("Order not found.");
      }

      if (order.paymentMethod !== "COD") {
        throw new Error("This action is only for COD orders.");
      }

      if (order.status !== "DELIVERED") {
        throw new Error(
          "Only delivered COD orders can be marked as collected.",
        );
      }

      if (order.paymentStatus !== "PENDING") {
        throw new Error(
          "This payment is no longer pending. Refresh the page and check its status.",
        );
      }

      if (
        !order.payment ||
        order.payment.provider !== "cod" ||
        order.payment.status !== "PENDING"
      ) {
        throw new Error(
          "The pending COD payment record was not found. Please verify this order.",
        );
      }

      const previousResponse = order.payment.rawResponse;
      const previousAudit =
        previousResponse &&
        typeof previousResponse === "object" &&
        !Array.isArray(previousResponse)
          ? previousResponse
          : {};

      const auditRecord = {
        ...previousAudit,
        collection: {
          source: "ADMIN_COD_COLLECTION",
          collectedAt: collectedAt.toISOString(),
          collectedBy: {
            id: admin.id,
            email: admin.email,
          },
          amount: order.total,
          currency: "INR",
        },
      };

      // Conditional updates prevent duplicate collection.
      const paymentUpdate = await tx.payment.updateMany({
        where: {
          orderId: order.id,
          provider: "cod",
          status: "PENDING",
        },
        data: {
          status: "PAID",
          rawResponse: auditRecord,
        },
      });

      if (paymentUpdate.count !== 1) {
        throw new Error(
          "The COD payment was already updated. Refresh and check the status.",
        );
      }

      const orderUpdate = await tx.order.updateMany({
        where: {
          id: order.id,
          paymentMethod: "COD",
          paymentStatus: "PENDING",
          status: "DELIVERED",
        },
        data: {
          paymentStatus: "PAID",
        },
      });

      if (orderUpdate.count !== 1) {
        throw new Error(
          "The order payment status changed. Refresh and try again.",
        );
      }

      return order.orderNumber;
    },
    {
      isolationLevel: "Serializable",
      maxWait: 10000,
      timeout: 20000,
    },
  );

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/analytics");
  revalidatePath("/account");
  revalidatePath(`/order/${orderNumber}`);
}
