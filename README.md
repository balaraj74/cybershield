<p align="center">
  <img src="public/icon.png" alt="CyberShield AI" width="120" height="120" />
</p>

<h1 align="center">🛡️ CyberShield AI</h1>

<p align="center">
  <strong>AI-Powered Cybersecurity Threat Detection & Response Platform</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#ai-modules">AI Modules</a> •
  <a href="#database">Database</a> •
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License" />
</p>

---

## 📖 Overview

**CyberShield AI** is a full-stack, enterprise-grade cybersecurity platform that leverages artificial intelligence and machine learning to detect, analyze, and respond to cyber threats in real time. It features **9 specialized AI security modules**, a lightweight **endpoint protection agent**, and a premium dark-themed dashboard with a macOS-style floating dock navigator.

The platform is designed with a **privacy-first** architecture — raw content is processed in-memory and never stored. Only anonymized analysis results and metadata are persisted.

---

## ✨ Features

### 🔐 Core Security Features

| Feature | Description |
|---------|-------------|
| **AI Threat Analysis** | Analyze emails, URLs, and messages for phishing, malware, social engineering, and more |
| **Real-Time Dashboard** | Live monitoring with threat trends, category breakdowns, and recent alerts |
| **Endpoint Protection** | Lightweight agent that monitors processes, detects anomalies, and executes remote commands |
| **9 AI Security Modules** | Specialized engines for behavior malware, network IDS, phishing, insider threats, compliance, and more |
| **Breach Checker** | Check if email addresses have been compromised in known data breaches |
| **URL Scanner** | Deep analysis of URLs for phishing, malware hosting, and suspicious patterns |
| **SMS/Message Checker** | Detect social engineering and phishing attempts in text messages |
| **Password Strength Checker** | Evaluate password strength with entropy analysis and breach database lookups |
| **Privacy Analyzer** | Analyze privacy policies and data collection practices of websites |
| **Security Score** | Comprehensive security posture assessment with actionable recommendations |

### 🤖 AI-Powered Chatbot

An integrated AI assistant powered by **Google Gemini** that can:
- Answer cybersecurity questions
- Provide threat analysis insights
- Offer security best practices
- Guide users through the platform

### 🎨 Premium UI/UX

- **Dark Theme** — Pure black `#0a0a0a` background with warm orange/amber accents
- **Floating Dock Navigator** — macOS-style icon dock with hover magnification effects
- **Responsive Design** — Fully responsive across desktop, tablet, and mobile
- **Micro-Animations** — Smooth transitions, hover effects, and interactive elements
- **Glassmorphic Components** — Frosted glass card effects with subtle depth

### 🔒 Privacy & Security

- **Privacy-First** — Raw content processed in-memory, never stored in database
- **Content Hashing** — Only SHA-256 hashes stored as references
- **Row Level Security** — Supabase RLS ensures users only see their own data
- **Rate Limiting** — API rate limiting to prevent abuse
- **Secure Authentication** — Supabase Auth with JWT tokens and role-based access
- **Audit Logging** — Comprehensive audit trail for compliance

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Next.js 16 (React 19 + TypeScript)          │   │
│  │  ┌─────────┐  ┌────────────┐  ┌─────────────────────┐   │   │
│  │  │ Floating │  │  Dashboard │  │   AI Module Pages   │   │   │
│  │  │  Dock    │  │   Charts   │  │  (9 Modules + Tools)│   │   │
│  │  │Navigator │  │  Recharts  │  │                     │   │   │
│  │  └─────────┘  └────────────┘  └─────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │          Component Library (Radix UI)             │    │   │
│  │  │  Button │ Card │ Input │ Dropdown │ Tabs │ ...   │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│          │ API Routes (Proxy)              │ Supabase Auth       │
└──────────┼────────────────────────────────┼─────────────────────┘
           │                                │
           ▼                                ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│   FastAPI Backend        │   │     Supabase Cloud       │
