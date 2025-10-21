# backend/conftest.py
import pytest
from app import app as flask_app, db as sqlalchemy_db, Agent

@pytest.fixture(scope='module')
def app():
    """Create and configure a new app instance for each test module."""
    # --- Configure for testing ---
    flask_app.config['TESTING'] = True
    flask_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:' 
    
    with flask_app.app_context():
        sqlalchemy_db.create_all()
        yield flask_app
        sqlalchemy_db.session.remove()
        sqlalchemy_db.drop_all()

@pytest.fixture(scope='module')
def client(app):
    """A test client for the app."""
    return app.test_client()

# --- THIS IS THE UPDATED FIXTURE ---
@pytest.fixture(scope='function')
def db(app):
    """
    A fixture to provide a clean database session for each test function.
    This will roll back any changes after the test is complete.
    """
    connection = sqlalchemy_db.engine.connect()
    transaction = connection.begin()
    
    # 1. Create a session bound to this transaction
    session = sqlalchemy_db.sessionmaker(bind=connection)()
    
    # 2. Save the app's default session factory
    original_session = sqlalchemy_db.session
    
    # 3. Overwrite db.session with our new transaction-bound session instance
    sqlalchemy_db.session = session

    yield sqlalchemy_db # Test runs here

    # --- Teardown ---
    # 4. Close our transaction-bound session
    session.close()
    
    # 5. Rollback the transaction (this undoes all changes)
    transaction.rollback()
    
    # 6. Close the connection
    connection.close()
    
    # 7. Restore the original session factory
    sqlalchemy_db.session = original_session