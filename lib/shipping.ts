import "server-only";

export type ShippingAddress = {
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
};

export type ShippingShipmentResult = {
  providerOrderId?: string;
  shipmentId?: string;
  awb?: string;
  courierName?: string;
  trackingUrl?: string;
  rawResponse?: unknown;
};

export type CreateShipmentInput = {
  orderNumber: string;
  address: ShippingAddress;
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentMethod?: "RAZORPAY" | "COD";
};

export interface ShippingProvider {
  createShipment(input: CreateShipmentInput): Promise<ShippingShipmentResult>;

  trackShipment(awb: string): Promise<unknown>;

  cancelShipment(awb: string): Promise<unknown>;
}

export class ShiprocketProvider implements ShippingProvider {
  private token: string | null = null;

  private async authenticate() {
    if (this.token) {
      return this.token;
    }

    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
      throw new Error("Shiprocket is not configured.");
    }

    const res = await fetch(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      },
    );

    if (!res.ok) {
      throw new Error(`Shiprocket authentication failed (${res.status}).`);
    }

    const data = await res.json();

    this.token = data.token;

    return this.token;
  }

  async createShipment(
    input: CreateShipmentInput,
  ): Promise<ShippingShipmentResult> {
    const token = await this.authenticate();

    const res = await fetch(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: input.orderNumber,
          order_date: new Date().toISOString(),

          pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",

          billing_customer_name: input.address.name,
          billing_last_name: "",
          billing_address: input.address.line1,
          billing_address_2: input.address.line2 || "",
          billing_city: input.address.city,
          billing_pincode: input.address.postalCode,
          billing_state: input.address.state,
          billing_country: input.address.country || "India",
          billing_email: "",
          billing_phone: input.address.phone,

          shipping_is_billing: true,

          order_items: input.items.map((item) => ({
            name: item.name,
            sku: item.sku,
            units: item.quantity,
            selling_price: item.price,
          })),

          payment_method: input.paymentMethod === "COD" ? "COD" : "Prepaid",

          sub_total: input.total,

          length: 10,
          breadth: 10,
          height: 10,
          weight: 1,
        }),
      },
    );

    if (!res.ok) {
      throw new Error(`Shiprocket order creation failed (${res.status}).`);
    }

    const data = await res.json();

    return {
      providerOrderId:
        data.order_id != null ? String(data.order_id) : undefined,

      shipmentId:
        data.shipment_id != null ? String(data.shipment_id) : undefined,

      awb: data.awb_code != null ? String(data.awb_code) : undefined,

      courierName:
        data.courier_name != null ? String(data.courier_name) : undefined,

      trackingUrl:
        data.tracking_url != null ? String(data.tracking_url) : undefined,

      rawResponse: data,
    };
  }

  async trackShipment(awb: string) {
    const token = await this.authenticate();

    const res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${encodeURIComponent(
        awb,
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      throw new Error("Tracking lookup failed.");
    }

    return res.json();
  }

  async cancelShipment(awb: string) {
    const token = await this.authenticate();

    const res = await fetch(
      "https://apiv2.shiprocket.in/v1/external/orders/cancel",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: [awb],
        }),
      },
    );

    if (!res.ok) {
      throw new Error("Shipment cancellation failed.");
    }

    return res.json();
  }
}

export const shippingProvider = new ShiprocketProvider();
