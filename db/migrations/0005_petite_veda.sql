ALTER TABLE "fridge_items" ADD COLUMN "is_shared" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "is_shared" boolean DEFAULT false NOT NULL;