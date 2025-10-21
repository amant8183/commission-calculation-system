from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, select, and_
from flask_cors import CORS
from datetime import datetime, timezone
app = Flask(__name__)
CORS(app)

# --- Database Configuration ---
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///commission.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)


# --- 1. Agent Model ---
class Agent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    level = db.Column(db.Integer, nullable=False)  # 1: Agent, 2: TL, 3: Mgr, 4: Dir
    parent_id = db.Column(db.Integer, db.ForeignKey("agent.id"), nullable=True)

    children = db.relationship(
        "Agent", backref=db.backref("parent", remote_side=[id]), lazy=True
    )
    sales = db.relationship("Sale", backref="agent", lazy=True)

    def to_dict(self, include_children=False):
        data = {
            "id": self.id,
            "name": self.name,
            "level": self.level,
            "parent_id": self.parent_id,
        }
        if include_children:
            data["children"] = [
                child.to_dict(include_children=True) for child in self.children
            ]
        return data


# --- 2. Sale Model ---
class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    policy_number = db.Column(db.String(50), unique=True, nullable=False)
    policy_value = db.Column(db.Float, nullable=False)
    sale_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    agent_id = db.Column(db.Integer, db.ForeignKey("agent.id"), nullable=False)
    is_cancelled = db.Column(db.Boolean, default=False)


# --- 3. Commission Model ---
class Commission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    commission_type = db.Column(db.String(50))  # e.g., 'FYC', 'Override'
    sale_id = db.Column(db.Integer, db.ForeignKey("sale.id"), nullable=False)
    agent_id = db.Column(db.Integer, db.ForeignKey("agent.id"), nullable=False)
    payout_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

# --- 4. Bonus Model ---
class Bonus(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    bonus_type = db.Column(db.String(50))  # 'Monthly', 'Quarterly', 'Annual'
    period = db.Column(db.String(50))  # e.g., '2024-01', '2024-Q1', '2024'
    agent_id = db.Column(db.Integer, db.ForeignKey("agent.id"), nullable=False)


# --- 5. Clawback Model ---
class Clawback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    original_commission_id = db.Column(db.Integer, db.ForeignKey("commission.id"))
    original_bonus_id = db.Column(db.Integer, db.ForeignKey("bonus.id"))
    sale_id = db.Column(db.Integer, db.ForeignKey("sale.id"), nullable=False)
    processed_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


# --- 6. Hierarchy Snapshot Model ---
class HierarchySnapshot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey("sale.id"), nullable=False)
    agent_id = db.Column(db.Integer, db.ForeignKey("agent.id"), nullable=False)
    upline_level = db.Column(db.Integer)
    upline_agent_id = db.Column(db.Integer, db.ForeignKey("agent.id"))


