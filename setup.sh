#!/bin/bash

# Update package list and install system dependencies
apt-get update
apt-get install -y sqlite3

# Create necessary directories
mkdir -p backend/logs
mkdir -p backend/uploads

# Install Python dependencies
cd backend
pip install -r requirements.txt

# Initialize the database
python -c "
from database import db
print('Database initialized successfully')
"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file from example. Please update with your actual values."
fi

echo "Setup completed successfully!"
echo "To start the backend server: cd backend && python app.py"
echo "To serve the frontend: cd frontend && python -m http.server 8000"