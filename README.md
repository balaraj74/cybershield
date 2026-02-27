<p align="center">
  <img src="public/icon.png" alt="CyberShield AI" width="120" height="120" />
</p>

<h1 align="center">🛡️ CyberShield AI</h1>

<p align="center">
  <strong>AI-Powered Cybersecurity Threat Detection & Response Platform</strong><br/>
  <em>Privacy-first • Behavior-based • Real-time • Open source</em>
</p>

<p align="center">
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-what-makes-cybershield-different">Why Different</a> •
  <a href="#-use-cases">Use Cases</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-ai-modules-deep-dive">AI Modules</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-deployment">Deployment</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/scikit--learn-ML-F7931E?logo=scikit-learn" alt="scikit-learn" />
  <img src="https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License" />
</p>

---

## 📖 What is CyberShield AI?

**CyberShield AI** is a full-stack, open-source cybersecurity platform that uses **artificial intelligence** and **machine learning** to detect, analyze, and respond to cyber threats in real time. Unlike traditional antivirus software that relies on signature databases (lists of known malware), CyberShield watches **how programs behave** — meaning it can catch **zero-day threats** that have never been seen before.

The platform consists of three core pillars:

| Pillar | What It Does |
|--------|-------------|
| **🧠 9 AI Security Modules** | Specialized ML engines for phishing, malware, network intrusions, insider threats, compliance, and more |
| **🔍 Endpoint Protection Agent** | A lightweight Python agent installed on devices that monitors processes, files, and network activity in real time |
| **📊 Security Operations Dashboard** | A premium dark-themed web interface with live threat monitoring, trend analysis, and one-click response actions |

---

## 🔄 How It Works

### The End-to-End Detection Pipeline

CyberShield operates as a continuous detection loop. Here's exactly what happens from the moment data enters the system to the moment a threat is neutralized:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        THE CYBERSHIELD PIPELINE                         │
│                                                                         │
│  ❶ COLLECT          ❷ ANALYZE           ❸ DETECT          ❹ RESPOND    │
│  ─────────          ─────────           ─────────          ─────────    │
│  Endpoint agent     NLP + ML engines    Pattern matching   Auto-isolate │
│  scans processes    process raw data    flags anomalies    & alert      │
│  every 30 seconds   in-memory only      with confidence    operators    │
│                                         scores                          │
│                                                                         │
│  Process Monitor ──→ Feature Extraction ──→ Isolation Forest ──→ Alert  │
│  File Watcher   ──→ Behavior Analysis  ──→ Rule Engine      ──→ Block  │
│  Network Monitor──→ DNS/IP Analysis    ──→ Anomaly Scoring  ──→ Report │
│  User Input     ──→ NLP Parsing        ──→ Threat Classify  ──→ Score  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Walkthrough

#### Step 1: Data Collection (Endpoint Agent)

The lightweight Python agent (`agent/`) runs on each protected device and collects:

| Data Source | What's Collected | How Often |
|------------|-----------------|-----------|
| **Process Monitor** | CPU %, memory, thread count, open file handles, network connections, parent PID, command line | Every 30 seconds |
| **File Watcher** | File creation, modification, deletion, rename events; tracks ransomware-like bulk encryption patterns | Real-time (inotify/FSEvents) |
| **Network Monitor** | Active connections, DNS queries, data transfer volumes, destination IPs/ports, protocol analysis | Every 30 seconds |

```python
# What the agent sends to the server every cycle:
{
  "device_id": "abc-123",
  "hostname": "workstation-01",
  "process_behaviors": [
    {"pid": 1234, "name": "chrome", "avg_cpu": 12.5, "memory_mb": 450, 
     "num_connections": 23, "io_write_rate": 1024, ...},
    {"pid": 5678, "name": "suspicious.exe", "avg_cpu": 95.0, "memory_mb": 2048, 
     "num_connections": 1, "io_write_rate": 50000000, ...}  # ← Anomaly!
  ],
  "file_activity": {"files_created": 500, "files_modified": 2300, ...},
  "network_summary": {"total_connections": 45, "unique_destinations": 12, ...}
}
```

#### Step 2: In-Memory AI Analysis (Backend)

The FastAPI backend receives reports and runs them through **multiple AI engines simultaneously** — without ever writing raw data to disk:

1. **Feature Extraction** — Process behavior data is converted into 7-dimensional feature vectors:
   - `[cpu_percent, memory_mb, num_threads, num_connections, io_write_rate, num_open_files, uptime_seconds]`

2. **Isolation Forest ML Model** — An unsupervised anomaly detection algorithm trained on "normal" behavior:
   - Scores each process on a **0.0–1.0 anomaly scale**
   - No labeled training data needed — learns what "normal" looks like and flags deviations
   - Self-improving: retrains automatically as baselines shift

3. **Heuristic Rule Engine** — Acts as a fallback when the ML model hasn't accumulated enough training data:
   - Known malicious process names (mimikatz, cobalt strike, metasploit)
   - Suspicious command-line patterns (encoded PowerShell, hidden windows)
   - Resource abuse thresholds (CPU > 90% for crypto miners)
   - Process injection signatures (DLL hollowing, reflective loading)