│   (Python 3.11+)         │   │                          │
│                          │   │  ┌──────────────────┐    │
│  ┌────────────────────┐  │   │  │   PostgreSQL DB   │    │
│  │  ThreatAnalyzer    │  │   │  │  (with RLS)       │    │
│  │  (NLP + ML Engine) │  │   │  └──────────────────┘    │
│  └────────────────────┘  │   │  ┌──────────────────┐    │
│  ┌────────────────────┐  │   │  │  Authentication   │    │
│  │  AnomalyDetector   │  │   │  │  (JWT + OAuth)    │    │
│  │  (Isolation Forest)│  │   │  └──────────────────┘    │
│  └────────────────────┘  │   │  ┌──────────────────┐    │
│  ┌────────────────────┐  │   │  │  Row Level        │    │
│  │  9 Security Modules│  │   │  │  Security (RLS)   │    │
│  │  + Module Routes   │  │   │  └──────────────────┘    │
│  └────────────────────┘  │   └──────────────────────────┘
│  ┌────────────────────┐  │
│  │  Endpoint Agent    │  │
│  │  API + AI Engine   │  │
│  └────────────────────┘  │
└─────────────────────────┘
           ▲
           │ HTTP Heartbeat
┌─────────────────────────┐
│  Endpoint Agent (Python) │
│  - Process Monitoring    │
│  - Anomaly Detection     │
│  - Remote Commands       │
└─────────────────────────┘
```

### Data Flow

```
User Input → Next.js API Route (Proxy) → FastAPI Backend
     │                                         │
     │                                    ┌────▼────────┐
     │                                    │ AI Analysis  │
     │                                    │ (In-Memory)  │
     │                                    └────┬────────┘
     │                                         │
     │                              ┌──────────▼──────────┐
     │                              │ Store Anonymized     │
     │                              │ Results (Hash Only)  │
     │                              └──────────┬──────────┘
     │                                         │
     ◄─────── Response (Analysis Result) ──────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.1 | React framework with App Router, SSR, and API routes |
| **React** | 19.2 | UI component library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Radix UI** | Latest | Accessible, unstyled UI primitives |
| **Recharts** | 3.6 | Data visualization (charts, graphs) |
| **TanStack Query** | 5.x | Server state management and caching |
| **Lucide React** | Latest | Icon library (500+ icons) |
| **class-variance-authority** | 0.7 | Type-safe component variant management |
| **Supabase SSR** | 0.8 | Server-side Supabase client |
| **Zod** | 4.x | Schema validation |
| **date-fns** | 4.x | Date utility library |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **FastAPI** | 0.115 | High-performance async Python API framework |
| **Uvicorn** | 0.30 | ASGI server for FastAPI |
| **SQLAlchemy** | 2.0 | Async ORM for database operations |
| **Pydantic** | 2.9 | Data validation and settings management |
| **scikit-learn** | 1.5 | Machine learning (Isolation Forest anomaly detection) |
| **NumPy** | 1.26 | Numerical computing for ML features |
| **HTTPX** | 0.27 | Async HTTP client |
| **SlowAPI** | 0.1 | Rate limiting middleware |
| **python-jose** | 3.3 | JWT token handling |
| **structlog** | 24.4 | Structured logging |
| **asyncpg** | 0.29 | PostgreSQL async driver |
| **aiosqlite** | 0.20 | SQLite async driver (local dev fallback) |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| **Supabase** | PostgreSQL database, authentication, Row Level Security |
| **Docker** | Containerization for frontend and backend |
| **Docker Compose** | Multi-container orchestration |
| **Vercel** | Frontend deployment (optional) |
| **Google Gemini** | AI chatbot integration |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Supabase** account (free tier works)

### Quick Start (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-username/cybershield.git
cd cybershield

# Run both frontend & backend with one command
chmod +x start-dev.sh
./start-dev.sh
```

This will:
1. Create a Python virtual environment
2. Install all Python dependencies
3. Start the FastAPI backend on `http://localhost:8001`
4. Start the Next.js frontend on `http://localhost:8000`

### Manual Setup

#### 1. Frontend (Next.js)

```bash
# Install Node.js dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Start the development server
npm run dev
```

#### 2. Backend (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# OR: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Edit .env with your database URL
# DATABASE_URL=postgresql+asyncpg://...

# Start the backend server
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

#### 3. Database Setup

