import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { fridgeItems, products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { barcode, name, expiryDate, quantity, imageUrl, brand, category, nutriscore, ecoscore } = body;

    if (!name || !expiryDate) {
      return NextResponse.json(
        { error: "Name and Expiry Date are required" },
        { status: 400 }
      );
    }

    // Insert product if it doesn't exist and we have a barcode
    if (barcode) {
      const existingProduct = await db
        .select()
        .from(products)
        .where(eq(products.barcode, barcode));
        
      if (existingProduct.length === 0) {
        await db.insert(products).values({
          barcode,
          name,
          brand,
          category,
          imageUrl,
          nutriscore,
          ecoscore,
        });
      }
    }

    // Insert fridge item
    const newItem = await db
      .insert(fridgeItems)
      .values({
        userId: session.user.id,
        barcode: barcode || null,
        name,
        expiryDate: new Date(expiryDate).toISOString().split("T")[0],
        quantity: quantity || 1,
        imageUrl,
        category,
        nutriscore,
        ecoscore,
      })
      .returning();

    return NextResponse.json({ item: newItem[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating fridge item:", error);
    return NextResponse.json(
      { error: "Failed to create item: " + error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await db
      .select()
      .from(fridgeItems)
      .where(eq(fridgeItems.userId, session.user.id));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Error fetching fridge items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items: " + error.message },
      { status: 500 }
    );
  }
}
