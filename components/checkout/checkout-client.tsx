"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  LockKeyhole,
  MapPin,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";

type CheckoutUser = {
  name: string;
  email: string;
  phone: string;
} | null;

type SavedAddress = {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
};

type CheckoutForm = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

function money(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function CheckoutClient({
  user,
  addresses = [],
}: {
  user: CheckoutUser;
  addresses?: SavedAddress[];
}) {
  const router = useRouter();
  const { items, subtotal, mounted, clearCart } = useCart();

  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses.find((address) => address.isDefault)?.id ??
      addresses[0]?.id ??
      "",
  );
  const [useNewAddress, setUseNewAddress] = useState(addresses.length === 0);

  const [form, setForm] = useState<CheckoutForm>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const [method, setMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [coupon, setCoupon] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!mounted) {
    return (
      <div className="checkout-page">
        <p>Loading checkout…</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="checkout-page checkout-empty">
        <span className="eyebrow-dark">CHECKOUT</span>
        <h1>Your bag is empty.</h1>
        <button
          className="button button-dark"
          onClick={() => router.push("/shop")}
        >
          Return to shop <ArrowRight size={15} />
        </button>
      </div>
    );
  }

  const selectedAddress = addresses.find(
    (address) => address.id === selectedAddressId,
  );

  const activeAddress =
    !useNewAddress && selectedAddress ? selectedAddress : null;

  const estimatedShipping = subtotal >= 1999 ? 0 : 99;
  const estimatedTotal = subtotal + estimatedShipping;

  const update = (key: keyof CheckoutForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  function selectAddress(id: string) {
    const address = addresses.find((item) => item.id === id);
    if (!address) return;

    setSelectedAddressId(id);
    setUseNewAddress(false);

    setForm((current) => ({
      ...current,
      name: address.name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
    }));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (!useNewAddress && !activeAddress) {
        throw new Error("Please select a saved address or add a new one.");
      }

      const customer = activeAddress
        ? {
            name: activeAddress.name,
            email: form.email,
            phone: activeAddress.phone,
            line1: activeAddress.line1,
            line2: activeAddress.line2,
            city: activeAddress.city,
            state: activeAddress.state,
            postalCode: activeAddress.postalCode,
            country: "India",
          }
        : {
            ...form,
            country: "India",
          };

      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          })),
          paymentMethod: method,
          couponCode: coupon.trim() || undefined,
          savedAddressId: activeAddress?.id,
          customer,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed.");
      }

      if (method === "COD") {
        clearCart();
        router.push(
          `/order/${data.orderNumber}?success=1${
            data.guestAccessToken ? `&token=${data.guestAccessToken}` : ""
          }`,
        );
        return;
      }

      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";

        script.onload = () => openRazorpay(data, customer);
        script.onerror = () => {
          setError("Unable to load secure payment. Please try again.");
          setBusy(false);
        };

        document.body.appendChild(script);
      } else {
        openRazorpay(data, customer);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setBusy(false);
    }
  }

  async function openRazorpay(
    data: {
      keyId: string;
      amount: number;
      razorpayOrderId: string;
      orderNumber: string;
      guestAccessToken?: string;
    },
    customer: CheckoutForm & { country: string },
  ) {
    if (!window.Razorpay) {
      setError("Secure payment could not be initialized. Please try again.");
      setBusy(false);
      return;
    }

    const payment = new window.Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: "INR",
      name: "OFFICE WEAR",
      description: "Clothing for the modern workday.",
      order_id: data.razorpayOrderId,
      prefill: {
        name: customer.name,
        email: customer.email,
        contact: customer.phone,
      },
      theme: { color: "#111111" },
      handler: async (response: any) => {
        try {
          const verify = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderNumber: data.orderNumber,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });

          const result = await verify.json();

          if (!verify.ok) {
            throw new Error(result.error || "Payment verification failed.");
          }

          clearCart();

          router.push(
            `/order/${data.orderNumber}?success=1${
              data.guestAccessToken ? `&token=${data.guestAccessToken}` : ""
            }`,
          );
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Payment verification failed.",
          );
          setBusy(false);
        }
      },
      modal: {
        ondismiss: () => setBusy(false),
      },
    });

    payment.open();
  }

  return (
    <main className="checkout-page">
      <div className="checkout-top">
        <button type="button" onClick={() => router.push("/cart")}>
          <ArrowLeft size={15} /> Back to bag
        </button>
        <span className="eyebrow-dark">OFFICE WEAR · SECURE CHECKOUT</span>
        <span>
          <LockKeyhole size={14} /> Secure
        </span>
      </div>

      <form onSubmit={submit} className="checkout-layout">
        <section className="checkout-main">
          <div className="checkout-section">
            <div className="checkout-section-title">
              <span>01</span>
              <div>
                <h2>Contact</h2>
                <p>Where should we send your order confirmation?</p>
              </div>
            </div>

            <div className="form-grid">
              <label>
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </label>
              <label>
                Phone
                <input
                  required
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  inputMode="tel"
                />
              </label>
            </div>
          </div>

          <div className="checkout-section">
            <div className="checkout-section-title">
              <span>02</span>
              <div>
                <h2>Delivery address</h2>
                <p>India only for the first launch.</p>
              </div>
            </div>

            {addresses.length > 0 && (
              <div className="saved-addresses">
                <p>
                  <MapPin size={15} /> Choose a saved address
                </p>

                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={
                      !useNewAddress && selectedAddressId === address.id
                        ? "selected"
                        : ""
                    }
                  >
                    <input
                      type="radio"
                      name="savedAddress"
                      checked={
                        !useNewAddress && selectedAddressId === address.id
                      }
                      onChange={() => selectAddress(address.id)}
                    />
                    <span>
                      <strong>
                        {address.label}
                        {address.isDefault ? " · Default" : ""}
                      </strong>
                      <small>
                        {address.name} · {address.phone}
                      </small>
                      <small>
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}
                      </small>
                      <small>
                        {address.city}, {address.state} – {address.postalCode}
                      </small>
                    </span>
                  </label>
                ))}

                <button
                  type="button"
                  className="text-button"
                  onClick={() => setUseNewAddress(true)}
                >
                  + Deliver to a new address
                </button>
              </div>
            )}

            {(useNewAddress || !activeAddress) && (
              <div className="form-grid">
                <label className="full">
                  Full name
                  <input
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                </label>

                <label className="full">
                  Address line 1
                  <input
                    required
                    value={form.line1}
                    onChange={(e) => update("line1", e.target.value)}
                  />
                </label>

                <label className="full">
                  Address line 2 <small>Optional</small>
                  <input
                    value={form.line2}
                    onChange={(e) => update("line2", e.target.value)}
                  />
                </label>

                <label>
                  City
                  <input
                    required
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                  />
                </label>

                <label>
                  State
                  <input
                    required
                    value={form.state}
                    onChange={(e) => update("state", e.target.value)}
                  />
                </label>

                <label>
                  PIN code
                  <input
                    required
                    maxLength={6}
                    value={form.postalCode}
                    onChange={(e) =>
                      update("postalCode", e.target.value.replace(/\D/g, ""))
                    }
                    inputMode="numeric"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="checkout-section">
            <div className="checkout-section-title">
              <span>03</span>
              <div>
                <h2>Payment</h2>
                <p>
                  Payments are verified on the server before an order is
                  confirmed.
                </p>
              </div>
            </div>

            <div className="payment-options">
              <label className={method === "RAZORPAY" ? "selected" : ""}>
                <input
                  type="radio"
                  checked={method === "RAZORPAY"}
                  onChange={() => setMethod("RAZORPAY")}
                />
                <span>
                  <strong>Online payment</strong>
                  <small>UPI, cards, netbanking & wallets via Razorpay</small>
                </span>
              </label>

              <label className={method === "COD" ? "selected" : ""}>
                <input
                  type="radio"
                  checked={method === "COD"}
                  onChange={() => setMethod("COD")}
                />
                <span>
                  <strong>Cash on delivery</strong>
                  <small>Available for eligible Indian addresses</small>
                </span>
              </label>
            </div>
          </div>

          {error && (
            <div role="alert" className="checkout-error">
              {error}
            </div>
          )}

          <button disabled={busy} className="checkout-submit" type="submit">
            {busy ? (
              <>
                <Loader2 className="spin" size={17} /> Processing…
              </>
            ) : method === "COD" ? (
              <>
                Place COD order <Check size={16} />
              </>
            ) : (
              <>
                Continue to secure payment <ArrowRight size={16} />
              </>
            )}
          </button>
        </section>

        <aside className="checkout-summary">
          <span className="eyebrow-dark">ORDER SUMMARY</span>

          <div className="checkout-products">
            {items.map((item) => (
              <div className="checkout-product" key={item.key}>
                <img src={item.image} alt={item.name} />
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {item.color} · {item.size} · Qty {item.quantity}
                  </span>
                </div>
                <b>{money(item.price * item.quantity)}</b>
              </div>
            ))}
          </div>

          <div className="checkout-summary-rows">
            <div>
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </div>
            <div>
              <span>Delivery</span>
              <b>
                {estimatedShipping ? money(estimatedShipping) : "Complimentary"}
              </b>
            </div>
            <div className="coupon-entry">
              <label>
                Discount code
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                />
              </label>
            </div>
            <div className="total">
              <span>Total</span>
              <b>{money(estimatedTotal)}</b>
            </div>
          </div>

          <p className="checkout-legal">
            By placing your order, you agree to the OFFICE WEAR terms, privacy
            policy and return policy.
          </p>
        </aside>
      </form>
    </main>
  );
}