Run the SQL schema in your Supabase SQL editor:

```bash
# The schema file is located at:
supabase/schema.sql
```

This creates:
- `threat_analyses` — Stores anonymized threat analysis results
- `user_feedback` — User feedback for AI accuracy improvement
- `audit_logs` — Security audit trail
- `user_settings` — Per-user preferences
- Row Level Security policies
- Dashboard views and indexes

### Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:8001
# API Docs: http://localhost:8001/docs
```

---

## 📁 Project Structure

```
cybershield/
│
├── 📄 README.md                    # This file
├── 📄 package.json                 # Node.js dependencies & scripts
├── 📄 docker-compose.yml           # Docker multi-service config
├── 📄 Dockerfile                   # Frontend Docker image
├── 📄 start-dev.sh                 # One-command dev startup script
├── 📄 vercel.json                  # Vercel deployment config
├── 📄 tsconfig.json                # TypeScript configuration
├── 📄 next.config.ts               # Next.js configuration
├── 📄 postcss.config.mjs           # PostCSS (Tailwind) config
├── 📄 eslint.config.mjs            # ESLint configuration
│
├── 🗄️ supabase/
│   └── schema.sql                  # Full database schema with RLS
│
├── 🐍 backend/                     # FastAPI Backend (Python)
│   ├── main.py                     # App entry point, API routes, lifespan
│   ├── config.py                   # Settings & environment config
│   ├── models.py                   # SQLAlchemy ORM models
│   ├── schemas.py                  # Pydantic request/response schemas
│   ├── analyzer.py                 # ThreatAnalyzer — NLP-based threat detection
│   ├── ai_engine.py                # AnomalyDetector — Isolation Forest ML engine
│   ├── module_routes.py            # API routes for all 9 security modules
│   ├── endpoint_routes.py          # Endpoint agent API (register, heartbeat, commands)
│   ├── endpoint_models.py          # SQLAlchemy models for endpoint devices
│   ├── endpoint_schemas.py         # Pydantic schemas for endpoint API
│   │
│   ├── 🧠 AI Security Modules:
│   │   ├── behavior_malware.py     # Module 2: Behavior-based malware detection
│   │   ├── network_ids.py          # Module 3: Network intrusion detection system
│   │   ├── privacy_engine.py       # Module 5: Privacy-preserving AI analysis
│   │   ├── risk_scorer.py          # Module 6: Dynamic risk scoring engine
│   │   ├── phishing_detector.py    # Module 7: AI phishing detection (URL + Email)
│   │   ├── insider_threat.py       # Module 8: Insider threat detection
│   │   └── compliance_engine.py    # Module 9: Compliance automation (GDPR, HIPAA, etc.)
│   │
│   ├── models/                     # ML model persistence directory
│   │   └── isolation_forest.pkl    # Trained anomaly detection model
│   ├── requirements.txt            # Python dependencies
│   ├── Dockerfile                  # Backend Docker image
│   └── .env.example                # Backend environment template
│
├── 🌐 src/                         # Next.js Frontend (TypeScript)
│   ├── middleware.ts                # Auth middleware (route protection)
│   ├── env.ts                      # Environment variable validation (Zod)
│   │
│   ├── 📱 app/                     # Next.js App Router Pages
│   │   ├── layout.tsx              # Root layout (fonts, metadata, providers)
│   │   ├── page.tsx                # Root redirect to /dashboard
│   │   ├── globals.css             # Global styles, CSS variables, animations
│   │   │
│   │   ├── (auth)/                 # Authentication pages (no layout)
│   │   │   ├── login/page.tsx      # Login page
│   │   │   └── signup/page.tsx     # Signup page
│   │   │
│   │   ├── dashboard/page.tsx      # Main security dashboard
│   │   ├── analyze/                # Threat analysis tool
│   │   │   ├── page.tsx            # Analysis input form
│   │   │   └── components/         # Analysis result components
│   │   ├── endpoints/page.tsx      # Endpoint protection dashboard
│   │   ├── chatbot/page.tsx        # AI security chatbot
│   │   ├── history/page.tsx        # Analysis history with filters
│   │   ├── settings/page.tsx       # User settings & preferences
│   │   │
│   │   ├── 🛠️ Security Tools:
│   │   │   ├── url-check/page.tsx         # URL safety scanner
│   │   │   ├── sms-check/page.tsx         # SMS/message checker
│   │   │   ├── password-check/page.tsx    # Password strength analyzer
│   │   │   ├── breach-check/page.tsx      # Data breach checker
│   │   │   ├── privacy-analyzer/page.tsx  # Privacy policy analyzer
│   │   │   └── security-score/page.tsx    # Security posture score
│   │   │
│   │   ├── 🧠 modules/             # AI Security Module Pages
│   │   │   ├── layout.tsx          # Modules layout wrapper
│   │   │   ├── page.tsx            # Modules overview (all 9)
│   │   │   ├── behavior-malware/   # Behavior malware detection UI
│   │   │   ├── network-ids/        # Network IDS dashboard
│   │   │   ├── autonomous-response/# Auto-response controls
│   │   │   ├── privacy-ai/         # Privacy-preserving AI dashboard
│   │   │   ├── risk-score/         # Risk scoring dashboard
│   │   │   ├── phishing/           # Phishing detection tool
│   │   │   ├── insider-threat/     # Insider threat monitoring
│   │   │   └── compliance/         # Compliance framework dashboard
│   │   │
│   │   └── api/                    # Next.js API Route Handlers
│   │       ├── proxy/              # Proxy routes to FastAPI backend
│   │       │   ├── [...path]/route.ts    # Dynamic proxy for all backend routes
│   │       │   ├── stats/route.ts        # Dashboard statistics proxy
│   │       │   └── history/route.ts      # History data proxy
│   │       ├── auth/route.ts       # Authentication endpoints
│   │       ├── health/route.ts     # Health check endpoint
│   │       ├── chatbot/route.ts    # AI chatbot (Gemini integration)
│   │       ├── url-check/route.ts  # URL scanning endpoint
│   │       ├── sms-check/route.ts  # SMS checking endpoint
│   │       ├── password-check/route.ts  # Password checking endpoint
│   │       ├── breach-check/route.ts    # Breach checking endpoint
│   │       ├── privacy-analyze/route.ts # Privacy analysis endpoint
│   │       └── endpoint/route.ts   # Endpoint data proxy
│   │
│   ├── 🧩 components/              # Reusable React Components
│   │   ├── providers.tsx           # React Query + Auth providers
│   │   │
│   │   ├── layout/                 # Layout Components
│   │   │   ├── main-layout.tsx     # Primary page layout wrapper
│   │   │   ├── floating-dock.tsx   # macOS-style floating dock navigator
│   │   │   ├── sidebar.tsx         # Traditional sidebar (legacy)
│   │   │   ├── header.tsx          # Top header bar
│   │   │   └── index.ts           # Layout exports
│   │   │
│   │   ├── ui/                     # UI Component Library
│   │   │   ├── button.tsx          # Button (primary, ghost, outline, gradient)
│   │   │   ├── card.tsx            # Card (default, elevated, glass)
│   │   │   ├── input.tsx           # Form input
│   │   │   ├── textarea.tsx        # Multi-line text input
│   │   │   ├── select.tsx          # Dropdown select
│   │   │   ├── badge.tsx           # Status & severity badges
│   │   │   ├── tabs.tsx            # Tab navigation
│   │   │   ├── accordion.tsx       # Expandable sections
│   │   │   ├── avatar.tsx          # User avatar
│   │   │   ├── dropdown-menu.tsx   # Context/dropdown menus
│   │   │   ├── label.tsx           # Form labels
│   │   │   ├── progress.tsx        # Progress bars
│   │   │   ├── skeleton.tsx        # Loading skeletons
│   │   │   ├── switch.tsx          # Toggle switches
│   │   │   ├── tooltip.tsx         # Hover tooltips
│   │   │   └── mode-indicator.tsx  # Demo mode indicator
│   │   │
│   │   ├── charts/                 # Data Visualization
│   │   │   ├── stat-card.tsx       # Metric stat cards with sparklines
│   │   │   ├── threat-trend-chart.tsx    # Line chart for threat trends
│   │   │   └── threat-category-chart.tsx # Bar chart for threat categories
│   │   │
│   │   └── alerts/                 # Alert Components
│   │       └── alert-list.tsx      # Alert list display
│   │
│   ├── 📚 lib/                     # Utility Libraries
│   │   ├── api.ts                  # API client functions
│   │   ├── auth.ts                 # Auth helper functions
│   │   ├── utils.ts                # General utilities (cn, formatters)
│   │   ├── gemini.ts               # Google Gemini AI integration
│   │   ├── mock-data.ts            # Demo/mock data generators
│   │   ├── permissions.ts          # Role-based permission checks
│   │   ├── rate-limit.ts           # Client-side rate limiting
│   │   └── supabase/               # Supabase Client
│   │       ├── client.ts           # Browser Supabase client
│   │       ├── server.ts           # Server Supabase client
│   │       ├── middleware.ts       # Auth middleware helper
│   │       └── auth-provider.tsx   # React auth context provider
│   │
│   └── 📝 types/
│       └── index.ts                # TypeScript type definitions
│
└── 🎨 public/                      # Static Assets
    ├── icon.png                    # App icon
    ├── favicon.ico                 # Browser favicon
    └── *.svg                       # Vector graphics
