import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { fridgeItems } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, ne } from "drizzle-orm";

export async function POST(
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

    // Check if the item exists, is shared, and does not belong to the claiming user
    const [item] = await db
      .select()
      .from(fridgeItems)
      .where(
        and(
          eq(fridgeItems.id, id),
          eq(fridgeItems.isShared, true),
          ne(fridgeItems.userId, session.user.id)
        )
      );

    if (!item) {
      return NextResponse.json(
        { error: "Item not found, not shared, or already owned by you" },
        { status: 404 }
      );
    }

    // Transfer ownership of the item: change userId and reset isShared
    await db
      .update(fridgeItems)
      .set({
        userId: session.user.id,
        isShared: false,
        addedAt: new Date(), // Reset added timestamp for their fridge
      })
      .where(eq(fridgeItems.id, id));

    return NextResponse.json({ success: true, itemName: item.name });
  } catch (error: any) {
    console.error("Error claiming fridge item:", error);
    return NextResponse.json(
      { error: "Failed to claim item: " + error.message },
      { status: 500 }
    );
  }
}