4. **Specialized Module Analysis** — Each of the 9 modules runs its own detection logic in parallel

#### Step 3: Threat Classification & Scoring

Every detected anomaly receives:

| Attribute | Description | Example |
|-----------|-------------|---------|
| **Anomaly Score** | 0.0 (normal) → 1.0 (highly anomalous) | `0.87` |
| **Severity** | critical / high / medium / low | `critical` |
| **Threat Type** | Categorization of the threat | `ransomware` |
| **Confidence** | How certain the system is | `92%` |
| **Explanation** | Human-readable reason | `"Process encrypting files at 50MB/s with high CPU usage"` |
| **Recommended Action** | What should be done | `"Isolate device immediately"` |

#### Step 4: Automated Response

When a critical threat is detected, the **Autonomous Response System** can:

- 🚫 **Kill the malicious process** remotely via the endpoint agent
- 🔒 **Isolate the device** from the network to prevent lateral movement  
- 🛑 **Block malicious IPs** at the firewall level
- 📧 **Alert security operators** via the dashboard in real time
- 📝 **Log everything** in an immutable audit trail for compliance

#### Step 5: Privacy-First Storage

After analysis, only **anonymized metadata** is persisted:

```
Raw Content: "Dear user, click http://evil.com/steal-password..."
     ↓ (processed in-memory)
Stored: {
  "content_hash": "sha256:a1b2c3...",   ← one-way hash, content is gone
  "threat_type": "phishing",
  "risk_score": 0.94,
  "severity": "critical",
  "indicators": ["suspicious_url", "urgency_language"],
  "timestamp": "2026-02-22T10:30:00Z"
}
```

**The raw email/file/URL is never stored.** Only hashes and analysis results are kept.

---

## 🏆 What Makes CyberShield Different

### vs. Traditional Antivirus (Norton, McAfee, Windows Defender)

| Feature | Traditional AV | CyberShield AI |
|---------|---------------|----------------|
| **Detection Method** | Signature-based (compares files to known malware database) | Behavior-based (watches what programs *do*, not what they *are*) |
| **Zero-Day Protection** | ❌ Cannot detect unknown threats | ✅ Catches never-before-seen attacks by spotting abnormal behavior |
| **Privacy** | Uploads suspicious files to cloud for scanning | All analysis happens in-memory; raw data never leaves the device |
| **Customization** | One-size-fits-all rules | Learns YOUR organization's specific "normal" baseline |
| **Ransomware Detection** | Reacts after file encryption starts | Detects encryption patterns within seconds of first file |
| **Insider Threats** | ❌ No capability | ✅ Full user behavior analytics (after-hours access, bulk downloads) |
| **Compliance** | ❌ Separate tool needed | ✅ Built-in ISO 27001, GDPR, SOC 2, Indian IT Act compliance checks |
| **Cost** | $30-80/year per device | Free and open source |

### vs. Enterprise SIEM/EDR (CrowdStrike, SentinelOne, Splunk)

| Feature | Enterprise EDR | CyberShield AI |
|---------|---------------|----------------|
| **Price** | $15-50/endpoint/month ($180-600/year) | Free (MIT License) |
| **Deployment** | Requires sales calls, contracts, professional services | `git clone` + `npm install` + `pip install` — running in 5 minutes |
| **Target Audience** | Large enterprises with dedicated SOC teams | SMEs, startups, developers, students, security enthusiasts |
| **Data Sovereignty** | Your data processed on vendor's cloud | 100% self-hosted — your data never leaves your infrastructure |
| **Transparency** | Black-box, proprietary algorithms | Full source code — inspect, audit, and modify every detection rule |
| **Integration** | Vendor lock-in | Open API — integrate with anything |
| **Learning Curve** | Weeks of training required | Intuitive dashboard — usable by non-security engineers |

### Key Technical Differentiators

1. **🧠 Behavior-First AI** — CyberShield doesn't need a database of known malware signatures. The Isolation Forest model learns what "normal" looks like for YOUR specific environment and flags statistical outliers. This means it can detect completely novel attacks.

2. **🔐 Privacy by Architecture** — This isn't a feature bolted on top. The entire data pipeline is designed so raw content is processed ephemerally in memory. Only anonymized results (cryptographic hashes + metadata) are persisted. Even if the database is breached, no sensitive content can be recovered.

3. **📦 Full-Stack, Single Platform** — Most open-source security tools are single-purpose (just a scanner, just a SIEM, just a compliance checker). CyberShield combines endpoint protection, network IDS, phishing detection, insider threat monitoring, compliance automation, and risk scoring into one unified platform with a single dashboard.

4. **🇮🇳 India-Ready Compliance** — Built-in support for the **Indian IT Act (Section 43, 66, 72A)** alongside GDPR, ISO 27001, SOC 2, HIPAA, PCI DSS, and NIST. Most security tools only support Western frameworks.

