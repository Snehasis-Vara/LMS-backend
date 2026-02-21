#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║          📧 Gmail SMTP Configuration Setup 📧               ║"
echo "║          (Nodemailer - Works with any email!)               ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if backend/.env already exists
if [ -f backend/.env ]; then
    echo "⚠️  backend/.env file already exists!"
    read -p "Do you want to update SMTP settings? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 0
    fi
fi

echo ""
echo "📝 Please provide your Gmail credentials:"
echo ""
echo "⚠️  IMPORTANT: You need a Gmail App Password, not your regular password!"
echo "   1. Go to: https://myaccount.google.com/apppasswords"
echo "   2. Sign in to your Google Account"
echo "   3. Create an App Password for 'Mail'"
echo "   4. Copy the 16-character password"
echo ""

# Get Gmail address
read -p "Enter your Gmail address: " GMAIL_USER

# Get App Password
echo ""
echo "Enter your Gmail App Password (16 characters, spaces will be removed):"
read -s GMAIL_PASS
echo ""

# Remove spaces from password
GMAIL_PASS=$(echo "$GMAIL_PASS" | tr -d ' ')

# Validate inputs
if [ -z "$GMAIL_USER" ] || [ -z "$GMAIL_PASS" ]; then
    echo "❌ Error: Email or password cannot be empty!"
    exit 1
fi

# Update backend/.env file
if [ -f backend/.env ]; then
    # Update existing file
    sed -i "s|SMTP_HOST=.*|SMTP_HOST=smtp.gmail.com|" backend/.env
    sed -i "s|SMTP_PORT=.*|SMTP_PORT=587|" backend/.env
    sed -i "s|SMTP_USER=.*|SMTP_USER=$GMAIL_USER|" backend/.env
    sed -i "s|SMTP_PASS=.*|SMTP_PASS=$GMAIL_PASS|" backend/.env
    sed -i "s|SMTP_FROM_EMAIL=.*|SMTP_FROM_EMAIL=\"Library Management System\" <$GMAIL_USER>|" backend/.env
else
    # Create new file
    cat > backend/.env << EOF
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lms?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000

# SMTP Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=$GMAIL_USER
SMTP_PASS=$GMAIL_PASS
SMTP_FROM_EMAIL="Library Management System" <$GMAIL_USER>
EOF
fi

echo ""
echo "✅ backend/.env file updated successfully!"
echo ""
echo "📧 Configuration:"
echo "   SMTP Host: smtp.gmail.com"
echo "   SMTP Port: 587 (TLS)"
echo "   SMTP User: $GMAIL_USER"
echo "   SMTP Pass: ****************"
echo ""

# Update docker-compose.yml
echo "🔄 Updating docker-compose.yml..."
sed -i "s|SMTP_USER:.*|SMTP_USER: $GMAIL_USER|" docker-compose.yml
sed -i "s|SMTP_PASS:.*|SMTP_PASS: $GMAIL_PASS|" docker-compose.yml
sed -i "s|SMTP_FROM_EMAIL:.*|SMTP_FROM_EMAIL: '\"Library Management System\" <$GMAIL_USER>'|" docker-compose.yml

# Restart backend if running
if docker-compose ps | grep -q "lms-backend.*Up"; then
    echo "🔄 Restarting backend to apply changes..."
    docker-compose restart backend
    echo ""
    echo "⏳ Waiting for backend to be ready..."
    sleep 10
    echo ""
    echo "✅ Backend restarted successfully!"
else
    echo "⚠️  Backend is not running. Start it with: docker-compose up -d"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Gmail SMTP is now configured with Nodemailer!"
echo ""
echo "🧪 Test the feature:"
echo "   1. Open: http://localhost:3001/forgot-password"
echo "   2. Enter any registered email (e.g., admin@lms.com)"
echo "   3. Check your email inbox for OTP"
echo ""
echo "📧 Real emails will now be sent to ANY email address!"
echo "   (No domain verification needed with SMTP!)"
echo ""
