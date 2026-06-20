#!/bin/bash
set -e

echo "Setting up VulnForge project..."

# Install CLI dependencies
echo "Installing CLI dependencies..."
cd cli
npm install
cd ..

# Install Backend dependencies
echo "Installing Backend dependencies..."
cd backend
npm install
cd ..

# Install Scanner dependencies
echo "Installing Scanner dependencies..."
cd scanner
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    # Create a basic requirements.txt if it doesn't exist
    echo "requests==2.31.0" > requirements.txt
    echo "beautifulsoup4==4.12.2" >> requirements.txt
    pip install -r requirements.txt
fi
deactivate
cd ..

echo "Setup complete!"