5. **🎨 Developer-First Design** — Clean codebase, fully typed (TypeScript + Python type hints), comprehensive API documentation (Swagger), modular architecture, and modern UI built with Next.js 16 + React 19.

---

## 🎯 Use Cases

### For Small & Medium Enterprises (SMEs)

> *"We can't afford CrowdStrike, but we need real security."*

- Deploy the endpoint agent on all employee workstations
- Get an organization-wide risk score on the dashboard
- Automated compliance checks for ISO 27001 and GDPR
- One-click device isolation when a threat is detected
- Email/URL scanning for the entire team

### For Startups Handling Sensitive Data

> *"We process customer data and need to prove compliance."*

- Built-in GDPR, SOC 2, and Indian IT Act compliance automation
- Privacy-preserving architecture for handling PII
- Audit trail for every security action
- Exportable compliance reports for investors and auditors

### For Security Researchers & Students

> *"I want to understand how AI-based threat detection actually works."*

- Fully open source — read, modify, and experiment with every algorithm
- Well-documented codebase with clear separation of concerns
- Multiple ML techniques: Isolation Forest, Shannon entropy analysis, time-series beaconing detection, NLP-based phishing classification
- Easy to extend with custom detection modules

### For DevOps / SRE Teams

> *"I want to monitor our production servers for compromise."*

- Lightweight agent (< 50MB RAM footprint)
- Process monitoring with CPU/memory/network anomaly detection
- Network IDS detects C2 beaconing, port scanning, DNS tunneling, lateral movement
- API-first — integrate with PagerDuty, Slack, or any webhook

### For Incident Response Teams

> *"We need visibility and rapid containment during an active breach."*

- Real-time threat feed on the dashboard
- Remote process kill capabilities
- Network isolation of compromised devices
- Full audit trail with timestamps for forensic analysis
- Historical trend analysis to identify breach timeline

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                                   │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                Next.js 16 (React 19 + TypeScript)                  │  │
│  │  ┌───────────┐  ┌──────────────┐  ┌──────────────────────────┐    │  │
│  │  │ Floating   │  │  Dashboard   │  │   AI Module Pages        │    │  │
│  │  │ Dock Nav   │  │  AreaCharts  │  │  (9 Modules + 6 Tools)   │    │  │
│  │  │ (macOS)    │  │  Recharts    │  │                          │    │  │
│  │  └───────────┘  └──────────────┘  └──────────────────────────┘    │  │
│  │  ┌────────────────────────────────────────────────────────────┐    │  │
│  │  │        Component Library (Radix UI + Glassmorphism)         │    │  │
│  │  │  Button │ Card │ Input │ Dropdown │ Tabs │ Tooltip │ ...   │    │  │
│  │  └────────────────────────────────────────────────────────────┘    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│          │ API Routes (Proxy)                │ Supabase Auth (JWT)       │
└──────────┼───────────────────────────────────┼──────────────────────────┘
           │                                   │
           ▼                                   ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│    FastAPI Backend (Python)   │   │       Supabase Cloud          │
│                              │   │                                │
│  ┌────────────────────────┐  │   │  ┌────────────────────────┐   │
│  │ ThreatAnalyzer (NLP)   │  │   │  │   PostgreSQL + RLS     │   │
│  │ Pattern matching +     │  │   │  │   threat_analyses       │   │
│  │ keyword extraction     │  │   │  │   audit_logs            │   │
│  └────────────────────────┘  │   │  │   user_settings         │   │
│  ┌────────────────────────┐  │   │  └────────────────────────┘   │
│  │ AnomalyDetector (ML)   │  │   │  ┌────────────────────────┐   │
│  │ Isolation Forest       │  │   │  │  Auth (JWT + OAuth)     │   │
│  │ 7-dim feature vectors  │  │   │  │  Role-based access      │   │
│  │ Auto-retraining        │  │   │  └────────────────────────┘   │
│  └────────────────────────┘  │   └──────────────────────────────┘
│  ┌────────────────────────┐  │
│  │ 9 Security Modules:    │  │
│  │ • Network IDS          │  │   ┌──────────────────────────────┐
│  │ • Behavior Malware     │  │   │   Endpoint Agent (Python)     │
│  │ • Phishing Detector    │  │   │                                │
│  │ • Insider Threat       │  │   │  ┌────────────────────────┐   │
│  │ • Compliance Engine    │  │◄──│  │  Process Monitor       │   │
│  │ • Risk Scorer          │  │   │  │  psutil-based scanning  │   │
│  │ • Privacy Engine       │  │   │  └────────────────────────┘   │
│  │ • Autonomous Response  │  │   │  ┌────────────────────────┐   │
│  │ • Endpoint Protection  │  │   │  │  File Watcher          │   │
│  └────────────────────────┘  │   │  │  inotify/FSEvents      │   │
│  ┌────────────────────────┐  │   │  └────────────────────────┘   │
│  │ Endpoint SQLite DB     │  │   │  ┌────────────────────────┐   │
│  │ endpoint_devices       │  │   │  │  Network Monitor       │   │
│  │ endpoint_threats       │  │   │  │  Connection analysis    │   │
│  │ pending_commands       │  │   │  └────────────────────────┘   │
│  └────────────────────────┘  │   │  ┌────────────────────────┐   │
└──────────────────────────────┘   │  │  Auto-Response Engine   │   │
                                   │  │  Kill, isolate, block    │   │
                                   │  └────────────────────────┘   │
                                   └──────────────────────────────┘
