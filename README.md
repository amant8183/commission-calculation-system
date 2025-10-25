# Commission Calculation System


> A full-stack web application for automating insurance commission calculations, volume-based bonuses, and policy clawback processing.

[![Python](https://img.shields.io/badge/Python-3.14-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1-green.svg)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-39%20Passed-success.svg)]()

🌐 **[Live Demo](https://commission-calculation-system-ashen.vercel.app/)** | 📖 [Documentation](#documentation)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Setup Instructions](#setup-instructions)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [User Guide](#user-guide)
- [Technical Architecture](#technical-architecture)

---

## 📄 License

This project is created as a technical assessment.

## 👤 Author

**Aman Tiwari**  
📧 Email: amant8183@gmail.com  
📱 Contact: +91 8435083399

---

## 🎯 Overview

The Commission Calculation System automates insurance commission calculations for hierarchical sales organizations, solving the problem of manual Excel-based processing that takes days and is error-prone.

### Key Features
- **4-level agent hierarchy** with automatic override cascades
- **Instant commission calculations** (50% FYC + 2%, 1.5%, 1% overrides)
- **Volume-based bonuses** (Monthly, Quarterly, Annual with tiered rates)
- **Automated clawback processing** with bonus recalculation
- **Real-time analytics dashboard** with charts and reports

### Technology Stack
- **Backend**: Flask 3.1, SQLAlchemy, SQLite
- **Frontend**: React 19.2, TypeScript 4.9, Tailwind CSS 3.4
- **Testing**: pytest (39 passing tests)

---

## 🚀 Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### Backend Setup

```bash
# 1. Clone and navigate to backend
cd backend

# 2. Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run server (database auto-initializes)
python app.py
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
# 1. Navigate to frontend
cd commission-frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm start
```

Frontend opens at `http://localhost:3000`

### Verify Installation
Open `http://localhost:3000` - you should see the dashboard.

---

## 🗄️ Database Schema

### Core Tables

#### Agent
Hierarchical structure for sales organization.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| name | String(100) | Agent name |
| level | Integer | 1=Agent, 2=Team Lead, 3=Manager, 4=Director |
| parent_id | Integer | FK to parent agent (null for top-level) |

#### Sale
Policy transactions with cancellation tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| policy_number | String(50) | Unique policy identifier |
| policy_value | Float | Policy value in USD |
| sale_date | DateTime | When policy was sold |
| agent_id | Integer | FK to selling agent |
| is_cancelled | Boolean | Cancellation status |

#### Commission
FYC and override commission payments.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| amount | Float | Commission amount |
| commission_type | String | 'FYC' or 'Override' |
| sale_id | Integer | FK to sale |
| agent_id | Integer | FK to receiving agent |

#### Bonus
Volume-based bonus calculations.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| amount | Float | Bonus amount |
| bonus_type | String | 'Monthly', 'Quarterly', 'Annual' |
| period | String | e.g., '2024-01', '2024-Q1', '2024' |
| agent_id | Integer | FK to agent |

#### Additional Tables
- **Clawback**: Commission/bonus adjustments from cancellations
- **HierarchySnapshot**: Preserves hierarchy at time of sale for accurate clawbacks
- **PerformanceTier**: Volume thresholds and bonus rates by agent level

### Performance Tiers

| Level | Tier | Volume Range | Bonus Rate |
|-------|------|--------------|------------|
| 1 (Agent) | Silver | $25K-$50K | 2% |
| 1 (Agent) | Gold | $50K-$100K | 3% |
| 1 (Agent) | Platinum | $100K+ | 5% |
| 2 (Team Lead) | Silver | $100K-$250K | 3% |
| 2 (Team Lead) | Gold | $250K-$500K | 5% |
| 2 (Team Lead) | Platinum | $500K+ | 7% |
| 3 (Manager) | Silver | $500K-$1M | 4% |
| 3 (Manager) | Gold | $1M-$2M | 6% |
| 3 (Manager) | Platinum | $2M+ | 8% |
| 4 (Director) | Silver | $1M-$3M | 5% |
| 4 (Director) | Gold | $3M-$5M | 7% |
| 4 (Director) | Platinum | $5M+ | 10% |

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Agent Endpoints

#### Create Agent
```http
POST /api/agents
Content-Type: application/json

{
  "name": "John Doe",
  "level": 1,
  "parent_id": 5
}
```

#### Get All Agents
```http
GET /api/agents
```
Returns hierarchical tree structure.

#### Get Agents by Level
```http
GET /api/agents?level=1
```

#### Update Agent
```http
PUT /api/agents/{id}
Content-Type: application/json

{
  "name": "Jane Doe",
  "level": 2,
  "parent_id": 3
}
```

#### Delete Agent
```http
DELETE /api/agents/{id}
```

### Sales Endpoints

#### Record Sale
```http
POST /api/sales
Content-Type: application/json

{
  "policy_number": "LIFE-2024-001",
  "policy_value": 500000,
  "agent_id": 4
}
```
Auto-calculates FYC, overrides, and creates hierarchy snapshot.

#### Get All Sales
```http
GET /api/sales
```

#### Cancel Sale (Trigger Clawback)
```http
PUT /api/sales/{id}/cancel
```
Marks sale cancelled and initiates clawback processing.

### Bonus Endpoints

#### Calculate Bonuses
```http
POST /api/bonuses/calculate
Content-Type: application/json

{
  "period": "2024-10",
  "type": "Monthly"
}
```
Types: `Monthly`, `Quarterly`, `Annual`  
Period formats: `YYYY-MM`, `YYYY-Q1`, `YYYY`

#### Get All Bonuses
```http
GET /api/bonuses
```

### Dashboard Endpoint

#### Get Summary
```http
GET /api/dashboard/summary
```
Returns aggregated statistics:
```json
{
  "total_sales_value": 1500000.00,
  "total_commissions_paid": 750000.00,
  "total_bonuses_paid": 125000.00,
  "total_clawbacks_value": -50000.00,
  "agent_count": 12
}
```

---

## 📖 User Guide

### 1. Agent Management

**Create Hierarchy (Start from Top)**
1. First, create a Director (Level 4) - no parent needed
2. Then create Managers (Level 3) under the Director
3. Create Team Leads (Level 2) under Managers
4. Finally, create Agents (Level 1) under Team Leads

**View Hierarchy**  
Navigate to "Agent Management" to see color-coded tree:
- 🔵 Blue = Agents (Level 1)
- 🟢 Green = Team Leads (Level 2)
- 🟡 Amber = Managers (Level 3)
- 🟣 Purple = Directors (Level 4)

### 2. Record Sales

1. Go to "Sales Management"
2. Enter policy number (must be unique)
3. Enter policy value
4. Select selling agent (Level 1 only)
5. Click "Record Sale"

**What Happens:**
- FYC commission created (50% of value)
- Override commissions calculated for upline
- Hierarchy snapshot saved for future clawbacks

### 3. Calculate Bonuses

**Monthly Bonuses:**
1. Click "Calculate Current Month" button
2. System calculates volume for each agent:
   - Level 1: Personal sales only
   - Levels 2-4: Entire team's sales
3. Bonuses created based on tier thresholds

**Quarterly/Annual:** Similar process with respective buttons.

### 4. Clawback Management

1. Go to "Clawback Management"
2. Search for policy by number or agent name
3. Select policy to view impact analysis:
   - Direct FYC clawback amount
   - Total estimated impact
   - List of affected agents
4. Click "Cancel Policy & Initiate Clawback"
5. Confirm in modal

**What Happens:**
- Sale marked as cancelled
- All related commissions clawed back
- All affected bonuses recalculated
- Clawback records created for audit trail

### 5. View Reports

**Dashboard:**
- Real-time statistics cards
- 6-month sales chart
- Quick stats overview

**Commission Reports:**
- View all commissions and bonuses
- Filter by agent or type
- Export to CSV for analysis

---

## 🏗️ Technical Architecture

### System Design

```
┌─────────────────────────────────────────┐
│         Frontend (React/TypeScript)     │
│  ┌───────────┐  ┌────────────────────┐ │
│  │ Dashboard │  │ Agent Management   │ │
│  │ SalesChart│  │ Sales Management   │ │
│  │ Reports   │  │ Clawback Mgmt      │ │
│  └───────────┘  └────────────────────┘ │
└─────────────────┬───────────────────────┘
                  │ HTTP/JSON (Axios)
                  ▼
┌─────────────────────────────────────────┐
│         Backend (Flask API)             │
│  ┌─────────────────────────────────┐   │
│  │   RESTful API Endpoints         │   │
│  │   /agents /sales /bonuses       │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   Business Logic                │   │
│  │   • Commission calculation      │   │
│  │   • Bonus calculation           │   │
│  │   • Clawback processing         │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   SQLAlchemy ORM                │   │
│  └─────────────────────────────────┘   │
└─────────────────┬───────────────────────┘
                  ▼
          ┌──────────────┐
          │ SQLite DB    │
          │ 7 Tables     │
          └──────────────┘
```

### Key Design Decisions

**HierarchySnapshot Table**  
Solves: How to handle clawbacks when agents change teams?  
Solution: Store complete hierarchy at time of sale, enabling accurate clawback calculations regardless of later organizational changes.

**Volume Calculation Rules**
- Level 1 (Agents): Personal sales only - fair reward for individual effort
- Levels 2-4 (Managers): Entire downline - incentivizes team building and mentorship

**Clawback Strategy**
- Uses hierarchy snapshots to find all affected agents
- Recalculates bonuses with sale excluded
- Creates adjustment records (not cash refunds)
- Processes in < 1 second via efficient SQL queries

**Database Choice (SQLite)**
- Zero configuration for development
- File-based for easy deployment
- Adequate for up to ~1,000 agents and ~10,000 sales
- Easy migration path to PostgreSQL if needed

### Testing Strategy
- 39 passing backend tests using pytest
- Coverage includes:
  - Agent CRUD operations
  - Commission calculations
  - Bonus calculations (all 3 types)
  - Clawback processing
  - Input validation (29 edge cases)

**Run tests:**
```bash
cd backend
pytest -v
```

---

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
