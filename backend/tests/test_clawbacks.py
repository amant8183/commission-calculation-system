import pytest
import json
from app import db, Agent, Sale, Commission, Clawback, HierarchySnapshot

# Re-use the hierarchy setup fixture from commissions test
from tests.test_commissions import setup_hierarchy

def test_cancel_policy_and_create_commission_clawbacks(client, db, setup_hierarchy):
    """
    Test cancelling a policy:
    1. Sets Sale.is_cancelled to True.
    2. Creates negative Clawback records for all original Commissions (FYC & Overrides).
    """
    # === 1. ARRANGE ===
    agent_id = setup_hierarchy['agent_id']
    sale_data = {
        "policy_number": "POL-CLAWBACK-1",
        "policy_value": 50000.00, # $50k policy
        "agent_id": agent_id
    }

    # Create the initial sale and its commissions using the existing API
    create_sale_resp = client.post('/api/sales', json=sale_data)
    assert create_sale_resp.status_code == 201
    sale_id = create_sale_resp.json['sale_id']

    # Verify initial commissions were created (1 FYC + 3 Overrides = 4)
    initial_commissions = db.session.query(Commission).filter_by(sale_id=sale_id).all()
    assert len(initial_commissions) == 4

    # Calculate expected original commission amounts
    expected_fyc = 50000.00 * 0.50 # 25000
    expected_tl_override = 50000.00 * 0.02 # 1000
    expected_mgr_override = 50000.00 * 0.015 # 750
    expected_dir_override = 50000.00 * 0.01 # 500

    # === 2. ACT ===
    # Cancel the policy using a new endpoint
    cancel_resp = client.put(f'/api/sales/{sale_id}/cancel')

    # === 3. ASSERT ===
    # --- Assert 3a: Cancellation API was successful
    assert cancel_resp.status_code == 200
    assert cancel_resp.json['message'] == 'Policy cancelled and clawbacks initiated'

    # --- Assert 3b: Sale object is marked as cancelled
    cancelled_sale = db.session.get(Sale, sale_id)
    assert cancelled_sale is not None
    assert cancelled_sale.is_cancelled is True

    # --- Assert 3c: Clawback records created for commissions
    clawback_records = db.session.query(Clawback).filter_by(sale_id=sale_id).all()
    assert len(clawback_records) == 4 # One clawback per original commission

    # Check clawback amounts negate original commissions
    total_clawback = sum(c.amount for c in clawback_records)
    expected_total_commission = (expected_fyc + expected_tl_override +
                                 expected_mgr_override + expected_dir_override)
    assert total_clawback == pytest.approx(-expected_total_commission)

    # Check individual clawback records link correctly
    for commission in initial_commissions:
        clawback = next((c for c in clawback_records if c.original_commission_id == commission.id), None)
        assert clawback is not None
        assert clawback.amount == pytest.approx(-commission.amount)
        assert clawback.original_bonus_id is None # No bonus clawback yet