```

### Data Flow

```
                          ┌──────────────────────────────┐
User Input ──────────────►│  Next.js API Route (Proxy)   │
(email, URL, message)     └──────────┬───────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────────────┐
                          │  FastAPI Backend              │
                          │  ┌────────────────────────┐  │
                          │  │ AI Analysis (In-Memory) │  │
                          │  │ • NLP threat classify   │  │
                          │  │ • Pattern extraction    │  │
                          │  │ • Confidence scoring    │  │
                          │  └────────┬───────────────┘  │
                          │           │                    │
                          │  ┌────────▼───────────────┐  │
                          │  │ Store Anonymized Result │  │
                          │  │ • SHA-256 content hash  │  │
                          │  │ • Threat metadata only  │  │
                          │  │ • NO raw content stored │  │
                          │  └────────┬───────────────┘  │
                          └───────────┼──────────────────┘
                                      │
                          ◄───────────┘
                   Response: { threat_type, risk_score,
                     severity, indicators, suggestions }
```

---

## 🧠 AI Modules Deep Dive

CyberShield features **9 specialized AI security modules**, each with its own detection engine, data model, and API surface.

### Module 1: Endpoint Protection Agent
**Files:** `agent/` + `backend/endpoint_routes.py` + `backend/ai_engine.py`

**What it detects:** Anomalous process behavior on individual devices

**How the AI works:**

| Phase | What Happens | Duration |
|-------|-------------|----------|
| **Collection** | Agent collects "normal" process behavior (CPU%, memory, connections, file handles) | Weeks 1-4 |
| **Feature Extraction** | Each process converted to a 7-dimensional numeric vector | Real-time |
| **Training** | `IsolationForest(n_estimators=200, contamination=0.05)` trained on normal data | After 200+ samples |
| **Detection** | New processes scored 0.0 (normal) → 1.0 (anomalous) | Real-time |
| **Heuristic Fallback** | Rule-based detection when ML model hasn't trained yet | Always active |

The **Isolation Forest** algorithm works by building random trees that attempt to "isolate" data points. Normal points require many splits to isolate (deep in the tree), while anomalies are isolated quickly (shallow). This makes it perfect for security because:
- No labeled training data needed (unsupervised learning)
- Naturally handles high-dimensional data
- Extremely fast inference (suitable for real-time detection)
- Low false positive rate with proper contamination tuning

### Module 2: Behavior-Based Malware Detection
**File:** `backend/behavior_malware.py`

**What it detects:** Ransomware, cryptominers, keyloggers, trojans/RATs, fileless attacks, persistence mechanisms

**Detection techniques:**

| Malware Type | Detection Method |
|-------------|-----------------|
| **Ransomware** | Rapid file encryption patterns (bulk `.locked`/`.encrypted` file creation + high I/O writes + CPU spike) |
| **Cryptominer** | Sustained high CPU (>85%) with no user interaction + connections to mining pool ports |
| **Keylogger** | Low CPU + high thread count + specific input hook DLLs + data exfiltration patterns |
| **Trojan/RAT** | Hidden process + outbound connection to unusual ports (4444, 5555, 31337) + beaconing behavior |
| **Script Attack** | Encoded PowerShell commands, hidden window execution, `IEX(New-Object Net.WebClient).DownloadString()` |
| **Persistence** | Registry Run/RunOnce modification, scheduled tasks, startup folder drops, WMI subscriptions |

### Module 3: Network Intrusion Detection System (NIDS)
**File:** `backend/network_ids.py`

**What it detects:** Network-level attacks, C2 communication, data exfiltration

**AI techniques used:**

| Technique | Purpose | Algorithm |
|-----------|---------|-----------|
| **Shannon Entropy Analysis** | Detect DNS tunneling (encrypted data hidden in DNS queries has high entropy >4.0) | `H = -Σ p(x) log₂ p(x)` |
| **Time-Series Beaconing** | Detect C2 communication (malware "phones home" at regular intervals) | Standard deviation of connection intervals < 5 seconds = beacon |
| **Domain Generation Algorithm (DGA) Detection** | Detect randomly generated domain names | Entropy + consonant ratio + length analysis |
| **Port Scan Detection** | Detect reconnaissance activity | Graph analysis: >20 unique destination ports from single source |
| **Volume Anomaly Detection** | Detect data exfiltration | Upload-to-download ratio analysis + statistical outlier detection |

### Module 4: Autonomous Response System
**File:** `backend/module_routes.py`

Automated threat containment with configurable policies:
- **Process Kill** — Terminate malicious processes remotely via agent
- **Device Isolation** — Remove device from network (disable non-local connections)
- **IP Blocking** — Add malicious IPs to firewall blocklist
- **Rollback Support** — Every action is reversible with audit trail

### Module 5: Privacy-Preserving AI
**File:** `backend/privacy_engine.py`

Ensures data processing follows privacy-first principles:
- **PII Scrubbing** — Regex-based detection and removal of emails, IPs, phone numbers, Aadhaar numbers, credit cards, API keys
- **Differential Privacy** — Laplacian noise injection (ε=1.0) on numeric fields before cloud sync
- **Data Anonymization** — One-way SHA-256 hashing of identifiers
- **Transparency Logging** — Complete log of what data was collected, where it was processed, and where it went

### Module 6: Dynamic Risk Scoring
**File:** `backend/risk_scorer.py`

A simple **0-100 risk score** designed for non-technical business owners:

| Risk Category | Weight | What's Measured |
|--------------|--------|-----------------|
| **Device Health** | 25% | CPU/memory/disk usage, uptime, patch status |
| **Threat Exposure** | 25% | Number and severity of active threats |
| **Network Security** | 20% | Open ports, firewall status, encryption |
| **User Behavior** | 15% | Login patterns, data access, privilege use |
| **Compliance** | 15% | Framework adherence scores |

Score interpretation: **0-30** = Critical (Red) • **31-50** = High (Orange) • **51-70** = Medium (Yellow) • **71-100** = Low (Green)

### Module 7: AI Phishing Detection
**File:** `backend/phishing_detector.py`

Multi-signal phishing detection:
- **URL Analysis** — Domain age, TLD reputation, path depth, IP-based URLs, URL shortener detection
- **Typosquatting Detection** — Levenshtein distance from known brands (google, microsoft, paypal, etc.)
- **Homoglyph Detection** — Cyrillic/Latin character substitution (а→a, е→e, о→o)
- **Email NLP Analysis** — Urgency keywords, generic greetings, suspicious sender patterns, embedded link analysis
- **Brand Impersonation** — Fuzzy matching against 15+ major brands

### Module 8: Insider Threat Detection
**File:** `backend/insider_threat.py`

User behavior analytics (UBA):
- **Baseline Profiling** — Learns each user's normal patterns (login hours, file access volume, data categories)
- **After-Hours Detection** — Flags file access outside working hours (configurable 8AM-8PM)
- **Bulk Access Detection** — Alerts when file downloads exceed 3x the user's daily average
- **Sensitive Data Monitoring** — Tracks access to financial, HR, legal, customer, and source code files
- **USB Exfiltration** — Detects large data transfers to removable media
- **Privilege Escalation** — Monitors for unauthorized elevation of access rights

### Module 9: Compliance Automation
**File:** `backend/compliance_engine.py`

Automated compliance checking against 4 frameworks:

| Framework | Controls Checked | Example Checks |
|-----------|-----------------|----------------|
| **ISO 27001** | 15+ Annex A controls (A.5 – A.18) | Security policies, access control, encryption, logging, vulnerability scanning |
| **GDPR** | Articles 5, 6, 12, 15, 17, 20, 25, 30, 32, 33 | Lawful processing, data portability, right to erasure, breach notification |
| **Indian IT Act** | Sections 43, 43A, 66, 72A | Unauthorized access prevention, sensitive data protection |
| **SOC 2** | CC6, CC7, CC8, CC9 Trust Criteria | Logical access, system ops, change management, risk mitigation |

Each check produces: `pass` / `fail` / `partial` / `not_applicable` — with evidence description and remediation guidance.

---

## ✨ Features at a Glance

### 🔐 Security Tools (Built-in)

| Tool | Description |
|------|-------------|
| **AI Threat Analysis** | Paste any email, URL, or message — get instant AI-powered threat classification |
| **URL Scanner** | Deep URL analysis with domain reputation, SSL check, and visual similarity detection |
| **SMS/Message Checker** | Detect social engineering and smishing attempts in text messages |
| **Password Strength** | Entropy analysis + breach database lookup (Have I Been Pwned compatible) |
| **Breach Checker** | Check if email addresses appear in known data breach databases |
| **Privacy Analyzer** | Analyze privacy policies and data collection practices of websites |
| **Security Score** | Organization-wide security posture assessment |

### 🤖 AI Chatbot

An integrated security assistant powered by **Google Gemini** that can answer cybersecurity questions, explain alerts, suggest remediation steps, and guide users through the platform.

### 🎨 Premium UI/UX

- **Glassmorphic Dark Theme** — Pure black background with backdrop-blur panels and warm orange/amber accents
- **Floating Dock Navigator** — macOS-style icon dock with hover magnification (1.0x → 1.4x), Radix UI portal tooltips, and scrollable overflow
- **Animated Sparklines** — Stat cards with animated bar charts that sweep in on mount
- **Area Charts** — Gradient-filled threat trend visualizations
- **Micro-Animations** — `fade-in-up` page transitions, hover glows, radar-sweep CSS effects
- **Cyber Background** — Dot-matrix pattern with ambient corner glows
- **Responsive** — Works across desktop, tablet, and mobile

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.1 | React meta-framework with App Router, SSR, and API route proxying |
| **React** | 19.2 | UI component library with Server Components |
| **TypeScript** | 5.x | End-to-end type safety |
| **Tailwind CSS** | 4.x | Utility-first CSS with custom glassmorphism utilities |
| **Radix UI** | Latest | Accessible, unstyled primitives (Tooltip, Dropdown, Accordion, etc.) |
| **Recharts** | 3.6 | Data visualization (AreaChart, BarChart, custom tooltips) |
| **TanStack Query** | 5.x | Server state management with smart caching |
| **Lucide React** | Latest | 500+ icons with tree-shaking |
| **Supabase SSR** | 0.8 | Server-side auth with HTTP-only cookies |
| **Zod** | 4.x | Runtime schema validation for environment variables |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **FastAPI** | 0.115 | Async Python API framework with auto-generated Swagger docs |
| **Uvicorn** | 0.30 | ASGI server for production deployment |
| **scikit-learn** | 1.5 | Isolation Forest anomaly detection model |
| **NumPy** | 1.26 | Feature vector computation for ML pipeline |
| **SQLAlchemy** | 2.0 | Async ORM for PostgreSQL + SQLite |
| **Pydantic** | 2.9 | Request/response validation and settings management |
| **HTTPX** | 0.27 | Async HTTP client |
| **SlowAPI** | 0.1 | Rate limiting middleware |
| **structlog** | 24.4 | Structured JSON logging |
| **python-jose** | 3.3 | JWT token handling |

### Endpoint Agent

| Technology | Purpose |
|-----------|---------|
| **psutil** | Cross-platform process and system monitoring |
| **watchdog** | Filesystem event monitoring (inotify on Linux, FSEvents on macOS) |
| **requests** | HTTP communication with FastAPI backend |
| **schedule** | Periodic heartbeat and scan scheduling |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| **Supabase** | PostgreSQL database, authentication, Row Level Security |
| **Docker + Compose** | Full-stack containerization |
| **Vercel** | Optional frontend deployment |
| **Google Gemini** | AI chatbot integration |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Supabase** account (free tier works)

### Quick Start (5 Minutes)

```bash
# 1. Clone the repository
git clone https://github.com/balaraj74/cybershield.git
cd cybershield

