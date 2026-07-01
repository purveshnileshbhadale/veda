#!/bin/bash
# VEDA Setup Script for Linux/Mac

set -e

echo "=== VEDA Setup Script ==="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}[✓] $1 found${NC}"
        return 0
    else
        echo -e "${RED}[✗] $1 not found${NC}"
        return 1
    fi
}

echo -e "${YELLOW}Checking requirements...${NC}"
check_command docker
check_command docker-compose || check_command "docker compose"
check_command python3
check_command node
check_command npm

# Setup environment
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}[✓] .env created${NC}"
fi

# Start Docker services
echo -e "${YELLOW}Starting Docker services...${NC}"
docker-compose up -d
echo -e "${GREEN}[✓] Docker services started${NC}"

# Backend setup
echo -e "\n${YELLOW}Setting up backend...${NC}"
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend setup
echo -e "\n${YELLOW}Setting up frontend...${NC}"
cd frontend
npm install
cd ..

echo -e "\n${GREEN}=== Setup Complete! ===${NC}"
echo -e "${CYAN}Run 'docker-compose up' to start all services${NC}"
echo -e "${CYAN}Frontend: http://localhost:3000${NC}"
echo -e "${CYAN}Backend: http://localhost:8000${NC}"
echo -e "${CYAN}API Docs: http://localhost:8000/docs${NC}"
