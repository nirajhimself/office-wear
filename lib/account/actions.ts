"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const addressSchema = z.object({
  label: z.string().trim().min(1, "Enter an address label.").max(40),
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid 10-digit phone number.")
    .max(15, "Phone number is too long.")
    .regex(/^\+?[0-9\s-]{10,15}$/, "Enter a valid phone number."),
  line1: z.string().trim().min(3, "Enter your address.").max(150),
  line2: z.string().trim().max(150).optional(),
  city: z.string().trim().min(2, "Enter your city.").max(80),
  state: z.string().trim().min(2, "Enter your state.").max(80),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit PIN code."),
});

export async function saveAddress(formData: FormData) {
  const user = await requireUser();

  const rawData = {
    label: String(formData.get("label") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    line1: String(formData.get("line1") || "").trim(),
    line2: String(formData.get("line2") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    state: String(formData.get("state") || "").trim(),
    postalCode: String(formData.get("postalCode") || "").trim(),
  };

  const parsed = addressSchema.safeParse(rawData);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message || "Please enter a valid address.",
    );
  }

  const count = await prisma.address.count({
    where: { userId: user.id },
  });

  await prisma.address.create({
    data: {
      ...parsed.data,
      userId: user.id,
      isDefault: count === 0,
      line2: parsed.data.line2 || null,
    },
  });

  revalidatePath("/account");
}

export async function updateProfile(formData: FormData) {
  const user = await requireUser();

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (name.length < 2) {
    throw new Error("Enter your name.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      phone: phone || null,
    },
  });

  revalidatePath("/account");
}

export async function addWishlist(formData: FormData) {
  const user = await requireUser();

  const productId = String(formData.get("productId") || "").trim();

  if (!productId) {
    throw new Error("Product is required.");
  }

  await prisma.wishlist.upsert({
    where: {
      userId_productId: {
        userId: user.id,
        productId,
      },
    },
    update: {},
    create: {
      userId: user.id,
      productId,
    },
  });

  revalidatePath("/account");
}

export async function removeWishlist(formData: FormData) {
  const user = await requireUser();

  const productId = String(formData.get("productId") || "").trim();

  if (!productId) {
    return;
  }

  await prisma.wishlist.deleteMany({
    where: {
      userId: user.id,
      productId,
    },
  });

  revalidatePath("/account");
}