```

---

## 🧠 AI Modules

CyberShield features **9 specialized AI security modules**, each powered by its own detection engine:

### Module 1: Endpoint Protection Agent
**File:** `backend/endpoint_routes.py` + `backend/ai_engine.py`

- Lightweight Python agent installed on endpoints (Windows/Linux/Mac)
- Monitors running processes (CPU, memory, network, file handles)
- **Isolation Forest** ML model for behavioral anomaly detection
- Remote command execution (kill processes, isolate devices)
- Real-time heartbeat and status reporting
- Automatic training on normal behavior data

**How the AI works:**
1. **Data Collection Phase** — Agent collects normal process behavior (CPU%, memory, connections)
2. **Feature Extraction** — Converts process data into 7-dimensional feature vectors
3. **Training** — Isolation Forest learns the boundary of "normal" behavior
4. **Detection** — New processes scored on a 0.0–1.0 anomaly scale
5. **Heuristic Fallback** — Rule-based detection when ML model isn't trained yet

### Module 2: Behavior-Based Malware Detection
**File:** `backend/behavior_malware.py`

- Analyzes process behavior patterns for malware indicators
- Detects: file encryption (ransomware), process injection, persistence mechanisms
- Memory scanning for known malware signatures
- Parent-child process tree analysis

### Module 3: Network Intrusion Detection
**File:** `backend/network_ids.py`

- Deep packet analysis and connection monitoring
- **DNS Anomaly Detection** — Identifies suspicious DNS queries (DGA, tunneling)
- **Port Scan Detection** — Detects reconnaissance activities
- **C2 Beacon Detection** — Identifies command-and-control communication patterns
- **Lateral Movement Detection** — Tracks suspicious internal network traversal
- **Data Exfiltration Detection** — Monitors for unusual data transfers

### Module 4: Autonomous Response System
**File:** `backend/module_routes.py` (autonomous response endpoints)

- Automated threat containment and response
- Device isolation capabilities
- IP blocking and firewall rule management
- Configurable response policies
- Automatic threat mitigation with rollback support

### Module 5: Privacy-Preserving AI
**File:** `backend/privacy_engine.py`

- Privacy audit and compliance reporting
- Data transparency logging
- Policy enforcement and updates
- Data minimization analysis
- Consent management tracking

### Module 6: Dynamic Risk Scoring
**File:** `backend/risk_scorer.py`

- Organization-wide risk assessment
- Per-device risk profiles
- Multi-factor risk calculation (vulnerabilities, behavior, patches, compliance)
- Historical risk trend analysis
- Actionable risk reduction recommendations

### Module 7: AI Phishing Detection
**File:** `backend/phishing_detector.py`

- **URL Analysis** — Domain reputation, SSL validation, visual similarity detection
- **Email NLP Analysis** — Subject line analysis, urgency detection, sender reputation
- Brand impersonation detection
- Link extraction and recursive scanning
- Confidence scoring with explainable results

### Module 8: Insider Threat Detection
**File:** `backend/insider_threat.py`

- User behavior profiling and baseline establishment
- Anomalous access pattern detection
- Data access monitoring
- Working hours analysis
- Privilege escalation detection
- Risk scoring per user

### Module 9: Compliance Automation
**File:** `backend/compliance_engine.py`

- Multi-framework support: **GDPR**, **HIPAA**, **SOC 2**, **PCI DSS**, **ISO 27001**, **NIST**
- Automated compliance checks and scoring
- Gap analysis and remediation guidance
- Evidence collection and audit trails
- Real-time compliance monitoring

---

## 📊 API Reference

### Base URL

```
Backend:  http://localhost:8001
Frontend: http://localhost:3000
API Docs: http://localhost:8001/docs  (Swagger UI)
```

### Core Endpoints

| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/analyze` | Analyze content for threats |
| `GET` | `/api/v1/dashboard/stats` | Dashboard statistics |
| `GET` | `/api/v1/dashboard/metrics` | Dashboard KPI metrics |
| `GET` | `/api/v1/dashboard/trends` | Historical trend data |
| `GET` | `/api/v1/history` | Paginated analysis history |
| `GET` | `/api/v1/history/{id}` | Analysis detail by ID |
| `POST` | `/api/v1/feedback` | Submit feedback on analysis |

