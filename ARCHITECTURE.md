# OutreachReady Architecture & DB Schema

## Overview
OutreachReady is a platform that provides hyper-personalized lead lists and AI-crafted cold outreach icebreakers. This document outlines the technical architecture and database schema.

## Database Schema (SQLite via Turso)

We use `team-db` for all database interactions. The following tables will be created:

### `prospects`
Stores information about potential leads found for clients.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | Unique identifier (UUID). |
| `free_trial_id` | TEXT | ID of the free trial submission that generated this lead. |
| `email` | TEXT | Verified contact email of the prospect. |
| `first_name` | TEXT | Prospect's first name. |
| `last_name` | TEXT | Prospect's last name. |
| `company_name` | TEXT | Name of the prospect's company. |
| `website_url` | TEXT | URL of the prospect's website. |
| `niche` | TEXT | Target niche/industry. |
| `location` | TEXT | Geographic location of the prospect. |
| `website_text` | TEXT | Scraped text content from the prospect's website. |
| `ai_icebreaker` | TEXT | The hyper-personalized AI-generated icebreaker. |
| `status` | TEXT | Status: `pending`, `scraped`, `completed`, `sent`. |
| `created_at` | DATETIME | Timestamp of creation. |

### `free_trials`
Stores submissions from the landing page free trial form.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | Unique identifier (UUID). |
| `submitter_email` | TEXT | Email of the person requesting the sample. |
| `target_niche` | TEXT | Niche they are targeting (e.g., "Dental Clinics"). |
| `target_location` | TEXT | Location they are targeting (e.g., "London"). |
| `submitter_website` | TEXT | Website of the submitter's agency/business. |
| `status` | TEXT | Status: `pending`, `processing`, `completed`, `failed`. |
| `created_at` | DATETIME | Timestamp of submission. |

---

## High-Level File Structure

The project will be housed in the `HennyWes/HennyWes` repository with a clean separation between frontend and backend.

```text
/
├── client/              # Vite + React + Tailwind CSS (Landing Page)
│   ├── src/
│   │   ├── components/  # Reusable UI (Hero, Form, Pricing, Modal)
│   │   ├── hooks/       # API interaction hooks
│   │   ├── pages/       # Landing page sections
│   │   └── App.tsx      # Main application entry
│   └── package.json
├── server/              # Node.js + Express (Backend API & Workers)
│   ├── src/
│   │   ├── index.ts     # Main API entry point (Port 3000)
│   │   ├── routes/      # API endpoints (e.g., /api/free-trial)
│   │   ├── services/    # Business logic
│   │   │   ├── scraper.ts   # Lead sourcing & website scraping
│   │   │   ├── ai.ts        # Gemini API icebreaker generation
│   │   │   └── db.ts        # team-db wrapper functions
│   │   └── workers/     # Background job processing
│   └── package.json
├── shared/              # Shared TypeScript types and constants
└── package.json         # Root package.json (Workspaces)
```

---

## Process Flow: Lead Generation & Personalization

1. **User Submission**: A visitor fills out the free trial form on the landing page.
2. **Data Persistence**: The server receives the request and inserts a row into `free_trials` with status `pending`.
3. **Lead Sourcing**:
   - A background worker picks up `pending` trials.
   - It uses a search API (or scraping) to find 5 businesses matching the `target_niche` and `target_location`.
   - It finds contact info (Email, Name) and Website URLs for these businesses.
4. **Website Scraping**:
   - For each found lead, the worker fetches the homepage HTML/text.
   - It cleans and extracts key information (services offered, unique selling points, mission statement).
5. **AI Icebreaker Generation**:
   - The worker sends the extracted text and lead info to the Gemini LLM.
   - **Prompt**: "Act as a B2B sales expert. Write a short, professional, and hyper-personalized icebreaker for a cold outreach email to [Name] at [Company]. Use this website info: [Website Text]. The icebreaker should sound human, reference a specific detail from their site, and transition naturally into a value proposition for [Submitter Business Type]."
6. **Finalization**:
   - The generated icebreaker and lead info are saved to the `prospects` table.
   - The `free_trials` status is updated to `completed`.
   - (Future) Notify the submitter via email.

---

## Technical Stack
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion (for polish).
- **Backend**: Node.js, Express, TypeScript.
- **Database**: SQLite (via `team-db` / Turso).
- **AI**: Gemini Pro API (via Google Generative AI SDK).
- **Scraping**: Puppeteer or Cheerio (depending on complexity).