# --- 7. Performance Tier Model ---
class PerformanceTier(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    agent_level = db.Column(db.Integer, nullable=False)
    tier_name = db.Column(db.String(50))
    min_volume = db.Column(db.Float)
    max_volume = db.Column(db.Float)
    bonus_rate = db.Column(db.Float)


def seed_performance_tiers():
    """Adds the default performance tier data to the database."""
    # This function now expects an active app context from the caller
    stmt = select(func.count(PerformanceTier.id))
    count = db.session.scalar(stmt)

    if count > 0:
        print("Performance tiers already seeded.")
        return

    print("Seeding performance tiers...")
    tiers_data = [
        # Agent Level 1
        {'agent_level': 1, 'tier_name': 'BRONZE', 'min_volume': 0, 'max_volume': 25000, 'bonus_rate': 0.00},
        {'agent_level': 1, 'tier_name': 'SILVER', 'min_volume': 25000, 'max_volume': 50000, 'bonus_rate': 0.02},
        {'agent_level': 1, 'tier_name': 'GOLD', 'min_volume': 50000, 'max_volume': 100000, 'bonus_rate': 0.03},
        {'agent_level': 1, 'tier_name': 'PLATINUM', 'min_volume': 100000, 'max_volume': float('inf'), 'bonus_rate': 0.05},
        # Agent Level 2 (Team Leads)
        {'agent_level': 2, 'tier_name': 'BRONZE', 'min_volume': 0, 'max_volume': 100000, 'bonus_rate': 0.00},
        {'agent_level': 2, 'tier_name': 'SILVER', 'min_volume': 100000, 'max_volume': 250000, 'bonus_rate': 0.03},
        {'agent_level': 2, 'tier_name': 'GOLD', 'min_volume': 250000, 'max_volume': 500000, 'bonus_rate': 0.05},
        {'agent_level': 2, 'tier_name': 'PLATINUM', 'min_volume': 500000, 'max_volume': float('inf'), 'bonus_rate': 0.07},
        # Agent Level 3 (Managers)
        {'agent_level': 3, 'tier_name': 'BRONZE', 'min_volume': 0, 'max_volume': 500000, 'bonus_rate': 0.00},
        {'agent_level': 3, 'tier_name': 'SILVER', 'min_volume': 500000, 'max_volume': 1000000, 'bonus_rate': 0.04},
        {'agent_level': 3, 'tier_name': 'GOLD', 'min_volume': 1000000, 'max_volume': 2000000, 'bonus_rate': 0.06},
        {'agent_level': 3, 'tier_name': 'PLATINUM', 'min_volume': 2000000, 'max_volume': float('inf'), 'bonus_rate': 0.08},
        # Agent Level 4 (Directors)
        {'agent_level': 4, 'tier_name': 'BRONZE', 'min_volume': 0, 'max_volume': 1000000, 'bonus_rate': 0.00},
        {'agent_level': 4, 'tier_name': 'SILVER', 'min_volume': 1000000, 'max_volume': 3000000, 'bonus_rate': 0.05},
        {'agent_level': 4, 'tier_name': 'GOLD', 'min_volume': 3000000, 'max_volume': 5000000, 'bonus_rate': 0.07},
        {'agent_level': 4, 'tier_name': 'PLATINUM', 'min_volume': 5000000, 'max_volume': float('inf'), 'bonus_rate': 0.10},
    ]

    for tier_info in tiers_data:
        tier = PerformanceTier(**tier_info)
        db.session.add(tier)

    # Use flush, commit will be handled by the caller (CLI command or test fixture)
    db.session.flush()
    print("Performance tiers flushed.")


# --- CLI Commands ---
@app.cli.command("seed-db")
def seed_db_command():
    """Seeds the database with initial data (like performance tiers)."""
    seed_performance_tiers()
    db.session.commit() # Commit the changes made by seeding
    print("Database seeded successfully!")

# --- Function to create tables ---
def create_tables():
    with app.app_context():
        db.create_all()
        print("Database tables created!")


# --- Agent CRUD API Endpoints ---
@app.route("/api/agents", methods=["POST"])
def add_agent():
    data = request.get_json()
    new_agent = Agent(
        name=data["name"], level=data["level"], parent_id=data.get("parent_id")
    )
    db.session.add(new_agent)
    db.session.commit()
    return jsonify(new_agent.to_dict()), 201


# backend/app.py

@app.route("/api/agents", methods=["GET"])
def get_agents():
    # Check if a 'level' query parameter is provided
    level_filter = request.args.get('level', type=int)

    if level_filter:
        # Get all agents matching that level
        stmt = select(Agent).filter_by(level=level_filter)
        agents = db.session.scalars(stmt).all()
        # Return a flat list of these agents
        return jsonify([agent.to_dict() for agent in agents])

    # If no level is specified, return the full hierarchy (original behavior)
    stmt = select(Agent).filter_by(parent_id=None)
    top_level_agents = db.session.scalars(stmt).all()
    hierarchy = [agent.to_dict(include_children=True) for agent in top_level_agents]
    return jsonify(hierarchy)

# --- Commission Calculation Logic ---

# Define the commission rates
COMMISSION_RATES = {
    "FYC": 0.50,  # 50%
    "Override": {
        2: 0.02,  # Team Lead (Level 2) gets 2%
        3: 0.015,  # Manager (Level 3) gets 1.5%
        4: 0.01,  # Director (Level 4) gets 1%
    },
}


def get_upline(agent_id, db_session):
    """
    Finds all managers in the agent's upline.
    Returns a list of Agent objects.
    """
    upline = []
    current_agent = db_session.get(Agent, agent_id)

    while current_agent and current_agent.parent_id:
        parent = db_session.get(Agent, current_agent.parent_id)
        if parent:
            upline.append(parent)
            current_agent = parent
        else:
            break
    return upline


def get_downline_agent_ids(agent_id, db_session):
    """Recursively finds all agent IDs in the downline, including the starting agent."""
    agent_ids = {agent_id} # Use a set to avoid duplicates
    
    # Find direct children
    children_stmt = select(Agent.id).where(Agent.parent_id == agent_id)
    children_ids = db_session.scalars(children_stmt).all()
    
    for child_id in children_ids:
        # Recursively get downline for each child and add to the set
        agent_ids.update(get_downline_agent_ids(child_id, db_session))
        
    return list(agent_ids)

# --- Sales API Endpoint ---


@app.route("/api/sales", methods=["POST"])
def create_sale():
    """
    Records a new sale and triggers all commission and snapshot calculations.
    """
    data = request.get_json()
    if (
        not data
        or not data.get("policy_number")
        or not data.get("policy_value")
        or not data.get("agent_id")
    ):
        return jsonify({"error": "Missing required sale data"}), 400

    try:
        # 1. Save the Sale
        new_sale = Sale(
            policy_number=data["policy_number"],
            policy_value=data["policy_value"],
            agent_id=data["agent_id"],
        )
        db.session.add(new_sale)
        # We need the sale_id, so we flush (like a pre-commit)
        db.session.flush()

        # 2. Find the Upline
        selling_agent = db.session.get(Agent, data["agent_id"])
        upline_managers = get_upline(data["agent_id"], db.session)

        all_recipients = [selling_agent] + upline_managers

        # 3. Create the Hierarchy Snapshot
        for i, agent in enumerate(all_recipients):
            snapshot = HierarchySnapshot(
                sale_id=new_sale.id,
                agent_id=agent.id,
                upline_level=i,  # 0 = seller, 1 = first manager, etc.
                upline_agent_id=agent.id # Storing the agent's own ID in this snapshot record
            )
            db.session.add(snapshot)

        # 4. Calculate & Save FYC (for the seller)
        fyc_amount = new_sale.policy_value * COMMISSION_RATES["FYC"]
        fyc_commission = Commission(
            amount=fyc_amount,
            commission_type="FYC",
            sale_id=new_sale.id,
            agent_id=selling_agent.id,
        )
        db.session.add(fyc_commission)

        # 5. Calculate & Save Overrides (for the upline)
        for manager in upline_managers:
            rate = COMMISSION_RATES["Override"].get(manager.level)
            if rate:
                override_amount = new_sale.policy_value * rate
                override_commission = Commission(
                    amount=override_amount,
                    commission_type="Override",
                    sale_id=new_sale.id,
                    agent_id=manager.id,
                )
                db.session.add(override_commission)

        # Commit all changes to the database
        db.session.commit()

        return jsonify(
            {"message": "Sale recorded successfully", "sale_id": new_sale.id}
        ), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    

@app.route("/api/sales", methods=["GET"])
def get_sales():
    try:
        # Query all sales, and join with the Agent table to get the agent's name
        # Order by the most recent sale first
        stmt = (
            select(Sale, Agent.name)
            .join(Agent, Sale.agent_id == Agent.id)
            .order_by(Sale.sale_date.desc())
        )
        
        # .all() will return a list of (Sale, agent_name) tuples
        results = db.session.execute(stmt).all() 
        
        sales_list = []
        for sale, agent_name in results:  # Unpack the tuple here
            sales_list.append({
                "id": sale.id,
                "policy_number": sale.policy_number,
                "policy_value": sale.policy_value,
                "sale_date": sale.sale_date.isoformat(),
                "agent_id": sale.agent_id,
                "agent_name": agent_name,
                "is_cancelled": sale.is_cancelled
            })
            
        return jsonify(sales_list)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
        


# --- Bonus Calculation Logic ---

def get_monthly_sales_volume(year, month, db_session, agent_id=None, agent_ids_list=None):
    """
    Calculates total sales volume for a given month.
    Either for a single agent_id OR for a list of agent_ids_list.
    """
    start_date = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12: end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else: end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)

    # Base query
    query = select(func.sum(Sale.policy_value)).where(
        and_(
            Sale.sale_date >= start_date,
            Sale.sale_date < end_date,
            Sale.is_cancelled == False
        )
    )

    # Filter by single agent OR list of agents
    if agent_id:
        query = query.where(Sale.agent_id == agent_id)
    elif agent_ids_list:
        # Use .in_() for list filtering
        query = query.where(Sale.agent_id.in_(agent_ids_list))
    else:
        # Should not happen, but return 0 if neither is provided
        return 0.0 

    total_volume = db_session.scalar(query)
    return total_volume or 0.0