### Endpoint Agent API

| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/v1/endpoint/register` | Register a new endpoint device |
| `POST` | `/api/v1/endpoint/report` | Submit agent behavior report |
| `GET` | `/api/v1/endpoint/commands/{device_id}` | Get pending commands |
| `POST` | `/api/v1/endpoint/commands/{device_id}/result` | Submit command result |
| `GET` | `/api/v1/endpoint/dashboard` | Endpoint dashboard stats |
| `GET` | `/api/v1/endpoint/devices` | List all registered devices |
| `GET` | `/api/v1/endpoint/threats` | List detected threats |
| `POST` | `/api/v1/endpoint/kill-process` | Kill a process remotely |

### Security Module Endpoints

| Module | Endpoint Prefix | Key Endpoints |
|--------|----------------|---------------|
| Behavior Malware | `/api/v1/modules/behavior-malware` | `/stats`, `/alerts` |
| Network IDS | `/api/v1/modules/network-ids` | `/stats`, `/alerts` |
| Autonomous Response | `/api/v1/modules/autonomous-response` | `/stats`, `/isolate/{id}`, `/block-ip` |
| Privacy AI | `/api/v1/modules/privacy` | `/report`, `/transparency-log`, `/policy` |
| Risk Score | `/api/v1/modules/risk` | `/summary`, `/devices`, `/devices/{id}` |
| Phishing | `/api/v1/modules/phishing` | `/analyze-url`, `/analyze-email`, `/stats`, `/history` |
| Insider Threat | `/api/v1/modules/insider-threat` | `/stats`, `/alerts`, `/profiles` |
| Compliance | `/api/v1/modules/compliance` | `/summary`, `/frameworks/{name}`, `/checks` |
| Modules Overview | `/api/v1/modules/overview` | All module statuses |

---

## 🗄️ Database

### Schema Overview

CyberShield uses **Supabase PostgreSQL** with the following tables:

```sql
threat_analyses     -- Anonymized analysis results (no raw content)
user_feedback       -- User feedback for AI improvement
audit_logs          -- Security audit trail
user_settings       -- Per-user preferences
```

### Endpoint Tables (SQLAlchemy/SQLite)

```sql
endpoint_devices    -- Registered endpoint agents
endpoint_threats    -- Detected endpoint threats
endpoint_activities -- Process activity logs
pending_commands    -- Remote commands queue
```

### Row Level Security (RLS)

All tables have RLS enabled. Users can only:
- **View** their own analyses, feedback, audit logs, and settings
- **Insert** their own analyses, feedback, and settings
- **Update** their own analyses and settings

The service role key (used by backend) bypasses RLS for system operations.

---

## ⚙️ Environment Variables

### Frontend (`.env.local`)

```bash
# Authentication
AUTH_SECRET="your-secret-key-at-least-32-characters"
AUTH_URL="http://localhost:3000"

