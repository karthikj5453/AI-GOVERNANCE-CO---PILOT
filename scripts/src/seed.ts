import { db } from "@workspace/db";
import { complaintsTable, boothMetricsTable } from "@workspace/db/schema";

const BOOTH_LOCATIONS = [
  { id: "B001", name: "Ward 1 - Central", lat: 20.5937, lng: 78.9629 },
  { id: "B002", name: "Ward 2 - North", lat: 20.6150, lng: 78.9450 },
  { id: "B003", name: "Ward 3 - East", lat: 20.5800, lng: 79.0100 },
  { id: "B004", name: "Ward 4 - South", lat: 20.5600, lng: 78.9800 },
  { id: "B005", name: "Ward 5 - West", lat: 20.5900, lng: 78.9200 },
  { id: "B006", name: "Ward 6 - Northeast", lat: 20.6300, lng: 79.0200 },
  { id: "B007", name: "Ward 7 - Southwest", lat: 20.5500, lng: 78.9100 },
  { id: "B008", name: "Ward 8 - Southeast", lat: 20.5400, lng: 78.9900 },
  { id: "B009", name: "Ward 9 - Northwest", lat: 20.6200, lng: 78.9300 },
  { id: "B010", name: "Ward 10 - Industrial", lat: 20.6000, lng: 78.9700 },
  { id: "B011", name: "Ward 11 - Market", lat: 20.5850, lng: 78.9550 },
  { id: "B012", name: "Ward 12 - Residential", lat: 20.5750, lng: 78.9750 },
];

const CATEGORIES = [
  { name: "Water Supply", subcategories: ["Shortage", "Quality Issue", "Pipeline Leak", "No Connection"], dept: "Water Department" },
  { name: "Roads & Transport", subcategories: ["Potholes", "Street Lights", "Bus Service", "Road Damage"], dept: "Roads & Transport Department" },
  { name: "Healthcare", subcategories: ["Hospital", "Medicine Shortage", "Doctor Availability", "Ambulance"], dept: "Health Department" },
  { name: "Education", subcategories: ["School Infrastructure", "Teacher Shortage", "Scholarship", "Mid-day Meal"], dept: "Education Department" },
  { name: "Electricity", subcategories: ["Power Cut", "High Bills", "Transformer", "New Connection"], dept: "Electricity Board" },
  { name: "Sanitation", subcategories: ["Garbage Collection", "Sewage", "Drainage", "Open Defecation"], dept: "Municipal Corporation" },
  { name: "Agriculture", subcategories: ["Irrigation", "Seeds", "Fertilizer", "Crop Loan"], dept: "Agriculture Department" },
  { name: "Law & Order", subcategories: ["Police Response", "Street Crime", "Traffic", "Noise Pollution"], dept: "Police Department" },
  { name: "Infrastructure", subcategories: ["Bridge Repair", "Public Building", "Park", "Community Hall"], dept: "Public Works Department" },
  { name: "Housing", subcategories: ["Slum Development", "Rent Issue", "PM Awas", "Land Dispute"], dept: "Housing Board" },
];

const COMPLAINT_TEMPLATES = [
  "Water supply has been irregular for the past {n} weeks in {ward}. Residents are suffering.",
  "There are major potholes on the main road near {ward} that have been causing accidents.",
  "The street lights in {ward} have not been working for {n} days. Area is unsafe at night.",
  "Medicine shortage reported at the primary health center in {ward}. Patients are being turned away.",
  "Power cuts lasting {n} hours daily are affecting businesses and households in {ward}.",
  "Garbage has not been collected for {n} days in {ward}. Health hazard increasing.",
  "Farmers in {ward} urgently need irrigation support. Crops are drying up due to water shortage.",
  "Road from {ward} to the market is completely broken. Vehicles cannot pass after rains.",
  "The school building in {ward} requires urgent repair. Roof is leaking and walls are cracking.",
  "Sewage overflow in {ward} has been creating health hazards for {n} weeks.",
  "No electricity connection in the newly developed area of {ward}. Residents are struggling.",
  "Bus service to {ward} has been discontinued. People have no public transport.",
  "Large potholes on the main highway passing through {ward} have caused {n} accidents this month.",
  "Drinking water is contaminated in {ward}. People are falling sick.",
  "Hospital in {ward} needs additional doctors. Current staff cannot handle the patient load.",
  "PM Awas Yojana beneficiary in {ward} has not received promised housing allocation.",
  "Transformer in {ward} has been faulty for {n} weeks. Area dependent on diesel generators.",
  "Open drains in {ward} are overflowing and mosquito breeding is causing dengue cases.",
  "Agricultural loan application pending for {n} months without response in {ward}.",
  "Police complaint registered {n} weeks ago in {ward} with no action taken.",
];

