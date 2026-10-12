
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to view your wishlist." },
        { status: 401 }
      );
    }

    const items = await prisma.wishlist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            images: true,
            variants: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Wishlist fetch failed:", error);
    return NextResponse.json(
      { error: "Unable to load your wishlist." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to use your wishlist." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const productId = body?.productId;

    if (typeof productId !== "string" || !productId.trim()) {
      return NextResponse.json(
        { error: "A valid product ID is required." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true },
    });

    if (!product || product.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: { id: existing.id },
      });

      return NextResponse.json({ liked: false });
    }

    await prisma.wishlist.create({
      data: {
        userId: user.id,
        productId,
      },
    });

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("Wishlist update failed:", error);
    return NextResponse.json(
      { error: "Unable to update your wishlist." },
      { status: 500 }
    );
  }
}
