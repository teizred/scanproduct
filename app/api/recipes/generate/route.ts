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
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: "You are an expert chef specializing in zero-waste cooking and smart pantry management. Your job is to create a delicious recipe in French using primarily the provided ingredients, but also suggesting what extra ingredients to buy to complete the meal, and recommendations on how to fill/restock the fridge intelligently to avoid future waste.",
      messages: [
        {
          role: "user",
          content: `Crée une recette savoureuse en utilisant ces ingrédients : ${itemNames}. 
          Retourne un objet JSON valide avec deux clés :
          - 'title' : le nom de la recette.
          - 'content' : la recette rédigée en Markdown (en français) structurée très proprement ainsi :
            1. **Description** : Court paragraphe sur le plat.
            2. **🛒 Ingrédients à acheter pour compléter** : Liste à puces claire des ingrédients manquants ou supplémentaires qu'il est conseillé d'acheter pour faire un excellent repas complet.
            3. **Ingrédients déjà dans votre frigo** : Rappel des ingrédients utilisés.
            4. **Préparation** : Les étapes simples de cuisine.
            5. **💡 Idées pour remplir votre frigo** : Suggestions intelligentes de courses ou de produits sains et complémentaires à acheter lors du prochain passage en magasin pour bien restocker et remplir le frigo sans gaspiller.
            
          Renvoie uniquement le JSON. Si tu l'enveloppes dans des blocs de code Markdown (comme \`\`\`json), assure-toi que le format JSON interne est 100 % valide.`,
        },
      ],
    });

    const messageContent = response.content[0];
    let recipeData;
    
    if (messageContent.type === "text") {
      let rawText = messageContent.text.trim();
      
      // Robust cleaning of markdown codeblocks wrappers if present
      if (rawText.startsWith("```json")) {
        rawText = rawText.substring(7);
      } else if (rawText.startsWith("```")) {
        rawText = rawText.substring(3);
      }
      if (rawText.endsWith("```")) {
        rawText = rawText.substring(0, rawText.length - 3);
      }
      rawText = rawText.trim();

      try {
        recipeData = JSON.parse(rawText);
      } catch (e) {
        console.error("Failed to parse Claude JSON response:", rawText);
        // Fallback simple parsing if parsing fails completely
        recipeData = {
          title: "Recette Anti-Gaspi et Conseils",
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
