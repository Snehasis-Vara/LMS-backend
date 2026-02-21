#!/bin/bash

# Library Management System - Startup Script
# This script starts both backend and frontend servers

echo "🚀 Starting Library Management System..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env not found!${NC}"
    echo "Please copy backend/.env.example to backend/.env and configure it"
    exit 1
fi

# Check if Gmail SMTP is configured
if grep -q "your-email@gmail.com" backend/.env; then
    echo -e "${YELLOW}⚠️  Warning: Gmail SMTP not configured in backend/.env${NC}"
    echo "Please update SMTP_USER and SMTP_PASS in backend/.env"
    echo ""
fi

# Check if database is running
echo -e "${BLUE}🔍 Checking database connection...${NC}"
cd backend
if pnpm prisma db pull > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connected${NC}"
else
    echo -e "${RED}❌ Database not connected${NC}"
    echo "Please start your PostgreSQL database"
    exit 1
fi

# Apply migrations
echo -e "${BLUE}📦 Applying database migrations...${NC}"
pnpm prisma migrate deploy
echo -e "${GREEN}✅ Migrations applied${NC}"
echo ""

# Start backend in background
echo -e "${BLUE}🔧 Starting backend server...${NC}"
pnpm start:dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo "   Logs: backend.log"
echo ""

# Wait for backend to start
echo -e "${BLUE}⏳ Waiting for backend to be ready...${NC}"
sleep 5

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend is running on http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Backend failed to start. Check backend.log${NC}"
    exit 1
fi
echo ""

# Start frontend
cd ../frontend
echo -e "${BLUE}🎨 Starting frontend server...${NC}"
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
echo "   Logs: frontend.log"
echo ""

# Wait for frontend to start
echo -e "${BLUE}⏳ Waiting for frontend to be ready...${NC}"
sleep 5

# Check if frontend is running
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Frontend is running on http://localhost:3001${NC}"
else
    echo -e "${RED}❌ Frontend failed to start. Check frontend.log${NC}"
    kill $BACKEND_PID
    exit 1
fi
echo ""

# Success message
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Library Management System is running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📱 Frontend:${NC} http://localhost:3001"
echo -e "${BLUE}🔧 Backend:${NC}  http://localhost:3000"
echo -e "${BLUE}📊 API Docs:${NC} http://localhost:3000/api"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo -e "${YELLOW}🛑 To stop:${NC}"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   or press Ctrl+C and run: pkill -f 'nest start' && pkill -f 'next dev'"
echo ""
echo -e "${GREEN}✨ Test Forgot Password:${NC}"
echo "   1. Go to http://localhost:3001/login"
echo "   2. Click 'Forgot Password?'"
echo "   3. Enter your registered email"
echo "   4. Check your Gmail for OTP"
echo ""

# Save PIDs to file for easy cleanup
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

# Keep script running
echo -e "${BLUE}Press Ctrl+C to stop all servers${NC}"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; rm -f .backend.pid .frontend.pid; echo 'Servers stopped'; exit 0" INT

# Keep script alive
wait
