import { Router } from "express";
import { db } from "@workspace/db";
import { complaintsTable, boothMetricsTable } from "@workspace/db/schema";
import { eq, count, desc } from "drizzle-orm";

const router = Router();

router.get("/:boothId/analytics", async (req, res) => {
  const { boothId } = req.params;

  const booth = await db.select().from(boothMetricsTable).where(eq(boothMetricsTable.boothId, boothId)).limit(1);

  const complaints = await db.select().from(complaintsTable).where(eq(complaintsTable.boothId, boothId));

  const resolved = complaints.filter((c) => c.status === "Resolved").length;
  const resolutionRate = complaints.length > 0 ? resolved / complaints.length : 0;

  const categoryMap = new Map<string, number>();
  for (const c of complaints) {
    categoryMap.set(c.category, (categoryMap.get(c.category) || 0) + 1);
  }

  const topIssues = Array.from(categoryMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat, cnt]) => ({
      category: cat,
      count: cnt,
      percentage: complaints.length > 0 ? Math.round((cnt / complaints.length) * 1000) / 10 : 0,
    }));

  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayCount = complaints.filter((c) => c.createdAt.toISOString().split("T")[0] === dateStr).length;
    trend.push({ date: dateStr, count: dayCount });
  }

  const boothData = booth[0];

  res.json({
    boothId,
    boothName: boothData?.boothName || `Booth ${boothId}`,
    healthScore: boothData?.healthScore || 50,
    sentimentScore: boothData?.sentimentScore || 0.5,
    complaintCount: complaints.length,
    resolvedComplaints: resolved,
    resolutionRate: Math.round(resolutionRate * 100) / 100,
    coveragePercentage: boothData?.coveragePercentage || 50,
    topIssues,
    trend,
  });
});

export default router;
