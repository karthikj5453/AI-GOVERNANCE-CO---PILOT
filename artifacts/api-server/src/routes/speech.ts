import { Router } from "express";
import { GenerateSpeechBody } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { complaintsTable } from "@workspace/db/schema";
import { count, eq } from "drizzle-orm";
import { runGeminiPrompt } from "../lib/gemini";

const router = Router();

interface SpeechResult {
  speech: string;
  keyPoints: string[];
  dataPointsUsed: string[];
}

const CONSTITUENCY_DATA = {
  default: {
    name: "Model Constituency",
    population: 45000,
    farmers: 3420,
    irrigationProjects: 12,
    irrigationVillages: 15,
    schemes: ["PM Kisan", "Jal Jeevan Mission", "PM Awas Yojana", "Ayushman Bharat"],
    achievements: [
      "Built 4 new primary health centers",
      "Improved road connectivity to 22 villages",
      "Provided clean drinking water to 18 panchayats",
      "Distributed 2500 solar pumps to farmers",
    ],
    roads: 45,
    hospitals: 8,
    schools: 32,
    budget: "₹85 crore",
  },
};

function generateSpeechMock(topic: string, audience: string, stats: any): SpeechResult {
  return {
    speech: `Distinguished guests and ${audience}, today we discuss ${topic}...`,
    keyPoints: ["Economic growth", "Community welfare"],
    dataPointsUsed: ["Population: 45,000"],
  };
}

router.post("/generate", async (req, res) => {
  const parsed = GenerateSpeechBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { topic, audienceType } = parsed.data;

  const [totalResult, resolvedResult] = await Promise.all([
    db.select({ count: count() }).from(complaintsTable),
    db.select({ count: count() }).from(complaintsTable).where(eq(complaintsTable.status, "Resolved")),
  ]);

  const stats = {
    totalComplaints: Number(totalResult[0]?.count ?? 0),
    resolvedComplaints: Number(resolvedResult[0]?.count ?? 0),
    pendingComplaints: Number(totalResult[0]?.count ?? 0) - Number(resolvedResult[0]?.count ?? 0),
    resolutionRate: totalResult[0]?.count ? (Number(resolvedResult[0]?.count) / Number(totalResult[0]?.count) * 100).toFixed(1) : "0",
  };

  const data = CONSTITUENCY_DATA.default;

  const prompt = `
    Generate a professional, inspiring political speech for a leader in a constituency.
    Topic: "${topic}"
    Target Audience: "${audienceType}"
    
    Constituency Statistics:
    - Population: ${data.population.toLocaleString()}
    - Farmers: ${data.farmers.toLocaleString()}
    - Irrigation Projects: ${data.irrigationProjects}
    - Total Citizen Complaints: ${stats.totalComplaints}
    - Resolved Complaints: ${stats.resolvedComplaints} (${stats.resolutionRate}% resolution rate)
    - Active Schemes: ${data.schemes.join(", ")}
    - Recent Achievements: ${data.achievements.join(", ")}
    - Total Budget: ${data.budget}

    Respond in JSON format with these fields:
    - speech: The full text of the speech (approx 300-500 words). Inject the provided statistics naturally.
    - keyPoints: An array of 5 main takeaways from the speech.
    - dataPointsUsed: An array of the specific statistics you included in the speech.
  `;

  const result = await runGeminiPrompt<SpeechResult>(
    prompt,
    () => generateSpeechMock(topic, audienceType, stats)
  );

  const wordCount = result.speech.split(/\s+/).length;

  return res.json({
    speech: result.speech,
    wordCount,
    keyPoints: result.keyPoints,
    dataPointsUsed: result.dataPointsUsed,
  });
});

export default router;