# 2. Frontend setup
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key

# 3. Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# 4. Start everything
# Terminal 1: Backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2: Frontend
cd .. && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you're ready!

### Deploy the Endpoint Agent

```bash
# On any device you want to protect:
cd agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure connection to your backend
cp .env.example .env
# Edit BACKEND_URL=http://your-server:8001

# Start the agent
python3 agent.py
```

The agent registers automatically, begins monitoring, and appears on your Endpoints dashboard.

### Docker Compose

```bash
docker-compose up --build -d
# Frontend: http://localhost:3000
# Backend:  http://localhost:8001
# API Docs: http://localhost:8001/docs
```

---

## 📁 Project Structure

```
cybershield/
│
├── 🐍 agent/                          # Endpoint Protection Agent
│   ├── agent.py                       # Main agent loop (register → monitor → report)
│   ├── monitor.py                     # Process scanner (psutil-based)
│   ├── file_watcher.py                # Filesystem event watcher (watchdog)
│   ├── network_monitor.py             # Network connection analyzer
│   ├── auto_response.py               # Remote command execution engine
│   ├── config.py                      # Agent configuration
│   ├── validate.py                    # End-to-end validation suite
│   └── requirements.txt
│
├── 🐍 backend/                        # FastAPI Backend
│   ├── main.py                        # App entry, API routes, lifespan
│   ├── config.py                      # Settings & environment
│   ├── models.py                      # SQLAlchemy ORM models
│   ├── schemas.py                     # Pydantic request/response schemas
│   ├── analyzer.py                    # NLP-based threat analyzer
│   ├── ai_engine.py                   # Isolation Forest anomaly detector
│   ├── module_routes.py               # All 9 module API routes
│   ├── endpoint_routes.py             # Endpoint agent API
│   ├── endpoint_models.py             # Endpoint SQLAlchemy models
│   ├── endpoint_schemas.py            # Endpoint Pydantic schemas
│   ├── behavior_malware.py            # Module 2: Behavior malware engine
│   ├── network_ids.py                 # Module 3: Network IDS engine
│   ├── privacy_engine.py              # Module 5: Privacy-preserving AI
│   ├── risk_scorer.py                 # Module 6: Risk score engine
│   ├── phishing_detector.py           # Module 7: Phishing detector
│   ├── insider_threat.py              # Module 8: Insider threat detector
│   ├── compliance_engine.py           # Module 9: Compliance automation
│   ├── models/                        # ML model persistence
│   │   ├── isolation_forest.pkl       # Trained anomaly model
│   │   └── training_data.json         # Collected training samples
│   └── requirements.txt
│
├── 🌐 src/                            # Next.js Frontend
│   ├── middleware.ts                   # Auth route protection
│   ├── app/                           # Pages (App Router)
│   │   ├── dashboard/page.tsx         # Main security dashboard
│   │   ├── endpoints/page.tsx         # Endpoint protection view
│   │   ├── analyze/page.tsx           # Threat analysis tool
│   │   ├── chatbot/page.tsx           # AI assistant
│   │   ├── modules/                   # 9 AI module pages
│   │   ├── url-check/page.tsx         # URL scanner
│   │   ├── sms-check/page.tsx         # SMS checker
│   │   ├── password-check/page.tsx    # Password analyzer
│   │   ├── breach-check/page.tsx      # Breach checker
│   │   ├── privacy-analyzer/page.tsx  # Privacy analyzer
│   │   └── security-score/page.tsx    # Security score
│   ├── components/
│   │   ├── layout/
│   │   │   ├── floating-dock.tsx      # macOS-style dock navigator
│   │   │   ├── main-layout.tsx        # Primary layout wrapper
│   │   │   └── header.tsx             # Top header bar
│   │   ├── charts/                    # Data visualization components
│   │   └── ui/                        # 15+ Radix-based components
│   └── lib/                           # Utilities, API client, auth
│
├── 📄 docker-compose.yml
├── 📄 Dockerfile
└── 📄 start-dev.sh
```