# FastAPI Backend
FASTAPI_URL="http://localhost:8001"
FASTAPI_API_KEY="cybershield-api-key-2024"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Application
NEXT_PUBLIC_APP_NAME="CyberShield AI"
NEXT_PUBLIC_DEMO_MODE=false
```

### Backend (`backend/.env`)

```bash
# Application
APP_NAME="CyberShield AI"
DEBUG=true
DEMO_MODE=true

# Server
HOST=0.0.0.0
PORT=8001

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db

# Security
SECRET_KEY="your-secret-key"
API_KEY="cybershield-api-key-2024"

# AI Model
MODEL_CONFIDENCE_THRESHOLD=0.5
MAX_CONTENT_LENGTH=50000

# Privacy
RETENTION_DAYS=30
ANONYMIZE_DATA=true
```

---

## 🐳 Deployment

### Docker Compose (Recommended)

```bash
docker-compose up --build -d
```

This starts:
- **Frontend** container on port `3000`
- **Backend** container on port `8001`
- Internal networking between services

### Vercel (Frontend Only)

```bash
# Deploy frontend to Vercel
vercel --prod
```

Configure environment variables in Vercel dashboard. Set `FASTAPI_URL` to your hosted backend URL.

### Manual Production

```bash
# Frontend
npm run build
npm start

