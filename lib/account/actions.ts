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
    .min(10, "Enter a valid phone number.")
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

function readAddressForm(formData: FormData) {
  return addressSchema.safeParse({
    label: String(formData.get("label") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    line1: String(formData.get("line1") || "").trim(),
    line2: String(formData.get("line2") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    state: String(formData.get("state") || "").trim(),
    postalCode: String(formData.get("postalCode") || "").trim(),
  });
}

export async function saveAddress(formData: FormData) {
  const user = await requireUser();
  const parsed = readAddressForm(formData);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message || "Please check your address.",
    );
  }

  await prisma.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { userId: user.id } });

    await tx.address.create({
      data: {
        ...parsed.data,
        line2: parsed.data.line2 || null,
        userId: user.id,
        isDefault: count === 0,
      },
    });
  });

  revalidatePath("/account");
  revalidatePath("/checkout");
}

export async function updateAddress(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "").trim();
  const parsed = readAddressForm(formData);

  if (!id) throw new Error("Address not found.");
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message || "Please check your address.",
    );
  }

  const result = await prisma.address.updateMany({
    where: { id, userId: user.id },
    data: {
      ...parsed.data,
      line2: parsed.data.line2 || null,
    },
  });

  if (result.count === 0)
    throw new Error("Address not found or access denied.");

  revalidatePath("/account");
  revalidatePath("/checkout");
}

export async function setDefaultAddress(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "").trim();

  if (!id) throw new Error("Address not found.");

  await prisma.$transaction(async (tx) => {
    const address = await tx.address.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!address) throw new Error("Address not found or access denied.");

    await tx.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });

    await tx.address.update({
      where: { id: address.id },
      data: { isDefault: true },
    });
  });

  revalidatePath("/account");
  revalidatePath("/checkout");
}

export async function deleteAddress(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "").trim();

  if (!id) throw new Error("Address not found.");

  await prisma.$transaction(async (tx) => {
    const address = await tx.address.findFirst({
      where: { id, userId: user.id },
      select: { id: true, isDefault: true },
    });

    if (!address) throw new Error("Address not found or access denied.");

    // Preserve orders and their delivery snapshots when removing an address.
    await tx.order.updateMany({
      where: { userId: user.id, addressId: address.id },
      data: { addressId: null },
    });

    await tx.address.delete({
      where: { id: address.id },
    });

    // If the default was deleted, choose another saved address.
    if (address.isDefault) {
      const nextAddress = await tx.address.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      if (nextAddress) {
        await tx.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }
  });

  revalidatePath("/account");
  revalidatePath("/checkout");
}

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (name.length < 2) throw new Error("Enter your name.");

  await prisma.user.update({
    where: { id: user.id },
    data: { name, phone: phone || null },
  });

  revalidatePath("/account");
}

export async function addWishlist(formData: FormData) {
  const user = await requireUser();
  const productId = String(formData.get("productId") || "").trim();

  if (!productId) throw new Error("Product is required.");

  await prisma.wishlist.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    update: {},
    create: { userId: user.id, productId },
  });

  revalidatePath("/account");
}

export async function removeWishlist(formData: FormData) {
  const user = await requireUser();
  const productId = String(formData.get("productId") || "").trim();

  if (!productId) return;

  await prisma.wishlist.deleteMany({
    where: { userId: user.id, productId },
  });

  revalidatePath("/account");
}