---

## 📊 API Reference

### Base URLs

```
Backend API:  http://localhost:8001
Frontend:     http://localhost:3000
Swagger Docs: http://localhost:8001/docs
```

### Core Endpoints

| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/health` | Health check with system status |
| `POST` | `/api/v1/analyze` | Analyze content for threats (privacy-first) |
| `GET` | `/api/v1/dashboard/stats` | Dashboard statistics + charts |
| `GET` | `/api/v1/dashboard/metrics` | KPI metrics (threats, alerts, last scan) |
| `GET` | `/api/v1/dashboard/trends` | Historical trend data (1-30 days) |
| `GET` | `/api/v1/history` | Paginated analysis history with filters |
| `GET` | `/api/v1/history/{id}` | Detailed analysis result |
| `POST` | `/api/v1/feedback` | Report false positives/negatives |

### Endpoint Agent API

| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/v1/endpoint/register` | Register new endpoint device |
| `POST` | `/api/v1/endpoint/report` | Submit agent behavior report + AI analysis |
| `GET` | `/api/v1/endpoint/commands/{device_id}` | Poll for pending commands |
| `POST` | `/api/v1/endpoint/commands/{device_id}/result` | Report command execution result |
| `GET` | `/api/v1/endpoint/dashboard` | Endpoint dashboard statistics |
| `GET` | `/api/v1/endpoint/devices` | List all registered devices |
| `POST` | `/api/v1/endpoint/kill-process` | Remote process termination |

