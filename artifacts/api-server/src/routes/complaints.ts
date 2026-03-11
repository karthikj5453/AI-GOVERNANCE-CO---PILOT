import { Router } from "express";
import { db } from "@workspace/db";
import { complaintsTable } from "@workspace/db/schema";
import { IngestComplaintBody, ListComplaintsQueryParams } from "@workspace/api-zod";
import { eq, and, desc, count, sql } from "drizzle-orm";

const router = Router();

const CATEGORIES = [
  "Infrastructure",
  "Water Supply",
  "Roads & Transport",
  "Healthcare",
  "Education",
  "Electricity",
  "Sanitation",
  "Agriculture",
  "Law & Order",
  "Housing",
];

const SUBCATEGORIES: Record<string, string[]> = {
  Infrastructure: ["Bridge", "Building", "Public Space"],
  "Water Supply": ["Shortage", "Quality", "Pipeline"],
  "Roads & Transport": ["Potholes", "Street Lights", "Bus Service"],
  Healthcare: ["Hospital", "Medicine", "Ambulance"],
  Education: ["School", "College", "Scholarship"],
  Electricity: ["Power Cut", "Billing", "Transformer"],
  Sanitation: ["Garbage", "Sewage", "Drainage"],
  Agriculture: ["Irrigation", "Seeds", "Loan"],
  "Law & Order": ["Police", "Crime", "Traffic"],
  Housing: ["Slum", "Rent", "Allocation"],
};

const DEPARTMENTS: Record<string, string> = {
  Infrastructure: "Public Works Department",
  "Water Supply": "Water Department",
  "Roads & Transport": "Roads & Transport Department",
  Healthcare: "Health Department",
  Education: "Education Department",
  Electricity: "Electricity Board",
  Sanitation: "Municipal Corporation",
  Agriculture: "Agriculture Department",
  "Law & Order": "Police Department",
  Housing: "Housing Board",
};

const KEYWORDS: Record<string, string[]> = {
  "Water Supply": ["water", "supply", "pipe", "tap", "leak", "shortage"],
  "Roads & Transport": ["road", "pothole", "street", "bridge", "bus", "transport"],
  Healthcare: ["hospital", "doctor", "medicine", "health", "ambulance", "medical"],
  Education: ["school", "college", "teacher", "student", "education"],
  Electricity: ["electricity", "power", "light", "current", "transformer", "outage"],
  Sanitation: ["garbage", "waste", "sewage", "drain", "toilet", "sanitation"],
  Agriculture: ["farm", "crop", "irrigation", "seed", "fertilizer", "agricultural"],
  "Law & Order": ["police", "crime", "theft", "security", "law"],
  Housing: ["house", "home", "shelter", "rent", "slum"],
};

function classifyComplaint(text: string): {
  category: string;
  subcategory: string;
  urgency: string;
  urgencyScore: number;
  department: string;
  estimatedResolutionTime: string;
} {
  const lowerText = text.toLowerCase();
  let category = "Infrastructure";

  for (const [cat, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some((k) => lowerText.includes(k))) {
      category = cat;
      break;
    }
  }

  const urgencyKeywords = {
    High: ["urgent", "emergency", "critical", "immediate", "dangerous", "death", "flood", "fire", "collapse", "weeks", "month"],
    Medium: ["broken", "damaged", "irregular", "poor", "bad", "delayed", "days"],
    Low: ["request", "improve", "suggest", "minor", "maintenance"],
  };

  let urgency = "Medium";
  let urgencyScore = 0.5;

  for (const [u, keywords] of Object.entries(urgencyKeywords)) {
    if (keywords.some((k) => lowerText.includes(k))) {
      urgency = u;
      urgencyScore = u === "High" ? 0.75 + Math.random() * 0.2 : u === "Medium" ? 0.4 + Math.random() * 0.3 : 0.1 + Math.random() * 0.3;
      break;
    }
  }

  const resolutionTime: Record<string, string> = {
    High: "24-48 hours",
    Medium: "3-7 days",
    Low: "2-4 weeks",
  };

  const subs = SUBCATEGORIES[category] || ["General"];
  const subcategory = subs[Math.floor(Math.random() * subs.length)];

  return {
    category,
    subcategory,
    urgency,
    urgencyScore: Math.min(1, Math.round(urgencyScore * 100) / 100),
    department: DEPARTMENTS[category] || "General Administration",
    estimatedResolutionTime: resolutionTime[urgency],
  };
}

router.post("/ingest", async (req, res) => {
  const parsed = IngestComplaintBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error });
  }

  const { citizenName, complaintText, boothId, location } = parsed.data;
  const classification = classifyComplaint(complaintText);

  const [inserted] = await db
    .insert(complaintsTable)
    .values({
      citizenName: citizenName ?? "Anonymous",
      complaintText,
      category: classification.category,
      subcategory: classification.subcategory,
      urgency: classification.urgency,
      urgencyScore: classification.urgencyScore,
      department: classification.department,
      affectedArea: location ?? boothId ?? "Unknown",
      boothId: boothId ?? "B001",
      location: location ?? "",
      status: "Pending",
    })
    .returning();

  res.status(201).json({
    complaintId: inserted.complaintId,
    category: inserted.category,
    subcategory: inserted.subcategory,
    urgency: inserted.urgency,
    urgencyScore: inserted.urgencyScore,
    department: inserted.department,
    affectedArea: inserted.affectedArea,
    estimatedResolutionTime: classification.estimatedResolutionTime,
    status: inserted.status,
  });
});

router.get("/", async (req, res) => {
  const params = ListComplaintsQueryParams.safeParse(req.query);
  const { category, urgency, boothId, status, limit = 50, offset = 0 } = params.success ? params.data : { limit: 50, offset: 0 };

  const conditions = [];
  if (category) conditions.push(eq(complaintsTable.category, category));
  if (urgency) conditions.push(eq(complaintsTable.urgency, urgency));
  if (boothId) conditions.push(eq(complaintsTable.boothId, boothId));
  if (status) conditions.push(eq(complaintsTable.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [complaints, totalResult] = await Promise.all([
    db.select().from(complaintsTable).where(whereClause).orderBy(desc(complaintsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(complaintsTable).where(whereClause),
  ]);

  res.json({
    complaints: complaints.map((c) => ({
      complaintId: c.complaintId,
      citizenName: c.citizenName,
      complaintText: c.complaintText,
      category: c.category,
      subcategory: c.subcategory,
      urgency: c.urgency,
      urgencyScore: c.urgencyScore,
      department: c.department,
      affectedArea: c.affectedArea,
      boothId: c.boothId,
      status: c.status,
      createdAt: c.createdAt,
      resolvedAt: c.resolvedAt,
    })),
    total: totalResult[0]?.count ?? 0,
  });
});

export default router;