# Backend
cd backend
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4
```

---

## 🎨 Design System

### Color Palette

| Variable | Value | Usage |
|---------|-------|-------|
| `--background` | `#0a0a0a` | Page background (pure black) |
| `--foreground` | `#e5e5e5` | Primary text |
| `--accent` | `#e85d04` | Primary accent (orange) |
| `--accent-light` | `#f48c06` | Hover states |
| `--accent-dark` | `#dc2f02` | Active states |
| `--card-bg` | `#141414` | Card backgrounds |
| `--card-border` | `#1e1e1e` | Card borders |
| `--surface` | `#111111` | Surface elements |
| `--muted` | `#737373` | Muted text |
| `--success` | `#22c55e` | Success indicators |
| `--danger` | `#ef4444` | Error/danger indicators |

### Component Variants

- **Button**: `default` (gradient), `outline`, `ghost`, `destructive`
- **Card**: `default` (subtle), `elevated` (lifted), `glass` (frosted)
- **Badge**: `default`, `critical`, `high`, `medium`, `low`, `safe`

### Floating Dock Navigator

The navigation uses a macOS-style floating dock with:
- **Icon magnification** — Icons smoothly scale up as the cursor approaches (1.0x → 1.4x)
- **Orange active indicator** — Left-side bar on the active route
- **Hover tooltips** — Label appears to the right on hover
- **Expandable** — Shows contextual items by default, expands to show all
- **Glassmorphic background** — Semi-transparent dark blur effect

---

## 🧪 Available Scripts

```bash
# Development
npm run dev          # Start Next.js dev server (port 3000)
npm run dev:full     # Start both frontend + backend (port 8000/8001)

# Build & Production
npm run build        # Build production bundle
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint

# Backend
cd backend
python3 -m uvicorn main:app --reload --port 8001   # Dev server
python3 -m uvicorn main:app --workers 4 --port 8001 # Production
```

---

## 🔐 Authentication Flow

```
1. User visits /login
2. Credentials sent to Supabase Auth
3. Supabase returns JWT token
4. Token stored in HTTP-only cookie via Supabase SSR
5. Middleware validates token on every request
6. Protected routes redirect to /login if unauthenticated
7. Role-based access control (admin, analyst, viewer)
```

### Protected Routes

All routes except `/login` and `/signup` require authentication. The middleware (`src/middleware.ts`) handles:
- Session validation via Supabase SSR
- Token refresh
- Redirect to login for unauthenticated users
- Public path exceptions

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

- **Documentation**: API docs at `http://localhost:8001/docs`
- **Issues**: GitHub Issues
- **Security**: Report vulnerabilities via private disclosure

---

<p align="center">
  Built with ❤️ for cybersecurity
</p>
