"use server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
const schema=z.object({email:z.string().email()});
export async function subscribeNewsletter(formData:FormData){const parsed=schema.safeParse({email:formData.get('email')});if(!parsed.success)return;await prisma.newsletterSubscriber.upsert({where:{email:parsed.data.email.toLowerCase()},update:{},create:{email:parsed.data.email.toLowerCase(),source:'footer'}});revalidatePath('/');}