### Security Module Endpoints

| Module | Prefix | Key Endpoints |
|--------|--------|--------------|
| Overview | `/api/v1/modules/overview` | All module statuses |
| Behavior Malware | `/api/v1/modules/behavior-malware` | `/stats`, `/alerts` |
| Network IDS | `/api/v1/modules/network-ids` | `/stats`, `/alerts` |
| Autonomous Response | `/api/v1/modules/autonomous-response` | `/stats`, `/isolate/{id}`, `/block-ip` |
| Privacy AI | `/api/v1/modules/privacy` | `/report`, `/transparency-log`, `/policy` |
| Risk Score | `/api/v1/modules/risk` | `/summary`, `/devices`, `/devices/{id}` |
| Phishing | `/api/v1/modules/phishing` | `/analyze-url`, `/analyze-email`, `/stats` |
| Insider Threat | `/api/v1/modules/insider-threat` | `/stats`, `/alerts`, `/profiles` |
| Compliance | `/api/v1/modules/compliance` | `/summary`, `/frameworks/{name}`, `/checks` |

---

## 🗄️ Database

### Supabase PostgreSQL (Primary)

| Table | Purpose | RLS |
|-------|---------|-----|
| `threat_analyses` | Anonymized analysis results (no raw content) | ✅ User-scoped |
| `user_feedback` | False positive/negative reports for AI improvement | ✅ User-scoped |
| `audit_logs` | Security action audit trail | ✅ User-scoped |
| `user_settings` | Per-user preferences | ✅ User-scoped |

### SQLite (Endpoint Data, Local)

| Table | Purpose |
|-------|---------|
| `endpoint_devices` | Registered endpoint agents (hostname, OS, status, last heartbeat) |
| `endpoint_threats` | Detected threats from endpoints |
| `endpoint_activities` | Process activity logs |
| `pending_commands` | Remote command queue (kill, isolate, scan) |

---

## ⚙️ Environment Variables

### Frontend (`.env.local`)

