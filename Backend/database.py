import sqlite3
import json
from datetime import datetime
from encryption import app_encryption

class Database:
    def __init__(self, db_path='app.db'):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_database(self):
        """Initialize database tables"""
        conn = self.get_connection()
        try:
            # Users table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                    avatar TEXT,
                    role TEXT DEFAULT 'user',
                    is_verified INTEGER DEFAULT 0,
                    last_login TIMESTAMP,
                    preferences TEXT DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Posts table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS posts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    author_id INTEGER NOT NULL,
                    tags TEXT DEFAULT '[]',
                    is_published INTEGER DEFAULT 0,
                    view_count INTEGER DEFAULT 0,
                    likes TEXT DEFAULT '[]',
                    metadata TEXT DEFAULT '{}',
                    slug TEXT UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (author_id) REFERENCES users (id)
                )
            ''')
            
            # Messages table (encrypted)
            conn.execute('''
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    room_id TEXT NOT NULL,
                    sender_id INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    message_type TEXT DEFAULT 'text',
                    is_encrypted INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (sender_id) REFERENCES users (id)
                )
            ''')
            
            # Contact submissions
            conn.execute('''
                CREATE TABLE IF NOT EXISTS contact_submissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    message TEXT NOT NULL,
                    is_read INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
        finally:
            conn.close()
    
    # User methods
    def create_user(self, user_data):
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO users (email, password_hash, first_name, last_name, preferences)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                user_data['email'],
                user_data['password_hash'],
                user_data['first_name'],
                user_data['last_name'],
                json.dumps(user_data.get('preferences', {}))
            ))
            user_id = cursor.lastrowid
            conn.commit()
            return user_id
        finally:
            conn.close()
    
    def get_user_by_email(self, email):
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
    
    def get_user_by_id(self, user_id):
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
    
    def update_user_last_login(self, user_id):
        conn = self.get_connection()
        try:
            conn.execute(
                'UPDATE users SET last_login = ? WHERE id = ?',
                (datetime.now(), user_id)
            )
            conn.commit()
        finally:
            conn.close()
    
    # Post methods
    def create_post(self, post_data):
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO posts (title, content, author_id, tags, slug, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                post_data['title'],
                post_data['content'],
                post_data['author_id'],
                json.dumps(post_data.get('tags', [])),
                post_data['slug'],
                json.dumps(post_data.get('metadata', {}))
            ))
            post_id = cursor.lastrowid
            conn.commit()
            return post_id
        finally:
            conn.close()
    
    def get_posts(self, limit=10, offset=0):
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT p.*, u.first_name, u.last_name, u.avatar 
                FROM posts p 
                JOIN users u ON p.author_id = u.id 
                WHERE p.is_published = 1 
                ORDER BY p.created_at DESC 
                LIMIT ? OFFSET ?
            ''', (limit, offset))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()
    
    # Message methods (with encryption)
    def save_message(self, message_data):
        conn = self.get_connection()
        try:
            # Encrypt message content
            encrypted_content = app_encryption.encrypt(message_data['content'])
            
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO messages (room_id, sender_id, content, message_type, is_encrypted)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                message_data['room_id'],
                message_data['sender_id'],
                encrypted_content,
                message_data.get('message_type', 'text'),
                1  # Mark as encrypted
            ))
            message_id = cursor.lastrowid
            conn.commit()
            return message_id
        finally:
            conn.close()
    
    def get_messages(self, room_id, limit=50):
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT m.*, u.first_name, u.last_name, u.avatar 
                FROM messages m 
                JOIN users u ON m.sender_id = u.id 
                WHERE m.room_id = ? 
                ORDER BY m.created_at DESC 
                LIMIT ?
            ''', (room_id, limit))
            rows = cursor.fetchall()
            
            messages = []
            for row in dict_rows:
                message = dict(row)
                # Decrypt message content
                if message['is_encrypted']:
                    try:
                        message['content'] = app_encryption.decrypt(message['content'])
                    except:
                        message['content'] = '[Encrypted message]'
                messages.append(message)
            
            return messages[::-1]  # Reverse to get chronological order
        finally:
            conn.close()
    
    # Contact methods
    def save_contact_submission(self, contact_data):
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO contact_submissions (name, email, subject, message)
                VALUES (?, ?, ?, ?)
            ''', (
                contact_data['name'],
                contact_data['email'],
                contact_data['subject'],
                contact_data['message']
            ))
            submission_id = cursor.lastrowid
            conn.commit()
            return submission_id
        finally:
            conn.close()

# Global database instance
db = Database()