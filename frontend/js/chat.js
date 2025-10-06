// Real-time chat functionality
class ChatManager {
    constructor() {
        this.app = window.ComplexApp;
        this.socket = null;
        this.currentRoom = null;
        this.typingTimeout = null;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupSocket();
        this.setupEventListeners();
        this.loadRooms();
    }

    async checkAuth() {
        if (!this.app.user || !this.app.token) {
            window.location.href = 'login.html';
            throw new Error('Not authenticated');
        }
    }

    setupSocket() {
        // Connect to Socket.IO server
        this.socket = io('http://localhost:5000');

        this.socket.on('connect', () => {
            console.log('Connected to chat server');
            this.app.showAlert('Connected to chat', 'success');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from chat server');
            this.app.showAlert('Disconnected from chat', 'error');
        });

        this.socket.on('new_message', (data) => {
            this.displayMessage(data);
        });

        this.socket.on('user_typing', (data) => {
            this.showTypingIndicator(data);
        });

        this.socket.on('user_stop_typing', (data) => {
            this.hideTypingIndicator(data.user_id);
        });

        this.socket.on('user_joined', (data) => {
            this.app.showAlert(`User joined the room`, 'info');
        });

        this.socket.on('user_left', (data) => {
            this.app.showAlert(`User left the room`, 'info');
        });
    }

    setupEventListeners() {
        const messageForm = document.getElementById('messageForm');
        const messageInput = document.getElementById('messageInput');
        const roomSelect = document.getElementById('roomSelect');

        if (messageForm) {
            messageForm.addEventListener('submit', (e) => this.sendMessage(e));
        }

        if (messageInput) {
            messageInput.addEventListener('input', () => this.handleTyping());
        }

        if (roomSelect) {
            roomSelect.addEventListener('change', (e) => this.joinRoom(e.target.value));
        }
    }

    async loadRooms() {
        // Predefined chat rooms
        const rooms = ['general', 'random', 'help', 'development'];
        const roomSelect = document.getElementById('roomSelect');
        
        if (roomSelect) {
            roomSelect.innerHTML = rooms.map(room => 
                `<option value="${room}">${room.charAt(0).toUpperCase() + room.slice(1)}</option>`
            ).join('');
            
            // Join first room by default
            if (rooms.length > 0) {
                this.joinRoom(rooms[0]);
            }
        }
    }

    joinRoom(roomId) {
        if (this.currentRoom) {
            // Leave current room
            this.socket.emit('leave_room', { room: this.currentRoom });
        }

        this.currentRoom = roomId;
        this.socket.emit('join_room', { room: roomId });
        
        // Clear messages and show welcome message
        this.clearMessages();
        this.displaySystemMessage(`Welcome to ${roomId} room! Start chatting...`);
        
        this.app.showAlert(`Joined room: ${roomId}`, 'success');
    }

    async sendMessage(e) {
        e.preventDefault();
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();

        if (!message || !this.currentRoom) return;

        try {
            this.socket.emit('send_message', {
                room: this.currentRoom,
                content: message,
                user_id: this.app.user.id
            });

            messageInput.value = '';
            this.stopTyping();

        } catch (error) {
            this.app.showAlert('Failed to send message', 'error');
        }
    }

    displayMessage(message) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${message.sender.name}</span>
                <span class="message-time">${this.app.formatDate(message.timestamp)}</span>
            </div>
            <div class="message-content">${this.escapeHtml(message.content)}</div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    displaySystemMessage(message) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.style.backgroundColor = '#f0f9ff';
        messageElement.innerHTML = `
            <div class="message-content" style="text-align: center; color: #64748b; font-style: italic;">
                ${this.escapeHtml(message)}
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    handleTyping() {
        if (!this.currentRoom) return;

        // Emit typing start
        this.socket.emit('typing_start', {
            room: this.currentRoom,
            user_id: this.app.user.id
        });

        // Clear existing timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        // Set timeout to stop typing indicator
        this.typingTimeout = setTimeout(() => {
            this.stopTyping();
        }, 1000);
    }

    stopTyping() {
        if (!this.currentRoom) return;

        this.socket.emit('typing_stop', {
            room: this.currentRoom,
            user_id: this.app.user.id
        });

        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }
    }

    showTypingIndicator(data) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        // Remove existing typing indicator
        this.hideTypingIndicator(data.user_id);

        const typingElement = document.createElement('div');
        typingElement.className = 'typing-indicator';
        typingElement.id = `typing-${data.user_id}`;
        typingElement.innerHTML = `
            <div style="color: #64748b; font-style: italic; padding: 0.5rem;">
                ${data.user_name} is typing...
            </div>
        `;

        messagesContainer.appendChild(typingElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator(userId) {
        const existingIndicator = document.getElementById(`typing-${userId}`);
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }

    clearMessages() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentContentLoaded', () => {
    new ChatManager();
});