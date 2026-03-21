
<div align="center">

### An AI-Powered Intelligence Operating System for Political Leaders

[![Hackathon Submission](https://img.shields.io/badge/Hackathon-Submission-8A2BE2.svg)](https://github.com/yourusername/ai-governance-copilot)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-lightgrey)](https://expressjs.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-1.5_Flash-green)](https://aistudio.google.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle_ORM-0.45-orange)](https://orm.drizzle.team/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Transforming Reactive Administration into Predictive Leadership with Gemini AI**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Technology Stack](#-technology-stack)
- [Key Features & Implementation](#-key-features--implementation)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [API Documentation](#-api-documentation)

---

## 💡 Overview

**AI Governance Co-Pilot** is a full-stack intelligence dashboard designed for political leaders and government administrators. It transforms fragmented citizen data, complaints, and policy documents into real-time, actionable insights using the **Google Gemini AI** engine.

---

## 🛠 Technology Stack

### Frontend
- **React 19 & Vite**: Utilizing the latest React features for a high-performance UI.
- **Tailwind CSS 4.0**: Modern styling with a utility-first approach.
- **Radix UI & Shadcn/UI**: Accessible, high-quality component primitives.
- **React Leaflet**: Interactive maps for geographical data visualization.
- **Recharts**: Dynamic charting for administrative analytics.
- **Wouter**: Lightweight routing for a seamless SPA experience.

### Backend
- **Express 5 (TypeScript)**: The next-gen Express framework for robust API development.
- **Node.js 24**: Leveraging the latest LTS runtime features.
- **Drizzle ORM**: A type-safe, lightweight ORM for high-performance database interactions.
- **PostgreSQL**: Reliable relational data storage.

### AI & Intelligence
- **Google Gemini 1.5 Flash**: SOTA large language model for real-time data processing and insight generation.
- **Zod**: Runtime schema validation for end-to-end type safety.
- **Orval**: Automated API client and React Query hook generation from OpenAPI specs.

---

## ✨ Key Features & Implementation

What we built in this project:

- **🚀 Automated Complaint Ingestion**: A robust pipeline that receives citizen complaints, uses Gemini AI to categorize them (Infrastructure, Healthcare, Education, etc.), and assigns priority levels automatically.
- **🗺️ Constituency Heatmaps**: Geographical visualization of issues across different voting booths and sectors, allowing leaders to identify "hotspots" of public concern.
- **📊 Executive Dashboard**: A high-level overview of administrative health, featuring sentiment trends, unresolved issue counts, and resource allocation metrics.
- **📝 AI Document Intelligence**: A policy analysis tool that can ingest long government documents and generate concise 5-point summaries or impact assessments using Gemini AI.
- **🎤 Data-Driven Speech Generator**: An intelligent tool for leaders to generate context-aware speeches based on real-time data from specific constituencies or demographics.
- **🔔 Real-time Alerts**: An intelligent notification system that flags emerging crises or significant shifts in public sentiment before they escalate.
- **🏗️ Industrial-Grade Architecture**: A full pnpm monorepo setup ensuring shared types and logic between the API, database schema, and frontend clients.

---

## 📂 Project Structure

```text
AI-GOVERNANCE-CO-PILOT/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server with Gemini AI integration
│   └── governance-copilot/ # React frontend dashboard
├── lib/                    # Shared libraries (The "Engine Room")
│   ├── api-spec/           # OpenAPI 3.1 specifications
│   ├── api-client-react/   # Type-safe React Query hooks (Auto-generated)
│   ├── api-zod/            # Shared Zod validation schemas
│   └── db/                 # Drizzle ORM schema & migrations
└── scripts/                # Utility & Seeding scripts
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v24+)
- pnpm (`npm install -g pnpm`)
- PostgreSQL instance
- **Google Gemini API Key** (Get one at [Google AI Studio](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-governance-copilot.git
   cd ai-governance-copilot/AI-GOVERNANCE-CO---PILOT
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root based on `.env.example`:
   ```bash
   GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
   DATABASE_URL=postgresql://user:password@localhost:5432/db_name
   PORT=3000
   ```

4. **Seed the Database** (Optional - generates 1000 mock complaints)
   ```bash
   pnpm --filter @workspace/scripts run seed
   ```

### Running the Application

Start both the API and Frontend in development mode:

```bash
# Start Backend
pnpm --filter @workspace/api-server run dev

# Start Frontend
pnpm --filter @workspace/governance-copilot run dev
```

---

## 🛡 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

- Built for the AI Governance Hackathon.
- UI components powered by Radix UI and Lucide React.
- Maps provided by Leaflet.js.
