from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, select, and_
from flask_cors import CORS
from datetime import datetime, timezone
app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///commission.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

class Agent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    level = db.Column(db.Integer, nullable=False)
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

class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    policy_number = db.Column(db.String(50), unique=True, nullable=False)
    policy_value = db.Column(db.Float, nullable=False)
    sale_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    agent_id = db.Column(db.Integer, db.ForeignKey("agent.id"), nullable=False)
    is_cancelled = db.Column(db.Boolean, default=False)

class Commission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    commission_type = db.Column(db.String(50))
    sale_id = db.Column(db.Integer, db.ForeignKey("sale.id"), nullable=False)
    agent_id = db.Column(db.Integer, db.ForeignKey("agent.id"), nullable=False)
    payout_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class Bonus(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    bonus_type = db.Column(db.String(50))
    period = db.Column(db.String(50))
    agent_id = db.Column(db.Integer, db.ForeignKey("agent.id"), nullable=False)

class Clawback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    original_commission_id = db.Column(db.Integer, db.ForeignKey("commission.id"))
    original_bonus_id = db.Column(db.Integer, db.ForeignKey("bonus.id"))
    sale_id = db.Column(db.Integer, db.ForeignKey("sale.id"), nullable=False)
    processed_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class HierarchySnapshot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey("sale.id"), nullable=False)
    agent_id = db.Column(db.Integer, db.ForeignKey("agent.id"), nullable=False)
    upline_level = db.Column(db.Integer)
    upline_agent_id = db.Column(db.Integer, db.ForeignKey("agent.id"))

