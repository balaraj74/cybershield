---
description: How to test the CyberShield endpoint agent end-to-end on your local machine
---

# Testing the Endpoint Agent

## Prerequisites
- Python 3.9+ installed
- Node.js / npm for the frontend (already running)
- Backend and frontend running

## Step 1: Install agent dependencies
// turbo
```bash
cd /media/balaraj/New\ Volume/projects/cybershield/agent && pip install -r requirements.txt
```

## Step 2: Install backend AI dependencies
// turbo
```bash
cd /media/balaraj/New\ Volume/projects/cybershield/backend && pip install scikit-learn numpy
```

## Step 3: Start the FastAPI backend
```bash
cd /media/balaraj/New\ Volume/projects/cybershield/backend && python main.py
```

## Step 4: Run the agent in test mode
```bash
cd /media/balaraj/New\ Volume/projects/cybershield/agent && python agent.py --test
```

## Step 5: Run the agent in monitor mode
```bash
cd /media/balaraj/New\ Volume/projects/cybershield/agent && python agent.py
```

## Step 6: Run attack simulation
```bash
cd /media/balaraj/New\ Volume/projects/cybershield/agent && python agent.py --simulate
```

## Step 7: Check the dashboard
Open http://localhost:3000/endpoints in your browser to see live data from your agent.
