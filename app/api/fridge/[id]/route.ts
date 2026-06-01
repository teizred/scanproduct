import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { fridgeItems } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db
      .delete(fridgeItems)
      .where(and(eq(fridgeItems.id, id), eq(fridgeItems.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting fridge item:", error);
    return NextResponse.json(
      { error: "Failed to delete item: " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { quantity } = body;

    if (quantity === undefined || typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    await db
      .update(fridgeItems)
      .set({ quantity })
      .where(and(eq(fridgeItems.id, id), eq(fridgeItems.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating fridge item:", error);
    return NextResponse.json(
      { error: "Failed to update item: " + error.message },
      { status: 500 }
    );
  }
}
