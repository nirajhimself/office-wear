"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth/session";

const credentialsSchema = z.object({ email: z.string().trim().email("Enter a valid email address."), password: z.string().min(8, "Password must be at least 8 characters.") });
const registerSchema = credentialsSchema.extend({ name: z.string().trim().min(2, "Enter your name.").max(80), phone: z.string().trim().optional() });

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check your details.")}`);
  const { email, password, name, phone } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email: normalizedEmail } })) redirect(`/login?error=${encodeURIComponent("An account already exists with that email.")}`);
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email: normalizedEmail, passwordHash, name, phone: phone || null } });
  await prisma.customerEvent.create({ data: { userId: user.id, type: "account_created" } });
  await createSession(user.id);
  redirect("/account");
}

export async function loginAction(formData: FormData) {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/login?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check your details.")}`);
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) redirect(`/login?error=${encodeURIComponent("Email or password is incorrect.")}`);
  await createSession(user.id);
  await prisma.customerEvent.create({ data: { userId: user.id, type: "login" } });
  redirect("/account");
}

export async function logoutAction() { await destroySession(); redirect("/"); }
