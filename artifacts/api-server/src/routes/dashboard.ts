import { Router } from "express";
import { db } from "@workspace/db";
import { complaintsTable, boothMetricsTable } from "@workspace/db/schema";
import { desc, eq, count, sql, gte } from "drizzle-orm";

const router = Router();

router.get("/heatmap", async (req, res) => {
  const days = parseInt((req.query.days as string) || "30", 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const booths = await db.select().from(boothMetricsTable);
  const totalResult = await db.select({ count: count() }).from(complaintsTable).where(gte(complaintsTable.createdAt, since));

  res.json({
    booths,
    totalComplaints: totalResult[0]?.count ?? 0,
    period: `Last ${days} days`,
  });
});

router.get("/category-breakdown", async (req, res) => {
  const result = await db
    .select({
      category: complaintsTable.category,
      count: count(),
    })
    .from(complaintsTable)
    .groupBy(complaintsTable.category)
    .orderBy(desc(count()));

  const total = result.reduce((sum, r) => sum + Number(r.count), 0);

  res.json({
    categories: result.map((r) => ({
      category: r.category,
      count: Number(r.count),
      percentage: total > 0 ? Math.round((Number(r.count) / total) * 1000) / 10 : 0,
    })),
    total,
  });
});

router.get("/:constituencyId", async (req, res) => {
  const allComplaints = await db.select().from(complaintsTable);
  const booths = await db.select().from(boothMetricsTable);

  const total = allComplaints.length;
  const resolved = allComplaints.filter((c) => c.status === "Resolved").length;
  const resolutionRate = total > 0 ? resolved / total : 0;

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeek = allComplaints.filter((c) => c.createdAt >= oneWeekAgo).length;
  const lastWeek = allComplaints.filter((c) => c.createdAt >= twoWeeksAgo && c.createdAt < oneWeekAgo).length;
  const weekChange = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

  const sentimentScore = 0.55 + Math.random() * 0.15;
  const schemeCoverage = 0.6 + Math.random() * 0.2;

  const healthScore = Math.round(
    (0.4 * resolutionRate + 0.3 * sentimentScore + 0.3 * schemeCoverage) * 100
  );

  const healthStatus = healthScore > 70 ? "Good" : healthScore > 40 ? "Moderate" : "Critical";

  const categoryMap = new Map<string, number>();
  for (const c of allComplaints) {
    categoryMap.set(c.category, (categoryMap.get(c.category) || 0) + 1);
  }
  const categoryBreakdown = Array.from(categoryMap.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([cat, cnt]) => ({
      category: cat,
      count: cnt,
      percentage: total > 0 ? Math.round((cnt / total) * 1000) / 10 : 0,
    }));

  const recentComplaints = allComplaints
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)
    .map((c) => ({
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
    }));

  const highUrgency = allComplaints.filter((c) => c.urgency === "High" && c.status !== "Resolved").length;

  res.json({
    constituencyId: req.params.constituencyId,
    healthScore,
    healthStatus,
    totalComplaints: total,
    resolvedComplaints: resolved,
    activeAlerts: highUrgency,
    sentimentScore: Math.round(sentimentScore * 100) / 100,
    schemeCoverage: Math.round(schemeCoverage * 100) / 100,
    resolutionRate: Math.round(resolutionRate * 100) / 100,
    complaintsThisWeek: thisWeek,
    complaintsLastWeek: lastWeek,
    weekOverWeekChange: Math.round(weekChange * 10) / 10,
    categoryBreakdown,
    recentComplaints,
    boothMetrics: booths,
  });
});

export default router;