const CITIZEN_NAMES = [
  "Ramesh Kumar", "Sunita Devi", "Mohan Lal", "Priya Sharma", "Vijay Singh",
  "Kavitha Reddy", "Arjun Patel", "Meena Kumari", "Suresh Verma", "Anita Gupta",
  "Rajesh Mishra", "Lakshmi Nair", "Dinesh Yadav", "Rekha Joshi", "Manoj Tiwari",
  "Geeta Devi", "Ashok Pandey", "Pooja Mehta", "Ravi Shankar", "Usha Rani",
  "Santosh Kumar", "Nirmala Devi", "Prakash Rao", "Savita Patil", "Ganesh Babu",
  "Champa Devi", "Narayan Das", "Shanta Bai", "Kishore Kumar", "Devika Menon",
];

const URGENCY_LEVELS = [
  { level: "High", score: 0.75, weight: 25 },
  { level: "Medium", score: 0.5, weight: 45 },
  { level: "Low", score: 0.25, weight: 30 },
];

const STATUSES = [
  { status: "Pending", weight: 35 },
  { status: "In Progress", weight: 30 },
  { status: "Resolved", weight: 35 },
];

function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateComplaintText(template: string, ward: string): string {
  return template
    .replace("{n}", String(randomInt(2, 8)))
    .replace("{ward}", ward);
}

function randomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysAgo));
  date.setHours(randomInt(6, 22), randomInt(0, 59), randomInt(0, 59));
  return date;
}

async function seed() {
  console.log("🌱 Starting seed...");

  await db.delete(complaintsTable);
  await db.delete(boothMetricsTable);
  console.log("✓ Cleared existing data");

  const complaints: any[] = [];
  const TOTAL_COMPLAINTS = 1000;

  for (let i = 0; i < TOTAL_COMPLAINTS; i++) {
    const booth = BOOTH_LOCATIONS[randomInt(0, BOOTH_LOCATIONS.length - 1)];
    const category = CATEGORIES[randomInt(0, CATEGORIES.length - 1)];
    const subcategory = category.subcategories[randomInt(0, category.subcategories.length - 1)];
    const template = COMPLAINT_TEMPLATES[randomInt(0, COMPLAINT_TEMPLATES.length - 1)];
    const citizenName = CITIZEN_NAMES[randomInt(0, CITIZEN_NAMES.length - 1)];
    const urgencyItem = weightedRandom(URGENCY_LEVELS);
    const statusItem = weightedRandom(STATUSES);
    const createdAt = randomDate(90);
    
    let resolvedAt = null;
    if (statusItem.status === "Resolved") {
      resolvedAt = new Date(createdAt.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000);
    }

    complaints.push({
      citizenName,
      complaintText: generateComplaintText(template, booth.name),
      category: category.name,
      subcategory,
      urgency: urgencyItem.level,
      urgencyScore: Math.round((urgencyItem.score + (Math.random() - 0.5) * 0.2) * 100) / 100,
      department: category.dept,
      affectedArea: booth.name,
      boothId: booth.id,
      location: booth.name,
      status: statusItem.status,
      createdAt,
      resolvedAt,
    });
  }

  const BATCH_SIZE = 100;
  for (let i = 0; i < complaints.length; i += BATCH_SIZE) {
    await db.insert(complaintsTable).values(complaints.slice(i, i + BATCH_SIZE));
  }
  console.log(`✓ Inserted ${TOTAL_COMPLAINTS} complaints`);

  const boothMetrics = BOOTH_LOCATIONS.map((booth) => {
    const boothComplaints = complaints.filter((c) => c.boothId === booth.id);
    const resolved = boothComplaints.filter((c) => c.status === "Resolved").length;
    const total = boothComplaints.length;
    const resolutionRate = total > 0 ? resolved / total : 0.5;
    const sentimentScore = 0.4 + Math.random() * 0.4;
    const schemeCoverage = 0.5 + Math.random() * 0.35;
    const healthScore = Math.round((0.4 * resolutionRate + 0.3 * sentimentScore + 0.3 * schemeCoverage) * 100);

    const highUrgencyCount = boothComplaints.filter((c) => c.urgency === "High").length;
    const urgencyRatio = total > 0 ? highUrgencyCount / total : 0;
    const urgencyLevel = urgencyRatio > 0.4 ? "critical" : urgencyRatio > 0.25 ? "high" : urgencyRatio > 0.1 ? "medium" : "low";

    return {
      boothId: booth.id,
      boothName: booth.name,
      lat: booth.lat + (Math.random() - 0.5) * 0.02,
      lng: booth.lng + (Math.random() - 0.5) * 0.02,
      sentimentScore: Math.round(sentimentScore * 100) / 100,
      healthScore,
      complaintCount: total,
      resolvedComplaints: resolved,
      coveragePercentage: Math.round(schemeCoverage * 100),
      urgencyLevel,
    };
  });

  await db.insert(boothMetricsTable).values(boothMetrics);
  console.log(`✓ Inserted ${boothMetrics.length} booth metrics`);

  console.log("🎉 Seed complete!");
}

seed().catch(console.error).finally(() => process.exit(0));