class PerformanceTier(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    agent_level = db.Column(db.Integer, nullable=False)
    tier_name = db.Column(db.String(50))
    min_volume = db.Column(db.Float)
    max_volume = db.Column(db.Float)
    bonus_rate = db.Column(db.Float)


def seed_performance_tiers():
    """Adds the default performance tier data to the database."""
    stmt = select(func.count(PerformanceTier.id))
    count = db.session.scalar(stmt)

    if count > 0:
        print("Performance tiers already seeded.")
        return

    print("Seeding performance tiers...")
    tiers_data = [
        {'agent_level': 1, 'tier_name': 'BRONZE', 'min_volume': 0, 'max_volume': 25000, 'bonus_rate': 0.00},
        {'agent_level': 1, 'tier_name': 'SILVER', 'min_volume': 25000, 'max_volume': 50000, 'bonus_rate': 0.02},
        {'agent_level': 1, 'tier_name': 'GOLD', 'min_volume': 50000, 'max_volume': 100000, 'bonus_rate': 0.03},
        {'agent_level': 1, 'tier_name': 'PLATINUM', 'min_volume': 100000, 'max_volume': float('inf'), 'bonus_rate': 0.05},
        {'agent_level': 2, 'tier_name': 'BRONZE', 'min_volume': 0, 'max_volume': 100000, 'bonus_rate': 0.00},
        {'agent_level': 2, 'tier_name': 'SILVER', 'min_volume': 100000, 'max_volume': 250000, 'bonus_rate': 0.03},
        {'agent_level': 2, 'tier_name': 'GOLD', 'min_volume': 250000, 'max_volume': 500000, 'bonus_rate': 0.05},
        {'agent_level': 2, 'tier_name': 'PLATINUM', 'min_volume': 500000, 'max_volume': float('inf'), 'bonus_rate': 0.07},
        {'agent_level': 3, 'tier_name': 'BRONZE', 'min_volume': 0, 'max_volume': 500000, 'bonus_rate': 0.00},
        {'agent_level': 3, 'tier_name': 'SILVER', 'min_volume': 500000, 'max_volume': 1000000, 'bonus_rate': 0.04},
        {'agent_level': 3, 'tier_name': 'GOLD', 'min_volume': 1000000, 'max_volume': 2000000, 'bonus_rate': 0.06},
        {'agent_level': 3, 'tier_name': 'PLATINUM', 'min_volume': 2000000, 'max_volume': float('inf'), 'bonus_rate': 0.08},
        {'agent_level': 4, 'tier_name': 'BRONZE', 'min_volume': 0, 'max_volume': 1000000, 'bonus_rate': 0.00},
        {'agent_level': 4, 'tier_name': 'SILVER', 'min_volume': 1000000, 'max_volume': 3000000, 'bonus_rate': 0.05},
        {'agent_level': 4, 'tier_name': 'GOLD', 'min_volume': 3000000, 'max_volume': 5000000, 'bonus_rate': 0.07},
        {'agent_level': 4, 'tier_name': 'PLATINUM', 'min_volume': 5000000, 'max_volume': float('inf'), 'bonus_rate': 0.10},
    ]

    for tier_info in tiers_data:
        tier = PerformanceTier(**tier_info)
        db.session.add(tier)

    db.session.flush()
    print("Performance tiers flushed.")

@app.cli.command("seed-db")
def seed_db_command():
    """Seeds the database with initial data (like performance tiers)."""
    seed_performance_tiers()
    db.session.commit()
    print("Database seeded successfully!")

def create_tables():
    with app.app_context():
        db.create_all()
        print("Database tables created!")

@app.route("/api/agents", methods=["POST"])
def add_agent():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        if not data.get("name") or not isinstance(data.get("name"), str):
            return jsonify({"error": "Agent name is required and must be a string"}), 400
        
        if not data.get("level") or not isinstance(data.get("level"), int):
            return jsonify({"error": "Agent level is required and must be an integer"}), 400
        
        if data.get("level") not in [1, 2, 3, 4]:
            return jsonify({"error": "Agent level must be 1 (Agent), 2 (Team Lead), 3 (Manager), or 4 (Director)"}), 400
        
        parent_id = data.get("parent_id")
        if parent_id is not None:
            parent_agent = db.session.get(Agent, parent_id)
            if not parent_agent:
                return jsonify({"error": f"Parent agent with ID {parent_id} not found"}), 404
            
            if parent_agent.level <= data.get("level"):
                return jsonify({"error": "Parent agent must be at a higher level than the child agent"}), 400
        
        new_agent = Agent(
            name=data["name"].strip(), 
            level=data["level"], 
            parent_id=parent_id
        )
        db.session.add(new_agent)
        db.session.commit()
        return jsonify(new_agent.to_dict()), 201
        
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error adding agent: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred while adding the agent"}), 500


@app.route("/api/agents", methods=["GET"])
def get_agents():
    try:
        level_filter = request.args.get('level', type=int)

        if level_filter:
            if level_filter not in [1, 2, 3, 4]:
                return jsonify({"error": "Level filter must be 1, 2, 3, or 4"}), 400
            
            stmt = select(Agent).filter_by(level=level_filter)
            agents = db.session.scalars(stmt).all()
            return jsonify([agent.to_dict() for agent in agents])

        stmt = select(Agent).filter_by(parent_id=None)
        top_level_agents = db.session.scalars(stmt).all()
        hierarchy = [agent.to_dict(include_children=True) for agent in top_level_agents]
        return jsonify(hierarchy)
    except Exception as e:
        app.logger.error(f"Error fetching agents: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred while fetching agents"}), 500


