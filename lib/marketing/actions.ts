"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const emailSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

type NewsletterState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function subscribeNewsletter(
  _previousState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please enter a valid email address.",
    };
  }

  const email = parsed.data.email.toLowerCase();

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: {
        email,
        source: "footer",
      },
    });

    revalidatePath("/");

    return {
      status: "success",
      message: "You're on the list. Thanks for subscribing!",
    };
  } catch (error) {
    console.error("Newsletter subscription failed:", error);

    return {
      status: "error",
      message:
        "We couldn't complete your subscription right now. Please try again.",
    };
  }
}
