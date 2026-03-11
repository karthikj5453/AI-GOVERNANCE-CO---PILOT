import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const complaintsTable = pgTable("complaints", {
  complaintId: serial("complaint_id").primaryKey(),
  citizenName: text("citizen_name"),
  complaintText: text("complaint_text").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  urgency: text("urgency").notNull(),
  urgencyScore: real("urgency_score").notNull().default(0.5),
  department: text("department").notNull(),
  affectedArea: text("affected_area"),
  boothId: text("booth_id"),
  location: text("location"),
  status: text("status").notNull().default("Pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertComplaintSchema = createInsertSchema(complaintsTable).omit({
  complaintId: true,
  createdAt: true,
  resolvedAt: true,
});
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaintsTable.$inferSelect;

export const boothMetricsTable = pgTable("booth_metrics", {
  boothId: text("booth_id").primaryKey(),
  boothName: text("booth_name").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  sentimentScore: real("sentiment_score").notNull().default(0.5),
  healthScore: real("health_score").notNull().default(50),
  complaintCount: integer("complaint_count").notNull().default(0),
  resolvedComplaints: integer("resolved_complaints").notNull().default(0),
  coveragePercentage: real("coverage_percentage").notNull().default(50),
  urgencyLevel: text("urgency_level").notNull().default("Low"),
});

export type BoothMetric = typeof boothMetricsTable.$inferSelect;
