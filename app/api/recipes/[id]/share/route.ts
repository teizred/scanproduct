import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

export async function PUT(
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
    const { isShared } = body;

    if (typeof isShared !== "boolean") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await db
      .update(recipes)
      .set({ isShared })
      .where(and(eq(recipes.id, id), eq(recipes.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating recipe share status:", error);
    return NextResponse.json(
      { error: "Failed to update recipe: " + error.message },
      { status: 500 }
    );
  }
}
