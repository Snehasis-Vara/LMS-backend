#!/bin/bash

# Library Management System - Stop Script

echo "🛑 Stopping Library Management System..."

# Kill by PID files if they exist
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        echo "✅ Backend stopped (PID: $BACKEND_PID)"
    fi
    rm -f .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        echo "✅ Frontend stopped (PID: $FRONTEND_PID)"
    fi
    rm -f .frontend.pid
fi

# Fallback: kill by process name
pkill -f 'nest start' 2>/dev/null && echo "✅ Nest processes stopped"
pkill -f 'next dev' 2>/dev/null && echo "✅ Next.js processes stopped"

echo "✅ All servers stopped"