@app.route("/api/agents/<int:agent_id>", methods=["PUT"])
def update_agent(agent_id):
    """Updates an existing agent's details."""
    try:
        agent = db.session.get(Agent, agent_id)
        if not agent:
            return jsonify({"error": "Agent not found"}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        if "name" in data:
            if not isinstance(data["name"], str) or not data["name"].strip():
                return jsonify({"error": "Agent name must be a non-empty string"}), 400
            agent.name = data["name"].strip()
        
        if "level" in data:
            if not isinstance(data["level"], int) or data["level"] not in [1, 2, 3, 4]:
                return jsonify({"error": "Agent level must be 1, 2, 3, or 4"}), 400
            
            if agent.parent_id:
                parent = db.session.get(Agent, agent.parent_id)
                if parent and parent.level <= data["level"]:
                    return jsonify({"error": "Cannot update level: parent must be at a higher level"}), 400
            
            for child in agent.children:
                if child.level >= data["level"]:
                    return jsonify({"error": f"Cannot update level: child agent {child.name} (Level {child.level}) must be at a lower level"}), 400
            
            agent.level = data["level"]
        
        if "parent_id" in data:
            parent_id = data["parent_id"]
            
            if parent_id is not None:
                if not isinstance(parent_id, int):
                    return jsonify({"error": "Parent ID must be an integer or null"}), 400
                
                parent_agent = db.session.get(Agent, parent_id)
                if not parent_agent:
                    return jsonify({"error": f"Parent agent with ID {parent_id} not found"}), 404
                
                if parent_id == agent_id:
                    return jsonify({"error": "Agent cannot be its own parent"}), 400
                
                descendant_ids = get_downline_agent_ids(agent_id, db.session)
                if parent_id in descendant_ids:
                    return jsonify({"error": "Cannot create circular reference: parent cannot be a descendant"}), 400
                
                if parent_agent.level <= agent.level:
                    return jsonify({"error": "Parent agent must be at a higher level than the child agent"}), 400
            
            agent.parent_id = parent_id
        
        db.session.commit()
        return jsonify(agent.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating agent: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred while updating the agent"}), 500


@app.route("/api/agents/<int:agent_id>", methods=["DELETE"])
def delete_agent(agent_id):
    """Deletes an agent. Prevents deletion if agent has sales or children."""
    try:
        agent = db.session.get(Agent, agent_id)
        if not agent:
            return jsonify({"error": "Agent not found"}), 404
        
        sales_count = db.session.scalar(select(func.count(Sale.id)).where(Sale.agent_id == agent_id))
        if sales_count > 0:
            return jsonify({"error": f"Cannot delete agent: agent has {sales_count} associated sales"}), 400
        
        children_count = db.session.scalar(select(func.count(Agent.id)).where(Agent.parent_id == agent_id))
        if children_count > 0:
            return jsonify({"error": f"Cannot delete agent: agent has {children_count} child agents. Remove or reassign children first."}), 400
        
        db.session.delete(agent)
        db.session.commit()
        return jsonify({"message": "Agent deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting agent: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred while deleting the agent"}), 500

COMMISSION_RATES = {
    "FYC": 0.50,
    "Override": {
        2: 0.02,
        3: 0.015,
        4: 0.01,
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
    agent_ids = {agent_id}
    
    children_stmt = select(Agent.id).where(Agent.parent_id == agent_id)
    children_ids = db_session.scalars(children_stmt).all()
    
    for child_id in children_ids:
        agent_ids.update(get_downline_agent_ids(child_id, db_session))
        
    return list(agent_ids)

@app.route("/api/sales", methods=["POST"])
def create_sale():
    """
    Records a new sale and triggers all commission and snapshot calculations.
    """
    data = request.get_json()
    
    # Enhanced validation
    if not data:
        return jsonify({"error": "Request body is required"}), 400
    
    if not data.get("policy_number") or not isinstance(data.get("policy_number"), str):
        return jsonify({"error": "Policy number is required and must be a string"}), 400
    
    # Check if policy_value exists in data (allowing 0 as a value)
    if "policy_value" not in data or data.get("policy_value") is None:
        return jsonify({"error": "Policy value is required and must be a number"}), 400
    
    if not isinstance(data.get("policy_value"), (int, float)):
        return jsonify({"error": "Policy value is required and must be a number"}), 400
    
    if data.get("policy_value") <= 0:
        return jsonify({"error": "Policy value must be greater than zero"}), 400
    
    if not data.get("agent_id") or not isinstance(data.get("agent_id"), int):
        return jsonify({"error": "Agent ID is required and must be an integer"}), 400

    try:
        # Verify agent exists
        agent = db.session.get(Agent, data["agent_id"])
        if not agent:
            return jsonify({"error": f"Agent with ID {data['agent_id']} not found"}), 404
        
        # Check for duplicate policy number
        existing_sale = db.session.query(Sale).filter_by(policy_number=data["policy_number"]).first()
        if existing_sale:
            return jsonify({"error": f"Policy number {data['policy_number']} already exists"}), 409
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
        app.logger.error(f"Error creating sale: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred while recording the sale"}), 500
    

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
        app.logger.error(f"Error fetching sales: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred while fetching sales"}), 500
        
@app.route('/api/sales/<int:sale_id>/cancel', methods=['PUT'])
def cancel_sale(sale_id):
    """
    Marks a sale as cancelled. Creates clawback records for associated 
    commissions AND recalculates/creates clawbacks for affected monthly bonuses.
    """
    try:
        # 1. Find the sale
        sale_to_cancel = db.session.get(Sale, sale_id)
        if not sale_to_cancel:
            return jsonify({"error": "Sale not found"}), 404
        if sale_to_cancel.is_cancelled:
             return jsonify({"message": "Policy already marked as cancelled"}), 200

        # --- Cancellation Starts ---
        sale_to_cancel.is_cancelled = True

        # --- Commission Clawback ---
        related_commissions_stmt = select(Commission).where(Commission.sale_id == sale_id)
        related_commissions = db.session.scalars(related_commissions_stmt).all()

        for commission in related_commissions:
            clawback_record = Clawback(
                amount=-commission.amount, 
                original_commission_id=commission.id,
                sale_id=sale_id
            )
            db.session.add(clawback_record)

        # --- Bonus Clawback/Recalculation (Monthly, Quarterly, Annual) ---
        # Find all agents involved in the original sale (seller + upline)
        # We can use the HierarchySnapshot for this
        snapshot_stmt = select(HierarchySnapshot.agent_id).where(HierarchySnapshot.sale_id == sale_id)
        affected_agent_ids = db.session.scalars(snapshot_stmt).unique().all()

        # Determine the periods of the sale
        sale_year = sale_to_cancel.sale_date.year
        sale_month = sale_to_cancel.sale_date.month
        
        # Calculate which quarter the sale falls into
        sale_quarter = (sale_month - 1) // 3 + 1
        
        # Define periods for each bonus type
        monthly_period = f"{sale_year}-{sale_month:02d}"
        quarterly_period = f"{sale_year}-Q{sale_quarter}"
        annual_period = f"{sale_year}"
        
        # Process clawbacks for all three bonus types
        bonus_types_and_periods = [
            ('Monthly', monthly_period, sale_year, sale_month, None),
            ('Quarterly', quarterly_period, sale_year, None, sale_quarter),
            ('Annual', annual_period, sale_year, None, None)
        ]

        for bonus_type, period_str, year, month, quarter in bonus_types_and_periods:
            for agent_id in affected_agent_ids:
                agent = db.session.get(Agent, agent_id)
                if not agent: 
                    continue # Skip if agent somehow doesn't exist

                # Find the original bonus calculation for this agent and period
                original_bonus_stmt = select(Bonus).where(
                    and_(Bonus.agent_id == agent_id, Bonus.period == period_str, Bonus.bonus_type == bonus_type)
                )
                original_bonus = db.session.scalar(original_bonus_stmt)

                if original_bonus:
                    # Recalculate the volume *after* cancellation
                    # Note: volume functions already exclude cancelled sales
                    new_volume = 0
                    agent_ids_to_sum = [agent.id] if agent.level == 1 else get_downline_agent_ids(agent.id, db.session)
                    
                    # Calculate volume based on bonus type
                    if bonus_type == 'Monthly':
                        new_volume = get_monthly_sales_volume(agent_ids_list=agent_ids_to_sum, year=year, month=month, db_session=db.session)
                    elif bonus_type == 'Quarterly':
                        new_volume = get_quarterly_sales_volume(agent_ids_list=agent_ids_to_sum, year=year, quarter=quarter, db_session=db.session)
                    elif bonus_type == 'Annual':
                        new_volume = get_annual_sales_volume(agent_ids_list=agent_ids_to_sum, year=year, db_session=db.session)

                    # Recalculate the expected bonus amount based on the new volume
                    new_bonus_rate = get_bonus_rate_for_volume(agent.level, new_volume, db.session)
                    new_expected_bonus_amount = new_volume * new_bonus_rate

                    # Calculate the adjustment needed
                    bonus_adjustment = new_expected_bonus_amount - original_bonus.amount

                    # If an adjustment is needed, create a clawback record
                    if abs(bonus_adjustment) > 0.001: # Use a small tolerance for float comparison
                        bonus_clawback = Clawback(
                            amount=bonus_adjustment, # Store the adjustment (can be negative)
                            original_bonus_id=original_bonus.id, # Link to the original bonus
                            sale_id=sale_id # Link to the sale that triggered it
                        )
                        db.session.add(bonus_clawback)

        # Commit sale cancellation, commission clawbacks, and bonus clawbacks
        db.session.commit() 

        return jsonify({"message": "Policy cancelled and clawbacks initiated"}), 200

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error cancelling sale {sale_id}: {e}", exc_info=True)
        return jsonify({"error": f"An internal error occurred: {str(e)}"}), 500
        


@app.route('/api/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    """ Provides summary statistics for the dashboard. """
    try:
        total_sales_value = db.session.scalar(select(func.sum(Sale.policy_value))) or 0.0
        total_commissions_paid = db.session.scalar(select(func.sum(Commission.amount))) or 0.0
        total_bonuses_paid = db.session.scalar(select(func.sum(Bonus.amount))) or 0.0
        # Clawbacks are stored as negative values, sum them up
        total_clawbacks_value = db.session.scalar(select(func.sum(Clawback.amount))) or 0.0
        agent_count = db.session.scalar(select(func.count(Agent.id))) or 0

        summary = {
            'total_sales_value': total_sales_value,
            'total_commissions_paid': total_commissions_paid,
            'total_bonuses_paid': total_bonuses_paid,
            'total_clawbacks_value': total_clawbacks_value,
            'agent_count': agent_count
        }
        return jsonify(summary)

    except Exception as e:
        app.logger.error(f"Error fetching dashboard summary: {e}", exc_info=True)
        return jsonify({"error": f"An internal error occurred: {str(e)}"}), 500
        




# --- Bonus Calculation Logic ---

def get_monthly_sales_volume(agent_ids_list, year, month, db_session):
    """Calculates total sales volume for a list of agents in a given month."""
    start_date = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12: end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else: end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)

    stmt = select(func.sum(Sale.policy_value)).where(
        and_(
            Sale.agent_id.in_(agent_ids_list), # Use list here now
            Sale.sale_date >= start_date,
            Sale.sale_date < end_date,
            Sale.is_cancelled == False
        )
    )
    total_volume = db_session.scalar(stmt)
    return total_volume or 0.0


def get_quarterly_sales_volume(agent_ids_list, year, quarter, db_session):
    """Calculates total sales volume for a list of agents in a given quarter."""
    if quarter == 1: start_month, end_month = 1, 3
    elif quarter == 2: start_month, end_month = 4, 6
    elif quarter == 3: start_month, end_month = 7, 9
    elif quarter == 4: start_month, end_month = 10, 12
    else: return 0.0 # Invalid quarter

    start_date = datetime(year, start_month, 1, tzinfo=timezone.utc)
    # End date is the start of the next quarter
    if end_month == 12: end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else: end_date = datetime(year, end_month + 1, 1, tzinfo=timezone.utc)

    stmt = select(func.sum(Sale.policy_value)).where(
        and_(
            Sale.agent_id.in_(agent_ids_list),
            Sale.sale_date >= start_date,
            Sale.sale_date < end_date,
            Sale.is_cancelled == False
        )
    )
    total_volume = db_session.scalar(stmt)
    return total_volume or 0.0

def get_annual_sales_volume(agent_ids_list, year, db_session):
    """Calculates total sales volume for a list of agents in a given year."""
    start_date = datetime(year, 1, 1, tzinfo=timezone.utc)
    end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)

    stmt = select(func.sum(Sale.policy_value)).where(
        and_(
            Sale.agent_id.in_(agent_ids_list),
            Sale.sale_date >= start_date,
            Sale.sale_date < end_date,
            Sale.is_cancelled == False
        )
    )
    total_volume = db_session.scalar(stmt)
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


@app.route('/api/bonuses/calculate', methods=['POST'])
def calculate_bonuses():
    """ Calculates and saves bonuses for Monthly, Quarterly, or Annual periods. """
    data = request.get_json()
    period_str = data.get('period') # e.g., "2025-10", "2026-Q1", "2027"
    bonus_type = data.get('type')   # e.g., "Monthly", "Quarterly", "Annual"

    # Validate bonus_type
    if bonus_type not in ['Monthly', 'Quarterly', 'Annual']:
        return jsonify({'error': 'Invalid bonus type. Use Monthly, Quarterly, or Annual.'}), 400
    if not period_str:
        return jsonify({'error': 'Period string is required.'}), 400

    # Parse period string based on type
    year, month, quarter = None, None, None
    try:
        if bonus_type == 'Monthly':
            year, month = map(int, period_str.split('-'))
            if not (1 <= month <= 12): raise ValueError("Invalid month")
        elif bonus_type == 'Quarterly':
            year_str, q_str = period_str.split('-')
            year = int(year_str)
            quarter = int(q_str[1:]) # Extract number from Q1, Q2 etc.
            if not (1 <= quarter <= 4): raise ValueError("Invalid quarter")
        elif bonus_type == 'Annual':
            year = int(period_str)
    except (ValueError, IndexError):
        return jsonify({'error': f'Invalid period format for {bonus_type}. Use YYYY-MM, YYYY-Q#, or YYYY.'}), 400

    try:
        all_agents_stmt = select(Agent)
        all_agents = db.session.scalars(all_agents_stmt).all()

        bonuses_created_count = 0
        bonuses_updated_count = 0

        for agent in all_agents:
            volume = 0
            agent_ids_to_sum = [] # List of IDs for volume calculation

            # Determine volume scope (personal or downline) and calculate
            if agent.level == 1:
                agent_ids_to_sum = [agent.id] # Level 1 uses personal sales
            else:
                agent_ids_to_sum = get_downline_agent_ids(agent.id, db.session) # Others use downline

            # Calculate volume based on bonus type
            if bonus_type == 'Monthly':
                volume = get_monthly_sales_volume(agent_ids_to_sum, year, month, db.session)
            elif bonus_type == 'Quarterly':
                volume = get_quarterly_sales_volume(agent_ids_to_sum, year, quarter, db.session)
            elif bonus_type == 'Annual':
                volume = get_annual_sales_volume(agent_ids_to_sum, year, db.session)

            if volume > 0:
                bonus_rate = get_bonus_rate_for_volume(agent.level, volume, db.session)
                if bonus_rate > 0:
                    bonus_amount = volume * bonus_rate

                    # Check if bonus exists and Save/Update
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
        app.logger.error(f"Error calculating bonuses: {e}", exc_info=True)
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
        app.logger.error(f"Error fetching bonuses: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred while fetching bonuses"}), 500


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        seed_performance_tiers()
        db.session.commit()
    app.run(debug=True, port=5000)
