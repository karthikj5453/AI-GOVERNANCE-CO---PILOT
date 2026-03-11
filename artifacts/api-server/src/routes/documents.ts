import { Router } from "express";
import { SummarizeDocumentBody } from "@workspace/api-zod";

const router = Router();

function extractKeyEntities(text: string): string[] {
  const entities: string[] = [];
  const budgetMatch = text.match(/(?:Rs\.?|₹|INR|crore|lakh)\s*[\d,]+(?:\s*crore|\s*lakh)?/gi);
  if (budgetMatch) entities.push(...budgetMatch.slice(0, 3));

  const dateMatch = text.match(/\b(20\d\d|January|February|March|April|May|June|July|August|September|October|November|December)\b/gi);
  if (dateMatch) entities.push(...[...new Set(dateMatch)].slice(0, 3));

  const deptMatch = text.match(/\b([A-Z][a-z]+ (?:Department|Ministry|Board|Authority|Corporation))\b/g);
  if (deptMatch) entities.push(...[...new Set(deptMatch)].slice(0, 3));

  const wordMatch = text.match(/\b[A-Z]{2,}\b/g);
  if (wordMatch) entities.push(...[...new Set(wordMatch)].slice(0, 2));

  return [...new Set(entities)].slice(0, 8);
}

function generateSummary(title: string, content: string, documentType: string): string[] {
  const wordCount = content.split(/\s+/).length;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);

  const points: string[] = [];

  const policyMatch = content.match(/(?:policy|scheme|program|initiative|plan|project)\s+(?:for|on|of|to)?\s*([^.!?]+)/i);
  if (policyMatch) {
    points.push(`New ${policyMatch[0].trim().substring(0, 120)}`);
  }

  const budgetMatch = content.match(/(?:budget|allocation|fund|expenditure|investment)[^.!?]*(?:Rs\.?|₹|crore|lakh|\d+)[^.!?]*/i);
  if (budgetMatch) {
    points.push(`Budget allocation: ${budgetMatch[0].trim().substring(0, 120)}`);
  }

  const timelineMatch = content.match(/(?:timeline|deadline|target|complete|implement|launch|by)\s+(?:20\d\d|January|February|March|April|May|June|July|August|September|October|November|December)?[^.!?]*/i);
  if (timelineMatch) {
    points.push(`Implementation timeline: ${timelineMatch[0].trim().substring(0, 120)}`);
  }

  const deptMatch = content.match(/(?:department|ministry|agency|body|authority)\s+(?:of|for)?[^.!?]*/i);
  if (deptMatch) {
    points.push(`Departments involved: ${deptMatch[0].trim().substring(0, 120)}`);
  }

  const riskMatch = content.match(/(?:risk|challenge|concern|issue|problem|obstacle)[^.!?]*/i);
  if (riskMatch) {
    points.push(`Risk factors: ${riskMatch[0].trim().substring(0, 120)}`);
  }

  while (points.length < 5 && sentences.length > 0) {
    const s = sentences.splice(Math.floor(Math.random() * sentences.length), 1)[0];
    if (s && s.trim().length > 20) {
      points.push(s.trim().substring(0, 150));
    }
  }

  if (points.length < 5) {
    const fallbacks = [
      `This ${documentType || "document"} outlines key governance initiatives`,
      "Implementation is planned in a phased manner across multiple departments",
      "Stakeholder consultation and monitoring mechanisms are included",
      "Performance metrics and evaluation frameworks have been established",
      "Regular review and reporting mechanisms are mandated",
    ];
    while (points.length < 5) {
      points.push(fallbacks[points.length]);
    }
  }

  return points.slice(0, 5);
}

function analyzeSentiment(content: string): string {
  const positive = ["improvement", "development", "progress", "success", "benefit", "growth", "achieve", "enhance", "support", "welfare"];
  const negative = ["issue", "problem", "concern", "risk", "challenge", "fail", "delay", "shortage", "crisis"];

  const lowerContent = content.toLowerCase();
  const posCount = positive.filter(w => lowerContent.includes(w)).length;
  const negCount = negative.filter(w => lowerContent.includes(w)).length;

  if (posCount > negCount * 1.5) return "Positive";
  if (negCount > posCount * 1.5) return "Negative";
  return "Neutral";
}

router.post("/summarize", async (req, res) => {
  const parsed = SummarizeDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error });
  }

  const { title, content, documentType } = parsed.data;
  const wordCount = content.split(/\s+/).length;

  const points = generateSummary(title || "Document", content, documentType || "Government Document");
  const keyEntities = extractKeyEntities(content);
  const sentiment = analyzeSentiment(content);

  res.json({
    title: title || "Government Document",
    documentType: documentType || "Policy Document",
    points,
    keyEntities,
    sentiment,
    wordCount,
  });
});

export default router;
