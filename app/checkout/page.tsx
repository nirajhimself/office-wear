import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { CheckoutClient } from "@/components/checkout/checkout-client";

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  const addresses = user
    ? await prisma.address.findMany({
        where: { userId: user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      })
    : [];

  return (
    <CheckoutClient
      user={
        user
          ? {
              name: user.name,
              email: user.email,
              phone: user.phone ?? "",
            }
          : null
      }
      addresses={addresses.map((address) => ({
        id: address.id,
        label: address.label,
        name: address.name,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2 ?? "",
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        isDefault: address.isDefault,
      }))}
    />
  );
}
