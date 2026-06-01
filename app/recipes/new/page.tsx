import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { fridgeItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import GenerateRecipeForm from "@/app/recipes/new/GenerateRecipeForm";
import BottomNav from "@/app/components/BottomNav";

export default async function NewRecipePage() { 
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const items = await db
    .select()
    .from(fridgeItems)
    .where(eq(fridgeItems.userId, session.user.id))
    .orderBy(asc(fridgeItems.expiryDate));

  return (
    <GenerateRecipeForm items={items} />
  );
}
