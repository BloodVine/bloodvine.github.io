from flask import jsonify
from flask_jwt_extended import create_access_token, create_refresh_token
from werkzeug.security import generate_password_hash, check_password_hash
import re
from database import db

class AuthService:
    def __init__(self, secret_key):
        self.secret_key = secret_key
    
    def generate_tokens(self, user_id):
        """Generate access and refresh tokens"""
        identity = {
            'user_id': user_id,
            'created_at': datetime.utcnow().isoformat()
        }
        
        access_token = create_access_token(identity=identity)
        refresh_token = create_refresh_token(identity=identity)
        
        return access_token, refresh_token
    
    def register_user(self, user_data):
        """Register new user with enhanced validation"""
        from datetime import datetime
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not user_data.get(field):
                return None, f"{field.replace('_', ' ').title()} is required"
        
        # Validate email format
        if not self.validate_email(user_data['email']):
            return None, "Invalid email format"
        
        # Validate password strength
        password_error = self.validate_password(user_data['password'])
        if password_error:
            return None, password_error
        
        # Check if user already exists
        existing_user = db.get_user_by_email(user_data['email'])
        if existing_user:
            return None, "User with this email already exists"
        
        # Hash password
        password_hash = generate_password_hash(
            user_data['password'], 
            method='pbkdf2:sha256', 
            salt_length=16
        )
        
        # Create user
        user_id = db.create_user({
            'email': user_data['email'].lower().strip(),
            'password_hash': password_hash,
            'first_name': user_data['first_name'].strip(),
            'last_name': user_data['last_name'].strip(),
            'preferences': {
                'theme': 'light',
                'notifications': True,
                'language': 'en'
            }
        })
        
        if not user_id:
            return None, "Failed to create user"
        
        return user_id, None
    
    def authenticate_user(self, email, password):
        """Authenticate user with enhanced security"""
        user = db.get_user_by_email(email.lower().strip())
        if not user:
            return None, "Invalid email or password"
        
        if not check_password_hash(user['password_hash'], password):
            return None, "Invalid email or password"
        
        # Update last login
        db.update_user_last_login(user['id'])
        
        return user, None
    
    def validate_email(self, email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def validate_password(self, password):
        """Validate password strength"""
        if len(password) < 8:
            return "Password must be at least 8 characters long"
        if not any(char.isdigit() for char in password):
            return "Password must contain at least one number"
        if not any(char.isupper() for char in password):
            return "Password must contain at least one uppercase letter"
        if not any(char.islower() for char in password):
            return "Password must contain at least one lowercase letter"
        return None
    
    def get_user_profile(self, user_id):
        """Get user profile without sensitive data"""
        user = db.get_user_by_id(user_id)
        if not user:
            return None
        
        # Remove sensitive data
        user.pop('password_hash', None)
        
        # Parse preferences if it's a string
        if 'preferences' in user and user['preferences']:
            try:
                if isinstance(user['preferences'], str):
                    user['preferences'] = json.loads(user['preferences'])
            except:
                user['preferences'] = {}
        
        return user

# Import here to avoid circular imports
import json
from datetime import datetime