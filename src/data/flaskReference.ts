export const FLASK_MODELS_PY = `"""
models.py - Complete Database Schema for Expense & Budget Tracker
Task ID: PY-FN-002 | Data Alcott Systems
Framework: Flask + Flask-SQLAlchemy + MySQL
"""
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

# 1. User Model
class User(db.Model, UserMixin):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    currency = db.Column(db.String(10), default='USD')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    expenses = db.relationship('Expense', backref='user', lazy=True, cascade="all, delete-orphan")
    incomes = db.relationship('Income', backref='user', lazy=True, cascade="all, delete-orphan")
    budgets = db.relationship('Budget', backref='user', lazy=True, cascade="all, delete-orphan")
    savings_goals = db.relationship('SavingsGoal', backref='user', lazy=True, cascade="all, delete-orphan")

# 2. Category Model
class Category(db.Model):
    __tablename__ = 'category'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    icon = db.Column(db.String(50), default='fa-tag')
    color = db.Column(db.String(7), default='#F59E0B')
    type = db.Column(db.String(20), default='expense')  # 'expense' or 'income'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    expenses = db.relationship('Expense', backref='category_ref', lazy=True)

# 3. Expense Model
class Expense(db.Model):
    __tablename__ = 'expense'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(200))
    date = db.Column(db.DateTime, default=datetime.utcnow)
    is_recurring = db.Column(db.Boolean, default=False)
    recurrence_period = db.Column(db.String(20))  # daily, weekly, monthly
    payment_method = db.Column(db.String(50))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 4. Income Model
class Income(db.Model):
    __tablename__ = 'income'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    source = db.Column(db.String(100), nullable=False)  # salary, freelance, etc.
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, default=datetime.utcnow)
    is_recurring = db.Column(db.Boolean, default=False)
    recurrence_period = db.Column(db.String(20))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 5. Budget Model
class Budget(db.Model):
    __tablename__ = 'budget'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    spent = db.Column(db.Float, default=0)
    month = db.Column(db.Integer, nullable=False)  # 1-12
    year = db.Column(db.Integer, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 6. Savings Goal Model
class SavingsGoal(db.Model):
    __tablename__ = 'savings_goal'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    target_amount = db.Column(db.Float, nullable=False)
    saved_amount = db.Column(db.Float, default=0)
    target_date = db.Column(db.Date)
    is_completed = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 7. Recurring Expense Model
class RecurringExpense(db.Model):
    __tablename__ = 'recurring_expense'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(200))
    frequency = db.Column(db.String(20))  # daily, weekly, monthly, yearly
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 8. Financial Report Model
class FinancialReport(db.Model):
    __tablename__ = 'financial_report'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    report_type = db.Column(db.String(20))  # monthly, yearly
    month = db.Column(db.Integer)
    year = db.Column(db.Integer)
    total_income = db.Column(db.Float, default=0)
    total_expenses = db.Column(db.Float, default=0)
    savings = db.Column(db.Float, default=0)
    report_data = db.Column(db.Text)  # JSON formatted data
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
`;

export const FLASK_APP_PY = `"""
app.py - Main Flask Application Entry Point
Task ID: PY-FN-002 | Data Alcott Systems
"""
import os
from flask import Flask, render_to_response, jsonify
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from models import db, User

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-12345')
    
    # MySQL Database URI configuration
    # format: mysql+pymysql://username:password@host/database_name
    db_user = os.environ.get('DB_USER', 'budget_user')
    db_pass = os.environ.get('DB_PASS', 'your_password')
    db_host = os.environ.get('DB_HOST', 'localhost')
    db_name = os.environ.get('DB_NAME', 'budget_db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{db_user}:{db_pass}@{db_host}/{db_name}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    bcrypt = Bcrypt(app)
    login_manager = LoginManager(app)
    login_manager.login_view = 'routes.login'

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    from routes import main_bp
    app.register_blueprint(main_bp)

    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
`;

export const FLASK_REQUIREMENTS = `Flask==2.3.3
Flask-SQLAlchemy==3.0.5
Flask-Login==0.6.2
Flask-Bcrypt==1.0.1
Flask-WTF==1.1.1
PyMySQL==1.1.0
cryptography==41.0.3
reportlab==4.0.4
openpyxl==3.1.2
python-dotenv==1.0.0
`;
