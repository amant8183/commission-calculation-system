from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import datetime

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
    sale_date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    agent_id = db.Column(db.Integer, db.ForeignKey("agent.id"), nullable=False)
    is_cancelled = db.Column(db.Boolean, default=False)


# --- 3. Commission Model ---
class Commission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    commission_type = db.Column(db.String(50))  # e.g., 'FYC', 'Override'
    sale_id = db.Column(db.Integer, db.ForeignKey("sale.id"), nullable=False)
    agent_id = db.Column(db.Integer, db.ForeignKey("agent.id"), nullable=False)
    payout_date = db.Column(db.DateTime, default=datetime.datetime.utcnow)


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
    processed_date = db.Column(db.DateTime, default=datetime.datetime.utcnow)


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
    top_level_agents = Agent.query.filter_by(parent_id=None).all()
    hierarchy = [agent.to_dict(include_children=True) for agent in top_level_agents]
    return jsonify(hierarchy)
