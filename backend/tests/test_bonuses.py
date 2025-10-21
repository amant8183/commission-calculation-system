import pytest
import json
from datetime import datetime, timezone
from app import PerformanceTier, Bonus, Agent

def test_calculate_monthly_bonus_for_agent(client, db): # Use client and db_session
    """ Test calculating the monthly volume bonus for a single agent. """
    # === 1. ARRANGE ===
    # Verify tiers were seeded by the conftest fixture
    assert db.session.query(PerformanceTier).count() > 0

    # Create hierarchy via API
    dir_resp = client.post('/api/agents', json={'name': 'Dir', 'level': 4})
    assert dir_resp.status_code == 201; dir_id = dir_resp.json['id']
    mgr_resp = client.post('/api/agents', json={'name': 'Mgr', 'level': 3, 'parent_id': dir_id})
    assert mgr_resp.status_code == 201; mgr_id = mgr_resp.json['id']
    tl_resp = client.post('/api/agents', json={'name': 'TL', 'level': 2, 'parent_id': mgr_id})
    assert tl_resp.status_code == 201; tl_id = tl_resp.json['id']
    agent_resp = client.post('/api/agents', json={'name': 'Agent', 'level': 1, 'parent_id': tl_id})
    assert agent_resp.status_code == 201; agent_id = agent_resp.json['id']

    # Create sales via API for the agent in the CURRENT month
    # Assuming all sales happen roughly 'now' for simplicity in this test
    sales_payloads = [
        {"policy_number": "POL-TEST-A", "policy_value": 60000.00, "agent_id": agent_id},
        {"policy_number": "POL-TEST-B", "policy_value": 45000.00, "agent_id": agent_id},
        {"policy_number": "POL-TEST-C", "policy_value": 20000.00, "agent_id": agent_id},
    ]
    for payload in sales_payloads:
         sale_resp = client.post('/api/sales', json=payload)
         assert sale_resp.status_code == 201 # Verify sale creation works

    # Total Volume = 60k + 45k + 20k = 125,000

    # === 2. ACT ===
    # Trigger bonus calculation for the current month
    now = datetime.now(timezone.utc)
    period_str = f"{now.year}-{now.month:02d}" # Format YYYY-MM

    bonus_calc_resp = client.post('/api/bonuses/calculate', json={
        'period': period_str,
        'type': 'Monthly'
    })

    # === 3. ASSERT ===
    assert bonus_calc_resp.status_code == 200
    assert bonus_calc_resp.json['message'].startswith(f'Monthly bonuses calculated for {period_str}')

    # Check that the Bonus table has the correct entry for the agent
    bonuses = db.session.query(Bonus).filter_by(agent_id=agent_id, period=period_str).all()
    assert len(bonuses) == 1
    agent_bonus = bonuses[0]
    assert agent_bonus.bonus_type == 'Monthly'

    # Expected: 125k volume = PLATINUM tier for Level 1 (5% rate) => Bonus = 6250.00
    assert agent_bonus.amount == pytest.approx(6250.00)
    

def test_get_bonuses(client, db): # Use db fixture from conftest
    """ Test fetching calculated bonuses. """
    # --- ARRANGE ---
    # 1. Create agent and sales like in the previous test
    dir_resp = client.post('/api/agents', json={'name': 'Dir', 'level': 4})
    dir_id = dir_resp.json['id']
    mgr_resp = client.post('/api/agents', json={'name': 'Mgr', 'level': 3, 'parent_id': dir_id})
    mgr_id = mgr_resp.json['id']
    tl_resp = client.post('/api/agents', json={'name': 'TL', 'level': 2, 'parent_id': mgr_id})
    tl_id = tl_resp.json['id']
    agent_resp = client.post('/api/agents', json={'name': 'Agent', 'level': 1, 'parent_id': tl_id})
    agent_id = agent_resp.json['id']

    sales_payloads = [
        {"policy_number": "POL-GET-A", "policy_value": 70000.00, "agent_id": agent_id}, # Qualifies for Gold (3%)
    ]
    for payload in sales_payloads:
         sale_resp = client.post('/api/sales', json=payload)
         assert sale_resp.status_code == 201

    # 2. Calculate bonuses for the period
    now = datetime.now(timezone.utc)
    period_str = f"{now.year}-{now.month:02d}"
    client.post('/api/bonuses/calculate', json={'period': period_str, 'type': 'Monthly'})

    # --- ACT ---
    # 3. Fetch the bonuses
    response = client.get('/api/bonuses')

    # --- ASSERT ---
    assert response.status_code == 200
    data = response.json
    assert isinstance(data, list)
    assert len(data) >= 1 # Should contain at least the one we calculated

    # Find the bonus for our agent
    agent_bonus = next((b for b in data if b['agent_id'] == agent_id and b['period'] == period_str), None)
    assert agent_bonus is not None
    assert agent_bonus['bonus_type'] == 'Monthly'
    assert agent_bonus['agent_name'] == 'Agent' # Check agent name is included
    # Expected: 70k volume = GOLD tier for Level 1 (3% rate) => Bonus = 2100.00
    assert agent_bonus['amount'] == pytest.approx(2100.00)