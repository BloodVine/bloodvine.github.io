import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from database import db

class AuthService:
    def __init__(self, secret_key):
        self.secret_key = secret_key
    
    def generate_token(self, user_id, expires_days=7):
        """Generate JWT token"""
        payload = {
            'user_id': user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=expires_days),
            'iat': datetime.datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm='HS256')
    
    def verify_token(self, token):
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            return payload['user_id']
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def register_user(self, user_data):
        """Register new user"""
        # Check if user already exists
        existing_user = db.get_user_by_email(user_data['email'])
        if existing_user:
            return None, "User already exists"
        
        # Hash password
        password_hash = generate_password_hash(user_data['password'])
        
        # Create user
        user_id = db.create_user({
            'email': user_data['email'],
            'password_hash': password_hash,
            'first_name': user_data['first_name'],
            'last_name': user_data['last_name']
        })
        
        return user_id, None
    
    def authenticate_user(self, email, password):
        """Authenticate user"""
        user = db.get_user_by_email(email)
        if not user:
            return None, "User not found"
        
        if not check_password_hash(user['password_hash'], password):
            return None, "Invalid password"
        
        # Update last login
        db.update_user_last_login(user['id'])
        
        return user, None
    
    def get_user_profile(self, user_id):
        """Get user profile without sensitive data"""
        user = db.get_user_by_id(user_id)
        if not user:
            return None
        
        # Remove sensitive data
        user.pop('password_hash', None)
        if 'preferences' in user and user['preferences']:
            user['preferences'] = user['preferences'] if isinstance(user['preferences'], dict) else {}
        
        return user