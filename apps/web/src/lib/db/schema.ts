import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  plan: text("plan").notNull().default("free"),
  leadCapacity: integer("lead_capacity").notNull().default(10),
  businessContext: text("business_context"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  externalId: text("external_id"),
  name: text("name").notNull(),
  category: text("category"),
  address: text("address"),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  phone: text("phone"),
  mobile: text("mobile"),
  email: text("email"),
  website: text("website"),
  rating: real("rating"),
  reviewCount: integer("review_count"),
  hours: text("hours"),
  status: text("status").notNull().default("new"),
  territoryId: text("territory_id"),
  enriched: integer("enriched", { mode: "boolean" }).default(false),
  reviewsJson: text("reviews_json"),
  smartSalesJson: text("smart_sales_json"),
  emailsJson: text("emails_json"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const territories = sqliteTable("territories", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  geoJson: text("geo_json").notNull(),
  assignedRepId: text("assigned_rep_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  leadId: text("lead_id"),
  type: text("type").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const calendarEvents = sqliteTable("calendar_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  leadId: text("lead_id"),
  title: text("title").notNull(),
  description: text("description"),
  startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
  endsAt: integer("ends_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const teamMembers = sqliteTable("team_members", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("rep"),
  territoryIds: text("territory_ids"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const savedRoutes = sqliteTable("saved_routes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  leadIds: text("lead_ids").notNull(),
  mode: text("mode").notNull().default("driving"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
