import { getCurrentUser } from "@/lib/auth/session";
import { CheckoutClient } from "@/components/checkout/checkout-client";
export default async function CheckoutPage() { const user = await getCurrentUser(); return <CheckoutClient user={user ? { name:user.name, email:user.email, phone:user.phone ?? "" } : null} />; }
