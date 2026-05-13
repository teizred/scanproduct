import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { recipes } from "@/db/schema";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is missing in environment variables" },
        { status: 500 }
      );
    }

    const { items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Please provide a list of items to use." },
        { status: 400 }
      );
    }

    const itemNames = items.map((i: any) => i.name).join(", ");

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      system: "You are an expert chef specializing in zero-waste cooking. Create a delicious recipe that primarily uses the provided ingredients, which are nearing their expiry date. The recipe must be in French.",
      messages: [
        {
          role: "user",
          content: `Create a recipe using these ingredients: ${itemNames}. 
          Return a JSON object with 'title' (string) and 'content' (string, markdown formatted recipe including ingredients list and steps). DO NOT wrap the JSON in markdown blocks, just return the raw JSON object.`,
        },
      ],
    });

    const messageContent = response.content[0];
    let recipeData;
    
    if (messageContent.type === "text") {
      try {
        recipeData = JSON.parse(messageContent.text);
      } catch (e) {
        console.error("Failed to parse Claude JSON response:", messageContent.text);
        // Fallback simple parsing
        recipeData = {
          title: "Recette Anti-Gaspi",
          content: messageContent.text
        };
      }
    } else {
      throw new Error("Unexpected response type from Claude");
    }

    // Save recipe to db
    const savedRecipe = await db.insert(recipes).values({
      userId: session.user.id,
      title: recipeData.title,
      content: recipeData.content,
      usedItems: items,
    }).returning();

    return NextResponse.json({ recipe: savedRecipe[0] });
  } catch (error: any) {
    console.error("Error generating recipe:", error);
    return NextResponse.json(
      { error: "Failed to generate recipe: " + error.message },
      { status: 500 }
    );
  }
}
