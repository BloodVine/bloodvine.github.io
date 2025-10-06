from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
import os
import json
from datetime import datetime

from jwt_config import JWTConfig
from auth_service import AuthService
from database import db

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(JWTConfig)

# Initialize extensions
CORS(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize services
auth_service = AuthService(app.config['JWT_SECRET_KEY'])

# Serve static files
@app.route('/')
def serve_frontend():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../frontend', path)

# JWT callbacks
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'error': 'Token has expired',
        'message': 'Please log in again'
    }), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({
        'error': 'Invalid token',
        'message': 'Please log in again'
    }), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({
        'error': 'Authorization required',
        'message': 'Please include your access token'
    }), 401

# Authentication routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        user_id, error = auth_service.register_user(data)
        if error:
            return jsonify({'error': error}), 400
        
        # Generate tokens
        access_token = create_access_token(identity={'user_id': user_id})
        user = auth_service.get_user_profile(user_id)
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user
        }), 201
        
    except Exception as e:
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        user, error = auth_service.authenticate_user(data['email'], data['password'])
        if error:
            return jsonify({'error': error}), 401
        
        # Generate token
        access_token = create_access_token(identity={'user_id': user['id']})
        user_profile = auth_service.get_user_profile(user['id'])
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user_profile
        })
        
    except Exception as e:
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        current_user = get_jwt_identity()
        user_id = current_user['user_id']
        
        user = auth_service.get_user_profile(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user})
        
    except Exception as e:
        return jsonify({'error': 'Failed to get profile'}), 500

@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'message': 'Logout successful'})

# Posts routes
@app.route('/api/posts', methods=['GET'])
def get_posts():
    try:
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        posts = db.get_posts(limit=limit, offset=offset)
        
        # Parse JSON fields
        for post in posts:
            if post.get('tags'):
                post['tags'] = json.loads(post['tags'])
            if post.get('metadata'):
                post['metadata'] = json.loads(post['metadata'])
            if post.get('likes'):
                post['likes'] = json.loads(post['likes'])
        
        return jsonify({'posts': posts})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts', methods=['POST'])
@jwt_required()
def create_post():
    try:
        current_user = get_jwt_identity()
        user_id = current_user['user_id']
        data = request.get_json()
        
        if not data.get('title') or not data.get('content'):
            return jsonify({'error': 'Title and content are required'}), 400
        
        # Generate slug from title
        slug = data['title'].lower().replace(' ', '-').replace('/', '-')
        
        post_data = {
            'title': data['title'],
            'content': data['content'],
            'author_id': user_id,
            'tags': data.get('tags', []),
            'slug': slug,
            'metadata': {
                'word_count': len(data['content'].split()),
                'read_time': max(1, len(data['content'].split()) // 200)
            }
        }
        
        post_id = db.create_post(post_data)
        
        return jsonify({
            'message': 'Post created successfully',
            'post_id': post_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Contact routes
@app.route('/api/contact', methods=['POST'])
def submit_contact():
    try:
        data = request.get_json()
        
        required_fields = ['name', 'email', 'subject', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Save contact submission
        submission_id = db.save_contact_submission(data)
        
        # Log the submission
        print(f"New contact submission from {data['name']} ({data['email']}): {data['subject']}")
        
        return jsonify({
            'message': 'Contact form submitted successfully',
            'submission_id': submission_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Socket.IO events
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join_room')
def handle_join_room(data):
    room = data.get('room')
    if room:
        join_room(room)
        emit('user_joined', {'room': room, 'message': 'A user joined the room'}, room=room)

@socketio.on('leave_room')
def handle_leave_room(data):
    room = data.get('room')
    if room:
        leave_room(room)
        emit('user_left', {'room': room, 'message': 'A user left the room'}, room=room)

@socketio.on('send_message')
def handle_send_message(data):
    try:
        room = data.get('room')
        content = data.get('content')
        user_id = data.get('user_id')
        
        if not all([room, content, user_id]):
            return
        
        # Get sender info
        user = auth_service.get_user_profile(user_id)
        
        # Broadcast message to room
        emit('new_message', {
            'id': datetime.now().timestamp(),
            'room': room,
            'content': content,
            'sender': {
                'id': user_id,
                'name': f"{user['first_name']} {user['last_name']}",
                'avatar': user.get('avatar')
            },
            'timestamp': datetime.now().isoformat()
        }, room=room)
        
    except Exception as e:
        print(f"Error sending message: {e}")

@socketio.on('typing_start')
def handle_typing_start(data):
    room = data.get('room')
    user_id = data.get('user_id')
    if room and user_id:
        user = auth_service.get_user_profile(user_id)
        emit('user_typing', {
            'user_id': user_id,
            'user_name': f"{user['first_name']} {user['last_name']}"
        }, room=room)

@socketio.on('typing_stop')
def handle_typing_stop(data):
    room = data.get('room')
    user_id = data.get('user_id')
    if room and user_id:
        emit('user_stop_typing', {'user_id': user_id}, room=room)

if __name__ == '__main__':
    print("Starting Complex App Server...")
    print("Backend API: http://localhost:5000")
    print("Frontend: http://localhost:8000")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)