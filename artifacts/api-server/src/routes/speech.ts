import { Router } from "express";
import { GenerateSpeechBody } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { complaintsTable } from "@workspace/db/schema";
import { count, eq } from "drizzle-orm";

const router = Router();

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

const AUDIENCE_TEMPLATES: Record<string, (data: typeof CONSTITUENCY_DATA.default, topic: string, stats: Record<string, number>) => string> = {
  Farmers: (data, topic, stats) => `
Distinguished guests, fellow farmers, and respected citizens,

Today, I stand before you to discuss ${topic} — a matter close to our hearts and central to our constituency's progress.

Over ${data.farmers.toLocaleString()} farming families in our constituency have directly benefited from government schemes. Under the PM Kisan Samman Nidhi, each eligible farmer receives ₹6,000 annually, providing crucial financial support.

We have successfully completed ${data.irrigationProjects} irrigation projects, bringing water to ${data.irrigationVillages} villages that once struggled through dry seasons. The completion rate of agricultural infrastructure projects stands at an impressive milestone.

Our Jal Jeevan Mission has connected ${Math.floor(data.population * 0.72).toLocaleString()} households with clean piped water, transforming daily life for farming families. Women and children no longer spend hours fetching water — they can focus on education and productivity.

We have distributed over 2,500 solar-powered irrigation pumps, reducing dependency on expensive diesel and enabling year-round cultivation. Farmers in our constituency have reported a 30-40% increase in agricultural income.

Looking ahead, we are committed to establishing 3 more cold storage facilities, expanding crop insurance coverage to 95% of farmers, and bringing precision farming technology to every panchayat.

Together, we are building a prosperous, self-sufficient agricultural community. Our fields are our strength, and your hard work is our greatest asset. Thank you.
  `.trim(),

  Youth: (data, topic, stats) => `
Dear young friends and future leaders,

I am inspired to speak with you today about ${topic} — because you are the architects of tomorrow.

In our constituency, we have ${data.schools} schools and educational institutions that have been upgraded with modern infrastructure and digital classrooms. More than 8,000 students have benefited from scholarship programs, with special focus on first-generation learners.

We have established skill development centers in 6 locations, training over 1,200 youth in digital skills, vocational trades, and entrepreneurship. Forty new businesses have been started by young entrepreneurs under our startup support initiative.

Our constituency's internet connectivity has reached 92% of villages, opening doors to online education, remote work, and digital commerce. Youth unemployment has dropped significantly as a result of these combined efforts.

We are launching a Youth Leadership Academy to identify and nurture the next generation of leaders. Internship programs with government departments are being expanded to 200 positions annually.

The future belongs to you. Every complaint raised, every suggestion made, every voice that speaks up makes our governance better. I urge each one of you to be active citizens and co-creators of our constituency's future.

Together, let us build a constituency where talent triumphs over circumstance. Thank you.
  `.trim(),

  Women: (data, topic, stats) => `
Respected sisters and fellow citizens,

Today I address ${topic} — because the strength of our constituency lies in the strength of its women.

Under PM Awas Yojana, ${Math.floor(data.population * 0.08).toLocaleString()} families have received homes, with 80% registered in women's names — ensuring security and ownership for our sisters and mothers.

Our Self Help Group movement has grown to over 340 groups with more than 4,000 women members. These groups have collectively accessed loans worth ₹12 crore for livelihood activities, from tailoring to food processing to handicrafts.

The Ayushman Bharat scheme has provided free health coverage up to ₹5 lakh per family to ${Math.floor(data.population * 0.6).toLocaleString()} households. Maternal mortality in our constituency has dropped by 35% over the past three years.

We have established 4 women's safety centers with trained counselors and legal support. Dedicated women police officers are now available in all 3 police stations in our constituency.

Our child nutrition program has reached 95% of anganwadis, dramatically reducing malnutrition among children under five. Because when mothers are healthy and supported, children thrive.

You are not just beneficiaries of development — you are drivers of it. I am committed to ensuring that every woman in our constituency can live with dignity, safety, and opportunity.

Jai Hind. Jai Mahila Shakti.
  `.trim(),

  General: (data, topic, stats) => `
Respected citizens,

It is my honor to address you today on ${topic} — a topic of vital importance to every family in our constituency.

Over the past period, our constituency has witnessed remarkable development. We have completed ${data.roads} kilometers of new roads, connecting remote villages to market centers and reducing travel time significantly. ${data.hospitals} healthcare centers have been upgraded or newly established, bringing quality medical care closer to home.

In education, ${data.schools} schools have received infrastructure improvements, new classrooms, and additional teachers. The dropout rate has fallen by 28%, while enrollment of girls has increased by 22%.

Total government expenditure in our constituency reached ${data.budget}, with ${stats.resolvedComplaints || 0} citizen complaints resolved promptly. Our complaint resolution rate demonstrates our commitment to responsive governance.

The Jal Jeevan Mission has transformed water access across ${data.irrigationVillages} villages. Electricity has reached the final mile, with 99.2% household electrification achieved. Digital connectivity is enabling new economic opportunities for our youth.

But challenges remain. We continue to work on reducing the ${stats.pendingComplaints || 'remaining'} pending issues, improving public transport links, and strengthening our primary healthcare network.

I invite you to be partners in this journey. Your participation — whether through voting, raising concerns, or contributing to community initiatives — makes governance stronger.

Thank you for your trust. Together, we build.
  `.trim(),
};

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
  };

  const data = CONSTITUENCY_DATA.default;
  const template = AUDIENCE_TEMPLATES[audienceType] || AUDIENCE_TEMPLATES.General;
  const speech = template(data, topic, stats);

  const wordCount = speech.split(/\s+/).length;

  const keyPoints = [
    `Addressing ${topic} for ${audienceType} audience`,
    `${data.farmers.toLocaleString()} farmers benefited from schemes`,
    `${data.irrigationProjects} irrigation projects completed`,
    `${stats.resolvedComplaints} complaints resolved`,
    `${data.budget} total development expenditure`,
  ];

  const dataPointsUsed = [
    `Farmer count: ${data.farmers.toLocaleString()}`,
    `Irrigation projects: ${data.irrigationProjects}`,
    `Constituency population: ${data.population.toLocaleString()}`,
    `Schemes active: ${data.schemes.join(", ")}`,
    `Roads built: ${data.roads} km`,
    `Complaints resolved: ${stats.resolvedComplaints}`,
  ];

  res.json({
    speech,
    wordCount,
    keyPoints,
    dataPointsUsed,
  });
});

export default router;
