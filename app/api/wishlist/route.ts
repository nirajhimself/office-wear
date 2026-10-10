import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
export async function POST(request:Request){const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Please sign in to use your wishlist.'},{status:401});const {productId}=await request.json();const existing=await prisma.wishlist.findUnique({where:{userId_productId:{userId:user.id,productId}}});if(existing){await prisma.wishlist.delete({where:{id:existing.id}});return NextResponse.json({liked:false});}await prisma.wishlist.create({data:{userId:user.id,productId}});return NextResponse.json({liked:true});}
