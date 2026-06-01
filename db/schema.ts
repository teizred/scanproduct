import { pgTable, uuid, text, integer, date, timestamp, json, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  barcode: text("barcode").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand"),
  category: text("category"),
  imageUrl: text("image_url"),
  nutriscore: text("nutriscore"), // a, b, c, d, e
  ecoscore: text("ecoscore"),
  fetchedAt: timestamp("fetched_at").defaultNow(),
});

export const fridgeItems = pgTable("fridge_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id),
  barcode: text("barcode").references(() => products.barcode),
  name: text("name").notNull(),
  expiryDate: date("expiry_date").notNull(),
  quantity: integer("quantity").notNull().default(1),
  imageUrl: text("image_url"),
  category: text("category"),
  nutriscore: text("nutriscore"),
  ecoscore: text("ecoscore"),
  isShared: boolean("is_shared").notNull().default(false),
  addedAt: timestamp("added_at").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  fridgeItemId: uuid("fridge_item_id").notNull().references(() => fridgeItems.id),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // "day_before" | "same_day"
  status: text("status").notNull().default("pending"), // "pending" | "sent"
  sentAt: timestamp("sent_at"),
});

export const recipes = pgTable("recipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  usedItems: json("used_items"),
  isShared: boolean("is_shared").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
