#!/bin/bash

# RealPrice Chatbot Testing Script
# This script helps you test the chatbot endpoints

echo "==========================================="
echo "RealPrice AI Chatbot Test Suite"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3000/api/v1"
JWT_TOKEN="${JWT_TOKEN:-}"

# Check if backend is running
echo -e "${YELLOW}[1/4] Checking if backend is running...${NC}"
if ! curl -s "$API_URL/lands" > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend not accessible at $API_URL${NC}"
    echo "Please start the backend server:"
    echo "  cd backend && npm start"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Check if OPENAI_API_KEY is set
echo -e "${YELLOW}[2/4] Checking OpenAI configuration...${NC}"
# We can't directly check env vars from bash, but we'll test the endpoint
echo -e "${GREEN}✅ Will verify when making API call${NC}"
echo ""

# Test 1: Chat endpoint without auth (should fail with 401)
echo -e "${YELLOW}[3/4] Testing chat endpoint...${NC}"
echo "Sending test message to /chat..."

RESPONSE=$(curl -s -X POST "$API_URL/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"message":"Giá bất động sản ở Bình Thạnh bao nhiêu?","context":{}}')

echo "Response: $RESPONSE"
echo ""

# Check if response contains success or error
if echo "$RESPONSE" | grep -q '"success"'; then
    if echo "$RESPONSE" | grep -q '"response"'; then
        echo -e "${GREEN}✅ Chat endpoint working!${NC}"
        echo "Sample response received from GPT-3.5-turbo"
    else
        echo -e "${RED}❌ Chat endpoint returned error${NC}"
        echo "Check if OPENAI_API_KEY is set in backend/.env"
    fi
elif echo "$RESPONSE" | grep -q "401\|Unauthorized"; then
    echo -e "${RED}❌ Authentication failed${NC}"
    echo "You need to provide a valid JWT token:"
    echo "  JWT_TOKEN=your_token ./test-chatbot.sh"
else
    echo -e "${RED}❌ Unexpected response${NC}"
fi

echo ""
echo -e "${YELLOW}[4/4] Testing location detection...${NC}"
echo "Sending location-based message..."

LOCATION_RESPONSE=$(curl -s -X POST "$API_URL/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"message":"Tìm nhà ở Bình Thạnh","context":{}}')

echo "Response: $LOCATION_RESPONSE"

if echo "$LOCATION_RESPONSE" | grep -q '"action"'; then
    echo -e "${GREEN}✅ Location detection working!${NC}"
else
    echo -e "${YELLOW}⚠️  No action detected (may be expected)${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Test suite completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Look for the chat button (💬) at bottom-right"
echo "3. Send a test message"
echo "4. Verify the response and map movement"
echo ""
echo "For more details, see CHATBOT_SETUP.md"