def get_bonus_rate_for_volume(agent_level, volume, db_session):
    """Finds the bonus rate based on agent level and sales volume."""
    stmt = (
        select(PerformanceTier.bonus_rate)
        .where(
            and_(
                PerformanceTier.agent_level == agent_level,
                PerformanceTier.min_volume <= volume,
                PerformanceTier.max_volume > volume
            )
        )
        .limit(1) # Ensure only one tier is matched
    )
    # Use the correct db session passed into the function (or db.session from context)
    rate = db_session.scalar(stmt)
    return rate if rate is not None else 0.0 # Return 0 if no matching tier

# --- Bonus Calculation API Endpoint ---

# backend/app.py

@app.route('/api/bonuses/calculate', methods=['POST'])
def calculate_bonuses():
    """ Calculates and saves Monthly volume bonuses for all agents based on their level and appropriate volume (personal or downline). """
    data = request.get_json()
    period_str = data.get('period') # e.g., "2025-10"
    bonus_type = data.get('type')   # e.g., "Monthly"

    if not period_str or bonus_type != 'Monthly':
        return jsonify({'error': 'Invalid request. Requires period (YYYY-MM) and type=Monthly.'}), 400
    try: year, month = map(int, period_str.split('-'))
    except ValueError: return jsonify({'error': 'Invalid period format. Use YYYY-MM.'}), 400

    try:
        all_agents_stmt = select(Agent)
        all_agents = db.session.scalars(all_agents_stmt).all()

        bonuses_created_count = 0
        bonuses_updated_count = 0

        for agent in all_agents:
            volume = 0
            # Determine which volume to use based on level
            if agent.level == 1:
                # Level 1 Agents use personal volume
                volume = get_monthly_sales_volume(year=year, month=month, db_session=db.session, agent_id=agent.id)
            else:
                # Levels 2, 3, 4 use total downline volume
                downline_ids = get_downline_agent_ids(agent.id, db.session)
                volume = get_monthly_sales_volume(year=year, month=month, db_session=db.session, agent_ids_list=downline_ids)

            if volume > 0:
                bonus_rate = get_bonus_rate_for_volume(agent.level, volume, db.session)
                if bonus_rate > 0:
                    bonus_amount = volume * bonus_rate

                    # Check if bonus exists
                    existing_bonus_stmt = select(Bonus).where(
                        and_(Bonus.agent_id == agent.id, Bonus.period == period_str, Bonus.bonus_type == bonus_type)
                    )
                    existing_bonus = db.session.scalar(existing_bonus_stmt)

                    if existing_bonus:
                        existing_bonus.amount = bonus_amount
                        bonuses_updated_count += 1
                    else:
                        new_bonus = Bonus(amount=bonus_amount, bonus_type=bonus_type, period=period_str, agent_id=agent.id)
                        db.session.add(new_bonus)
                        bonuses_created_count += 1

        db.session.commit()
        return jsonify({'message': f'{bonus_type} bonuses calculated for {period_str}. Created: {bonuses_created_count}, Updated: {bonuses_updated_count}'}), 200

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error calculating bonuses: {e}", exc_info=True) # Log detailed error
        return jsonify({'error': f'An internal error occurred: {str(e)}'}), 500
        

@app.route('/api/bonuses', methods=['GET'])
def get_bonuses():
    """ Fetches calculated bonuses, joining with agent names. """
    try:
        # Query bonuses and join with Agent to get names
        # Order by period descending, then agent name
        stmt = (
            select(Bonus, Agent.name)
            .join(Agent, Bonus.agent_id == Agent.id)
            .order_by(Bonus.period.desc(), Agent.name)
        )
        results = db.session.execute(stmt).all()

        bonuses_list = []
        for bonus, agent_name in results:
            bonuses_list.append({
                "id": bonus.id,
                "amount": bonus.amount,
                "bonus_type": bonus.bonus_type,
                "period": bonus.period,
                "agent_id": bonus.agent_id,
                "agent_name": agent_name,
            })
        return jsonify(bonuses_list)

    except Exception as e:
        return jsonify({"error": str(e)}), 500