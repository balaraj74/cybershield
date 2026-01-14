# CyberShield AI - Threat Detection Platform

![CyberShield AI](https://img.shields.io/badge/CyberShield-AI--Powered-00bcd4?style=for-the-badge&logo=shield)
![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?style=for-the-badge&logo=typescript)

A **production-grade, privacy-first AI cybersecurity platform** for real-time threat detection, phishing analysis, and security monitoring.

## 🎯 Overview

CyberShield AI is an enterprise-ready web application that acts as a secure frontend and API gateway for AI-powered threat detection. Built with modern web technologies and designed with security as a first-class concern.

### Key Features

- **🔍 Threat Analysis** - Analyze emails, URLs, and messages for phishing, malware, and social engineering
- **🧠 Explainable AI** - Plain-English explanations of why content was flagged
- **📊 Real-time Dashboard** - Monitor threats, view trends, and track security metrics
- **🔐 Privacy-First** - No raw content storage, hash-based references only
- **👥 RBAC** - Role-based access control (Admin, Analyst, Viewer)
- **⚡ Fast & Secure** - Server-rendered, rate-limited, and hardened

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (Strict Mode) |
| Styling | Tailwind CSS |
| UI Components | Radix UI + Custom Components |
| State Management | React Query (TanStack) |
| Authentication | NextAuth.js (Auth.js) |
| Validation | Zod |
| Charts | Recharts |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- FastAPI backend (optional - demo mode available)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd cybershield

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cybershield.ai | admin123secure |
| Analyst | analyst@cybershield.ai | analyst123secure |
| Viewer | viewer@cybershield.ai | viewer123secure |

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   │   └── login/
│   ├── dashboard/         # Main dashboard
│   ├── analyze/           # Threat analysis
│   ├── history/           # Analysis history
│   ├── settings/          # User settings
│   ├── privacy/           # Privacy policy
│   └── api/               # API routes
│       ├── auth/          # NextAuth handlers
│       └── proxy/         # Secure API gateway
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── charts/           # Data visualization
│   ├── alerts/           # Alert components
│   └── layout/           # Layout components
├── lib/                   # Utilities and services
│   ├── auth.ts           # NextAuth configuration
│   ├── api.ts            # FastAPI client
│   ├── permissions.ts    # RBAC logic
│   ├── rate-limit.ts     # Rate limiting
│   └── mock-data.ts      # Demo data
├── types/                 # TypeScript definitions
└── env.ts                # Environment validation
```

## 🔒 Security Features

### Authentication & Authorization
- JWT-based session handling
- Role-based access control (RBAC)
- Middleware-level route protection
- Secure cookie configuration

### API Security
- Rate limiting per user/IP
- Input validation with Zod schemas
- Secure FastAPI proxy
- Error masking (no stack traces)

### Headers & CSP
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict referrer policy

### Privacy
- No raw content storage
- SHA-256 hash-based references
- Auto-delete after analysis
- Configurable retention periods

## 🔌 Backend Integration

CyberShield acts as a secure gateway to a FastAPI AI backend:

```
[Client] → [Next.js API Route] → [FastAPI Backend]
            ↓
    - Auth validation
    - Rate limiting
    - Input validation
    - Response sanitization
```

### Expected FastAPI Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/analyze` | POST | Submit content for analysis |
| `/api/v1/stats/dashboard` | GET | Dashboard statistics |
| `/api/v1/history` | GET | Analysis history |
| `/health` | GET | Health check |

### Demo Mode

Set `NEXT_PUBLIC_DEMO_MODE=true` to run with mock data (no FastAPI required).

## 📊 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_SECRET` | NextAuth secret (32+ chars) | Required |
| `AUTH_URL` | Application URL | http://localhost:3000 |
| `FASTAPI_URL` | Backend API URL | http://localhost:8000 |
| `FASTAPI_API_KEY` | Backend API key | Optional |
| `NEXT_PUBLIC_DEMO_MODE` | Enable demo mode | true |
| `RATE_LIMIT_REQUESTS` | Max requests per window | 100 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 60000 |

## 🧪 Development

```bash
# Run development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 🏗️ Architecture Principles

1. **Separation of Concerns**
   - Next.js = UI + Auth + API Gateway
   - FastAPI = AI/ML + Threat Detection

2. **Zero Trust**
   - All API requests validated
   - No direct backend exposure
   - Rate limiting at gateway

3. **Privacy by Design**
   - Input deleted after processing
   - Hash-based record keeping
   - Configurable retention

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ for a hackathon. This system is designed to be **secure, privacy-aware, deployable, and built by serious engineers.**

