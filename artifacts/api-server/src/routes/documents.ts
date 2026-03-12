import { Router } from "express";
import { SummarizeDocumentBody } from "@workspace/api-zod";
import { runGeminiPrompt } from "../lib/gemini";

const router = Router();

interface SummaryResult {
  points: string[];
  keyEntities: string[];
  sentiment: string;
}

function summarizeDocumentMock(title: string, content: string, documentType: string): SummaryResult {
  const points = [
    `This ${documentType || "document"} outlines key governance initiatives`,
    "Implementation is planned in a phased manner across multiple departments",
    "Stakeholder consultation and monitoring mechanisms are included",
    "Performance metrics and evaluation frameworks have been established",
    "Regular review and reporting mechanisms are mandated",
  ];
  return {
    points,
    keyEntities: ["Department", "Budget", "Timeline"],
    sentiment: "Neutral",
  };
}

router.post("/summarize", async (req, res) => {
  const parsed = SummarizeDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error });
  }

  const { title, content, documentType } = parsed.data;
  const wordCount = content.split(/\s+/).length;

  const prompt = `
    Analyze and summarize the following government/policy document text:
    Title: "${title || "Untitled"}"
    Type: "${documentType || "Policy Document"}"
    Content: "${content}"

    Respond in JSON format with these fields:
    - points: An array of exactly 5 bullet points summarizing the most critical aspects (e.g., budget, timeline, key goals).
    - keyEntities: An array of the top 5-8 entities mentioned (departments, locations, budget amounts, etc.).
    - sentiment: "Positive", "Neutral", or "Negative" based on the tone of the document.
  `;

  const summary = await runGeminiPrompt<SummaryResult>(
    prompt,
    () => summarizeDocumentMock(title || "", content, documentType || "")
  );

  return res.json({
    title: title || "Government Document",
    documentType: documentType || "Policy Document",
    points: summary.points,
    keyEntities: summary.keyEntities,
    sentiment: summary.sentiment,
    wordCount,
  });
});

export default router;