```bash
AUTH_SECRET="your-secret-key-at-least-32-characters"
AUTH_URL="http://localhost:3000"
FASTAPI_URL="http://localhost:8001"
FASTAPI_API_KEY="cybershield-api-key-2024"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_APP_NAME="CyberShield AI"
NEXT_PUBLIC_DEMO_MODE=false
```

### Backend (`backend/.env`)

```bash
APP_NAME="CyberShield AI"
DEBUG=true
DEMO_MODE=true
HOST=0.0.0.0
PORT=8001
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db
SECRET_KEY="your-secret-key"
API_KEY="cybershield-api-key-2024"
MODEL_CONFIDENCE_THRESHOLD=0.5
MAX_CONTENT_LENGTH=50000
RETENTION_DAYS=30
ANONYMIZE_DATA=true
```

### Endpoint Agent (`agent/.env`)

```bash
DEVICE_NAME="workstation-01"
BACKEND_URL="http://localhost:8001"
API_KEY="cybershield-api-key-2024"
SCAN_INTERVAL=30
HEARTBEAT_INTERVAL=60
ENABLE_FILE_WATCH=true
ENABLE_NETWORK_MONITOR=true
ENABLE_AUTO_RESPONSE=false
LOG_LEVEL=INFO
```

---

## 🐳 Deployment

### Docker Compose (Recommended)

```bash
docker-compose up --build -d
```

### Vercel (Frontend Only)

```bash
vercel --prod
# Set FASTAPI_URL to your hosted backend URL in Vercel dashboard
```

### Production Manual

```bash
# Frontend
npm run build && npm start

# Backend
cd backend
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4

# Agent (on each endpoint)
cd agent && python3 agent.py
```

---

## 🎨 Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0a0a0a` | Page background (pure black) |
| `--foreground` | `#e5e5e5` | Primary text |
| `--accent` | `#e85d04` | Primary accent (orange) |
| `--accent-light` | `#f48c06` | Hover states, chart strokes |
| `--accent-dark` | `#dc2f02` | Active states, danger accents |
| `--card-bg` | `#141414` | Card backgrounds |
| `--success` | `#22c55e` | Success indicators |
| `--danger` | `#ef4444` | Critical/error indicators |

### CSS Utilities

| Class | Effect |
|-------|--------|
| `.glass-panel` | Glassmorphism (blur + translucent bg + fine border) |
| `.bg-grid` | Subtle grid overlay pattern |
| `.bg-dots` | Dot matrix background |
| `.animate-fade-in-up` | Smooth 600ms upward fade entry |
| `.glow-orange` | Orange box-shadow glow |
| `.ambient-glow` | Top-center radial gradient |
| `.radar-sweep` | Rotating conic-gradient radar animation |
| `.shimmer` | Loading skeleton shimmer effect |
| `.scrollbar-hide` | Hidden scrollbar (cross-browser) |

---

## 🔐 Authentication Flow

```
1. User visits /login
2. Credentials sent to Supabase Auth
3. Supabase returns JWT access + refresh tokens
4. Tokens stored in HTTP-only cookies via Supabase SSR
5. Next.js middleware validates token on every request
6. Protected routes redirect to /login if unauthenticated
7. Role-based access: admin, analyst, viewer
```

---

## 🧪 Available Scripts

```bash
# Frontend
npm run dev              # Dev server (port 3000)
npm run build            # Production build
npm start                # Production server
npm run lint             # ESLint

# Backend
cd backend
uvicorn main:app --reload --port 8001     # Dev
uvicorn main:app --workers 4 --port 8001  # Production

# Agent
cd agent
python3 agent.py                  # Start monitoring
python3 validate.py               # Run validation suite
```

---

## 🗺️ Roadmap

- [ ] **Real-time WebSocket alerts** — Push threat notifications to dashboard instantly
- [ ] **YARA rule integration** — Custom signature-based detection alongside behavioral AI
- [ ] **Slack/Teams/Discord alerts** — Notification integrations
- [ ] **Multi-tenant support** — One deployment serving multiple organizations
- [ ] **Agent auto-updater** — OTA updates for endpoint agents
- [ ] **Threat intelligence feeds** — Integration with MISP, VirusTotal, AbuseIPDB
- [ ] **Dark web monitoring** — Automated dark web credential checking
- [ ] **Mobile app** — iOS/Android companion for on-the-go monitoring

---

## 📜 License

This project is licensed under the **MIT License** — free for personal and commercial use.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

- **API Documentation**: Swagger UI at `http://localhost:8001/docs`
- **Issues**: [GitHub Issues](https://github.com/balaraj74/cybershield/issues)
- **Security Vulnerabilities**: Report via private disclosure

---

## 👥 Contributors

- **Harshavardhan N** - Contributor (📧 vardhanh84857@gmail.coom)
- **Harsha** - Contributor
- **Shivaji** - Contributor
- **Balaraj** - Creator & Maintainer

---

<p align="center">
  Built with ❤️ for cybersecurity by <a href="https://github.com/balaraj74">Balaraj</a>
</p>
