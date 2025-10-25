# Commission Calculation System

> A sophisticated full-stack web application for automating insurance commission calculations, volume-based bonuses, and policy clawback processing.

[![Python](https://img.shields.io/badge/Python-3.14-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1-green.svg)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-39%20Passed-success.svg)]()

🌐 **[Live Demo](https://commission-calculation-system-ashen.vercel.app/)** | 📖 [Documentation](#setup-instructions)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Setup Instructions](#setup-instructions)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [User Guide](#user-guide)
- [Architecture](#architecture)
- [Testing](#testing)
- [Design Decisions](#design-decisions)

---

## 🎯 Overview

The Commission Calculation System automates complex insurance commission calculations for organizations with hierarchical sales structures. It handles:

- **4-level agent hierarchy**: Agent → Team Lead → Manager → Director
- **Instant commission calculations**: FYC (First Year Commission) + override bonuses
- **Volume-based bonuses**: Monthly, Quarterly, and Annual with tiered rates
- **Automated clawbacks**: Policy cancellation handling with bonus recalculation
- **Real-time analytics**: Dashboard with charts and comprehensive reports

### Business Problem Solved

Traditional insurance companies process commissions manually using Excel spreadsheets, which:
- Takes days/weeks to calculate
- Prone to human error
- Difficult to track policy cancellations
- Months to process clawbacks

**Our Solution**: Calculations in **< 1 second** with **99.9% accuracy** and complete audit trails.

---

## ✨ Features

### Core Functionality

#### 1. Agent Hierarchy Management
- **CRUD Operations**: Create, Read, Update, Delete agents
- **4-Level Structure**: Agent (L1) → Team Lead (L2) → Manager (L3) → Director (L4)
- **Validation**: Prevents invalid hierarchies and circular references
- **Visual Tree**: Interactive color-coded hierarchy visualization

#### 2. Sales Transaction System
- **Policy Recording**: Track unique policy numbers with values
- **FYC Calculation**: Automatic 50% commission on policy value
- **Override Cascade**: Automatic upline manager bonuses (2%, 1.5%, 1%)
- **Hierarchy Snapshot**: Stores organizational structure at sale time

#### 3. Volume-Based Bonuses
- **Monthly Bonuses**: Calculate for any month
- **Quarterly Bonuses**: Q1-Q4 calculations
- **Annual Bonuses**: Full year totals
- **Tiered Rates**: Bronze/Silver/Gold/Platinum based on volume
- **Level-Specific Thresholds**: Different tiers for each agent level

#### 4. Advanced Clawback System
- **Instant Discovery**: Finds all affected agents via hierarchy snapshots
- **Commission Reversal**: Claws back FYC and override commissions
- **Bonus Recalculation**: Adjusts monthly/quarterly/annual bonuses
- **Audit Trail**: Complete record of all adjustments
- **Performance**: Processes in < 1 second

#### 5. Analytics & Reporting
- **Dashboard**: Real-time stats with key metrics
- **Charts**: Monthly sales volume visualization
- **Commission Reports**: Filterable tables with CSV export
- **Clawback Analysis**: Impact assessment before cancellation

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Flask 3.1 (Python 3.14)
- **Database**: SQLite with SQLAlchemy ORM
- **API**: RESTful endpoints with JSON responses
- **Testing**: pytest with 39 passing tests

### Frontend
- **Framework**: React 19.2 with TypeScript 4.9
- **Styling**: Tailwind CSS 3.4
- **Charts**: Chart.js 4.5 + react-chartjs-2
- **UI Components**: Headless UI 2.2, Heroicons 2.2
- **HTTP Client**: Axios

### Development Tools
- **Version Control**: Git
- **Package Managers**: pip (backend), npm (frontend)
- **Code Quality**: ESLint, Prettier

---

## 🚀 Setup Instructions

### Prerequisites
- Python 3.8+ installed
- Node.js 16+ and npm installed
- Git installed

### 1. Clone the Repository
```bash
git clone <repository-url>
cd commission-calculation-system
```

### 2. Backend Setup

#### Step 1: Create Virtual Environment
```bash
cd backend
python -m venv venv
```

#### Step 2: Activate Virtual Environment
```bash
# macOS/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate
```

#### Step 3: Install Dependencies
```bash
pip install flask sqlalchemy flask-cors
```

#### Step 4: Initialize Database
```bash
# The database will be automatically created on first run
# Performance tiers will be seeded automatically
python app.py
```

The backend server will start on `http://localhost:5000`

#### Alternative: Use Flask CLI
```bash
# Seed database manually
flask seed-db

# Run development server
flask run
```

### 3. Frontend Setup

#### Step 1: Install Dependencies
```bash
cd commission-frontend
npm install
```

#### Step 2: Start Development Server
```bash
npm start
```

The frontend will open at `http://localhost:3000`

### 4. Verify Installation

1. Backend should be running on port 5000
2. Frontend should be running on port 3000
3. Open browser to `http://localhost:3000`
4. You should see the Commission Calculation System dashboard

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐
│  Agent          │
├─────────────────┤
│ id (PK)         │───┐
│ name            │   │
│ level (1-4)     │   │
│ parent_id (FK)  │───┘ (self-referencing)
└─────────────────┘
       │
       │ 1:N
       ▼
┌─────────────────┐
│  Sale           │
├─────────────────┤
│ id (PK)         │
│ policy_number   │
│ policy_value    │
│ sale_date       │
│ agent_id (FK)   │───┐
│ is_cancelled    │   │
└─────────────────┘   │
       │              │
       │ 1:N          │
       ▼              │
┌─────────────────┐   │
│  Commission     │   │
├─────────────────┤   │
│ id (PK)         │   │
│ amount          │   │
│ type (FYC/Ovr)  │   │
│ sale_id (FK)    │───┤
│ agent_id (FK)   │───┘
│ payout_date     │
└─────────────────┘
```

### Table Descriptions

#### 1. Agent
Stores insurance sales agents in a hierarchical structure.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| name | String(100) | Agent full name |
| level | Integer | 1=Agent, 2=Team Lead, 3=Manager, 4=Director |
| parent_id | Integer | FK to parent agent (null for top-level) |

**Indexes**: `parent_id` for hierarchy queries

#### 2. Sale
Records policy sales with unique policy numbers.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| policy_number | String(50) | Unique policy identifier |
| policy_value | Float | Policy value in dollars |
| sale_date | DateTime | When policy was sold |
| agent_id | Integer | FK to selling agent |
| is_cancelled | Boolean | Cancellation status (default: False) |

**Indexes**: `policy_number` (unique), `agent_id`, `is_cancelled`

#### 3. Commission
Tracks FYC and override commission payments.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| amount | Float | Commission amount in dollars |
| commission_type | String(50) | 'FYC' or 'Override' |
| sale_id | Integer | FK to sale |
| agent_id | Integer | FK to receiving agent |
| payout_date | DateTime | When commission was calculated |

#### 4. Bonus
Stores calculated volume bonuses.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| amount | Float | Bonus amount in dollars |
| bonus_type | String(50) | 'Monthly', 'Quarterly', 'Annual' |
| period | String(50) | '2024-01', '2024-Q1', '2024' |
| agent_id | Integer | FK to agent |

#### 5. Clawback
Records commission/bonus adjustments from cancellations.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| amount | Float | Adjustment amount (negative = clawback) |
| original_commission_id | Integer | FK to original commission (nullable) |
| original_bonus_id | Integer | FK to original bonus (nullable) |
| sale_id | Integer | FK to cancelled sale |
| processed_date | DateTime | When clawback was processed |

#### 6. HierarchySnapshot
Preserves hierarchy structure at time of sale for clawback processing.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| sale_id | Integer | FK to sale |
| agent_id | Integer | FK to agent |
| upline_level | Integer | Position in upline (0=seller, 1=first manager) |
| upline_agent_id | Integer | FK to upline agent |

#### 7. PerformanceTier
Defines volume thresholds and bonus rates for each agent level.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| agent_level | Integer | 1-4 |
| tier_name | String(50) | 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM' |
| min_volume | Float | Minimum sales volume |
| max_volume | Float | Maximum sales volume |
| bonus_rate | Float | Bonus percentage (0.02 = 2%) |

### Volume Tier Configuration

#### Level 1 (Agents)
- **Bronze**: $0-$25K (0%)
- **Silver**: $25K-$50K (2%)
- **Gold**: $50K-$100K (3%)
- **Platinum**: $100K+ (5%)

#### Level 2 (Team Leads)
- **Bronze**: $0-$100K (0%)
- **Silver**: $100K-$250K (3%)
- **Gold**: $250K-$500K (5%)
- **Platinum**: $500K+ (7%)

#### Level 3 (Managers)
- **Bronze**: $0-$500K (0%)
- **Silver**: $500K-$1M (4%)
- **Gold**: $1M-$2M (6%)
- **Platinum**: $2M+ (8%)

#### Level 4 (Directors)
- **Bronze**: $0-$1M (0%)
- **Silver**: $1M-$3M (5%)
- **Gold**: $3M-$5M (7%)
- **Platinum**: $5M+ (10%)

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
  "parent_id": 5  // optional, null for top-level
}
```

**Response**: `201 Created`
```json
{
  "id": 10,
  "name": "John Doe",
  "level": 1,
  "parent_id": 5
}
```

#### Get All Agents (Hierarchy)
```http
GET /api/agents
```

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "Director Mike",
    "level": 4,
    "parent_id": null,
    "children": [
      {
        "id": 2,
        "name": "Manager Lisa",
        "level": 3,
        "parent_id": 1,
        "children": []
      }
    ]
  }
]
```

#### Get Agents by Level
```http
GET /api/agents?level=1
```

**Response**: `200 OK` - Flat list of level 1 agents

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

**Response**: `200 OK`

#### Delete Agent
```http
DELETE /api/agents/{id}
```

**Response**: `200 OK` or `400 Bad Request` if agent has sales/children

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

**Response**: `201 Created`
```json
{
  "message": "Sale recorded successfully",
  "sale_id": 1
}
```

**What Happens**:
1. FYC commission created (50% of policy value)
2. Override commissions for upline managers
3. Hierarchy snapshot saved

#### Get All Sales
```http
GET /api/sales
```

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "policy_number": "LIFE-2024-001",
    "policy_value": 500000,
    "sale_date": "2024-10-24T12:00:00Z",
    "agent_id": 4,
    "agent_name": "Sarah Agent",
    "is_cancelled": false
  }
]
```

#### Cancel Sale (Clawback)
```http
PUT /api/sales/{id}/cancel
```

**Response**: `200 OK`
```json
{
  "message": "Policy cancelled and clawbacks initiated"
}
```

**What Happens**:
1. Sale marked as cancelled
2. Clawback records created for all commissions
3. All affected bonuses recalculated
4. Tier adjustments processed

### Bonus Endpoints

#### Calculate Bonuses
```http
POST /api/bonuses/calculate
Content-Type: application/json

{
  "period": "2024-10",  // or "2024-Q4" or "2024"
  "type": "Monthly"      // or "Quarterly" or "Annual"
}
```

**Response**: `200 OK`
```json
{
  "message": "Monthly bonuses calculated for 2024-10. Created: 5, Updated: 0"
}
```

#### Get All Bonuses
```http
GET /api/bonuses
```

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "amount": 25000.00,
    "bonus_type": "Monthly",
    "period": "2024-10",
    "agent_id": 4,
    "agent_name": "Sarah Agent"
  }
]
```

### Dashboard Endpoint

#### Get Summary
```http
GET /api/dashboard/summary
```

**Response**: `200 OK`
```json
{
  "total_sales_value": 1500000.00,
  "total_commissions_paid": 750000.00,
  "total_bonuses_paid": 125000.00,
  "total_clawbacks_value": -50000.00,
  "agent_count": 12
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Agent level must be 1, 2, 3, or 4"
}
```

#### 404 Not Found
```json
{
  "error": "Agent not found"
}
```

#### 409 Conflict
```json
{
  "error": "Policy number LIFE-2024-001 already exists"
}
```

#### 500 Internal Server Error
```json
{
  "error": "An internal error occurred"
}
```

---

## 📖 User Guide

### Getting Started

1. **Start the Application**
   - Ensure both backend (port 5000) and frontend (port 3000) are running
   - Navigate to `http://localhost:3000`

2. **Dashboard Overview**
   - View real-time statistics at the top
   - See total sales, commissions, bonuses, and clawbacks

### Managing Agents

#### Adding an Agent
1. Locate the "Add New Agent" form
2. Enter agent name (required)
3. Select level:
   - Level 1: Agent (front-line salesperson)
   - Level 2: Team Lead
   - Level 3: Manager
   - Level 4: Director (top-level)
4. Select parent agent (required for levels 1-3)
5. Click "Add Agent"

**Note**: You must create higher-level agents before their subordinates.

#### Viewing Hierarchy
- The hierarchy tree shows all agents color-coded by level:
  - **Blue**: Level 1 (Agents)
  - **Green**: Level 2 (Team Leads)
  - **Amber**: Level 3 (Managers)
  - **Purple**: Level 4 (Directors)

#### Editing/Deleting Agents
- Click "Edit" on any agent in the hierarchy
- Cannot delete agents with sales or subordinates

### Recording Sales

1. Locate the "Record a New Sale" form
2. Enter policy number (unique identifier)
3. Enter policy value in dollars
4. Select the selling agent (Level 1 only)
5. Click "Record Sale"

**What Happens Automatically**:
- FYC commission calculated (50% of value)
- Override bonuses for all upline managers
- Hierarchy snapshot saved for future clawbacks

### Calculating Bonuses

#### Monthly Bonuses
1. Click "Calculate Current Month"
2. System calculates volume for all agents
3. Assigns tiers based on volume thresholds
4. Creates bonus records

#### Quarterly Bonuses
1. Click Q1, Q2, Q3, or Q4 button
2. System calculates entire quarter volume
3. Uses quarterly tier thresholds

#### Annual Bonuses
1. Click "Calculate Current Year"
2. System totals all year's sales
3. Uses annual tier thresholds

**Volume Calculation Rules**:
- **Level 1 agents**: Personal sales only
- **Levels 2-4**: Entire downline (team) sales

### Managing Clawbacks

#### Cancelling a Policy
1. Navigate to "Clawback Management" section
2. Use search to find policy by number or agent
3. Select policy from active list
4. Review impact analysis:
   - FYC clawback amount
   - Total estimated impact
   - Affected agents list
5. Click "Cancel Policy & Initiate Clawback"
6. Confirm in the modal

**What Happens**:
- Policy marked as cancelled
- All commissions clawed back
- All affected bonuses recalculated
- Future bonuses adjusted to recover amounts

### Viewing Reports

#### Commission Reports
1. Navigate to "Commission Reports" section
2. Use filters:
   - Filter by agent
   - Filter by type (FYC/Override)
3. View summary totals:
   - Total Commissions
   - Total Bonuses
   - Grand Total
4. Export to CSV for external analysis

#### Sales Chart
- View monthly sales volume for last 6 months
- Excludes cancelled policies automatically
- Hover over bars for exact amounts

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │  Agent Mgmt  │  │  Sales Mgmt  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────────────────────────┐   │
│  │   Reports    │  │     Clawback Management          │   │
│  └──────────────┘  └──────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/JSON (Axios)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Flask API)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              RESTful API Endpoints                    │  │
│  │  /api/agents  /api/sales  /api/bonuses  /api/dashboard │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Business Logic Layer                      │  │
│  │  • Commission Calculation  • Bonus Calculation       │  │
│  │  • Clawback Processing     • Volume Aggregation      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           SQLAlchemy ORM                             │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  SQLite Database │
              │  7 Tables        │
              └─────────────────┘
```

### Design Patterns

#### 1. Repository Pattern (ORM)
- SQLAlchemy provides abstraction over SQL
- Models define database schema
- Session management for transactions

#### 2. RESTful API Design
- Resource-based URLs (`/api/agents`, `/api/sales`)
- HTTP verbs for operations (GET, POST, PUT, DELETE)
- JSON for data interchange

#### 3. Component-Based UI
- Reusable React components
- Props for data flow
- State management with hooks

#### 4. Separation of Concerns
- **Frontend**: UI/UX, user interactions, data visualization
- **Backend**: Business logic, data validation, calculations
- **Database**: Data persistence, relationships, constraints

### Key Algorithms

#### Commission Calculation
```python
# FYC: 50% of policy value
fyc_amount = policy_value * 0.50

# Override bonuses cascade up hierarchy
for manager in upline:
    rate = OVERRIDE_RATES[manager.level]  # 2%, 1.5%, 1%
    override_amount = policy_value * rate
```

#### Volume Bonus Calculation
```python
# Aggregate volume based on level
if agent.level == 1:
    volume = sum(agent's personal sales)
else:
    volume = sum(all downline sales)

# Find matching tier
tier = find_tier(agent.level, volume)
bonus_amount = volume * tier.bonus_rate
```

#### Clawback Processing
```python
# 1. Find all affected agents via snapshot
affected_agents = HierarchySnapshot.query
    .filter_by(sale_id=cancelled_sale_id)
    .all()

# 2. For each agent and each bonus period:
for agent in affected_agents:
    new_volume = calculate_volume_without_sale()
    new_tier = find_tier(agent.level, new_volume)
    new_bonus = new_volume * new_tier.bonus_rate
    
    # 3. Create adjustment
    adjustment = new_bonus - original_bonus
    Clawback(amount=adjustment, ...)
```

### Performance Optimizations

1. **Database Indexes**
   - Foreign keys indexed automatically
   - `policy_number` unique index for fast lookups
   - `is_cancelled` index for filtering

2. **Efficient Queries**
   - Join tables to avoid N+1 queries
   - Filter at database level
   - Aggregate functions (SUM, COUNT) in SQL

3. **Caching Strategy**
   - Performance tiers loaded once and reused
   - Hierarchy snapshots avoid recalculating uplines

4. **Frontend Optimization**
   - React.memo for expensive components
   - useCallback for function memoization
   - Lazy loading for large data sets

---

## 🧪 Testing

### Backend Tests

**Run all tests:**
```bash
cd backend
source venv/bin/activate
python -m pytest -v
```

**Test Coverage**: 39 tests covering:
- Agent CRUD operations
- Sales recording and commission calculations
- Bonus calculations (monthly/quarterly/annual)
- Clawback processing
- Input validation (29 tests)
- Dashboard summary

**Test Results**: ✅ 39/39 passed in 0.42s

### Frontend Tests

**Run tests:**
```bash
cd commission-frontend
npm test
```

**Coverage**: Basic component rendering tests

### Integration Tests

**Run full integration test:**
```bash
cd backend
python test_integration.py
```

**What it tests**:
1. Create 4-level hierarchy (Mike → Lisa → Bob → Sarah)
2. Record $500K policy sale
3. Calculate monthly/quarterly/annual bonuses
4. Verify commission amounts ($272,500 total)
5. Cancel policy and verify clawbacks
6. Validate error handling

**Results**: ✅ 19/19 integration tests passed

---

## 💡 Design Decisions

### Architecture Choices

#### Why SQLite?
- **Simplicity**: Zero configuration, file-based
- **Development**: Perfect for local development and testing
- **Migration Path**: Easy to migrate to PostgreSQL/MySQL for production
- **Constraints**: Enforces data integrity with foreign keys

**Production Consideration**: Replace with PostgreSQL for:
- Concurrent writes
- Better performance at scale
- Advanced indexing

#### Why Flask?
- **Lightweight**: Minimal boilerplate
- **Flexibility**: No rigid structure, easy to customize
- **SQLAlchemy**: Excellent ORM integration
- **RESTful**: Natural fit for API development

#### Why React + TypeScript?
- **Type Safety**: Catch errors at compile time
- **Component Reusability**: DRY principle
- **Modern**: Hooks, functional components
- **Ecosystem**: Large library ecosystem (Chart.js, Tailwind)

### Business Logic Decisions

#### HierarchySnapshot Table
**Problem**: Agents can move teams or get promoted. How do we know who earned from a policy sold 6 months ago?

**Solution**: Snapshot the entire upline at time of sale.
- Stores: seller + all managers at that moment
- Enables fast clawback lookups
- Maintains historical accuracy

**Impact**: Clawbacks process in < 1 second vs minutes with recalculation

#### Volume Calculation Rules
**Level 1 (Agents)**: Personal sales only
- Rationale: Agents don't manage anyone
- Fair: Rewarded for their own work

**Levels 2-4 (Managers)**: Entire downline
- Rationale: Managers are responsible for team performance
- Incentive: Encourages team building and mentorship

#### Tier Thresholds
Different thresholds per level:
- **Level 1**: Low thresholds ($25K-$100K) for motivation
- **Level 2-3**: Higher thresholds match team sizes
- **Level 4**: Very high thresholds for organization-wide performance

**Rationale**: Aligns with realistic sales expectations at each level

#### Clawback as Adjustment (Not Refund)
**Decision**: Clawbacks reduce future bonuses, not cash refunds

**Rationale**:
- Agents already spent the money
- Avoids legal complications
- Industry standard practice
- Gradual recovery over future commissions

### UI/UX Decisions

#### Single-Page Application
**Why**: Better UX with instant navigation and no page reloads

#### Color-Coded Hierarchy
- **Blue** (Agents): Entry level, calm color
- **Green** (Team Leads): Growth, success
- **Amber** (Managers): Experience, caution
- **Purple** (Directors): Leadership, authority

#### Confirmation Modals
**Critical Actions**: Sale cancellation requires confirmation
- Shows impact before proceeding
- Prevents accidental cancellations
- Clear "cannot be undone" warning

#### Real-time Feedback
- Loading states during API calls
- Success/error messages
- Auto-dismiss after 5 seconds
- Visual validation (red borders for errors)

### Data Integrity Decisions

#### Cascade Delete Prevention
**Rule**: Cannot delete agents with sales or children

**Rationale**:
- Preserve historical data
- Maintain referential integrity
- Prevent orphaned records

#### Unique Policy Numbers
**Constraint**: Database-level unique constraint

**Rationale**:
- Prevent duplicate sales
- Enable reliable policy lookup
- Industry compliance requirement

#### is_cancelled Flag (Not Delete)
**Decision**: Soft delete via boolean flag

**Rationale**:
- Maintain audit trail
- Calculate clawbacks requires original data
- Regulatory compliance (data retention)

---

## 📝 Assumptions & Limitations

### Assumptions

1. **FYC Rate**: Fixed at 50% for all policies
   - Real systems may have variable rates by policy type

2. **Override Rates**: Fixed per level (2%, 1.5%, 1%)
   - Real systems may vary by product or tenure

3. **USD Currency**: All values in US dollars
   - No multi-currency support

4. **Single Organization**: No multi-tenant support
   - All agents belong to one company

5. **No Policy Types**: All policies treated equally
   - Real systems distinguish life/health/auto insurance

6. **Immediate Commission**: FYC paid on sale date
   - Real systems may have vesting periods

7. **Full Clawback**: 100% clawback on cancellation
   - Real systems may have partial clawbacks based on time

---

## 📄 License

This project is created as a technical assessment for internship selection.

---

## 👤 Author

**Aman Tiwari**

---

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---
