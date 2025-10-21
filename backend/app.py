from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import datetime
from datetime import timezone
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
    sale_date = db.Column(db.DateTime, default=lambda: datetime.datetime.now(timezone.utc))
    agent_id = db.Column(db.Integer, db.ForeignKey("agent.id"), nullable=False)
    is_cancelled = db.Column(db.Boolean, default=False)


# --- 3. Commission Model ---
class Commission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    commission_type = db.Column(db.String(50))  # e.g., 'FYC', 'Override'
    sale_id = db.Column(db.Integer, db.ForeignKey("sale.id"), nullable=False)
    agent_id = db.Column(db.Integer, db.ForeignKey("agent.id"), nullable=False)
    payout_date = db.Column(db.DateTime, default=lambda: datetime.datetime.now(timezone.utc))

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
    processed_date = db.Column(db.DateTime, default=lambda: datetime.datetime.now(timezone.utc))


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


@app.route("/api/agents", methods=["GET"])
def get_agents():
    top_level_agents = db.session.query(Agent).filter_by(parent_id=None).all()
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