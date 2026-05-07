# Chatbot Setup Guide

## Overview
RealPrice AI Chatbot is now fully integrated with OpenAI GPT-3.5-turbo. The chatbot provides:
- Real estate price and location Q&A
- Automatic map movement to requested locations
- Vietnamese language support
- Floating button UI (bottom-right)

## Prerequisites
- OpenAI API account (https://platform.openai.com)
- Active OpenAI API key with GPT-3.5-turbo access
- Backend server running on localhost:3000

## Setup Instructions

### 1. Get OpenAI API Key
1. Go to https://platform.openai.com/api/keys
2. Log in with your OpenAI account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Store securely - never commit to git

### 2. Configure Backend Environment
1. Open `backend/.env`:
   ```bash
   nano backend/.env
   ```

2. Add the OpenAI API key:
   ```env
   OPENAI_API_KEY=sk_your_actual_key_here
   ```

3. Save and exit (Ctrl+X, Y, Enter)

### 3. Verify Backend Routes
The following routes are now available:
- **POST** `/api/v1/chat` - Send message and get AI response
  ```bash
  curl -X POST http://localhost:3000/api/v1/chat \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"message":"Giá bất động sản ở Bình Thạnh bao nhiêu?"}'
  ```

- **POST** `/api/v1/chat/search` - Parse natural language filters
  ```bash
  curl -X POST http://localhost:3000/api/v1/chat/search \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"message":"Tôi muốn tìm nhà ở Bình Thạnh dưới 100 triệu"}'
  ```

### 4. Verify Frontend Integration
The chatbot component is automatically integrated into the web app. Check:
- File: [web/src/components/chat/ChatBot.tsx](web/src/components/chat/ChatBot.tsx) - Floating button component
- File: [web/src/components/common/Providers.tsx](web/src/components/common/Providers.tsx) - Provider integration
- File: [web/src/lib/api.ts](web/src/lib/api.ts) - API functions for chat

## Testing

### Test 1: Basic Chat
1. Open the web app at localhost:3000
2. Look for floating button at bottom-right (chat icon)
3. Click the button to open the chat panel
4. Send message: `"Giá bất động sản ở Quận 1 bao nhiêu?"`
5. Verify assistant responds with price information

### Test 2: Location Detection
1. Click the floating button to open chat
2. Send message: `"Tìm nhà ở Bình Thạnh"`
3. Verify:
   - Assistant responds with information
   - Map automatically moves to Bình Thạnh coordinates
   - Zoom level adjusts to 13

### Test 3: Multiple Locations
Test these district names (should trigger map movement):
- `Bình Thạnh` → lat: 10.8141, lng: 106.7294, zoom: 13
- `Tân Bình` → lat: 10.7968, lng: 106.6461, zoom: 13
- `Hoàn Kiếm` → lat: 21.0285, lng: 105.8542, zoom: 13
- `Quận 1` → lat: 10.7769, lng: 106.6961, zoom: 13

### Test 4: Error Handling
1. Send empty message → should show error
2. Disconnect internet → should show connection error gracefully
3. Missing OPENAI_API_KEY → should log error and show user-friendly message

## Architecture

### Backend Flow
```
POST /chat
  ↓
authenticate middleware (checks JWT)
  ↓
ChatService.chat(message, context, userId)
  ↓
OpenAI API (gpt-3.5-turbo)
  ↓
Response with optional action (moveMap, etc.)
```

### Frontend Flow
```
User types message
  ↓
handleSend() → chatMutation.mutate()
  ↓
chatWithAI(message) → POST /api/v1/chat
  ↓
Display in chat panel
  ↓
If action.type === "moveMap" → handleMapMove()
  ↓
setViewport() → Map moves to location
```

### Files Modified/Created
**Backend:**
- `backend/src/modules/chat/chat.service.js` - ChatService class with OpenAI integration
- `backend/src/modules/chat/chat.routes.js` - Express routes
- `backend/src/modules/chat/index.js` - Module export
- `backend/src/app.js` - Added chat router mounting
- `backend/.env.example` - Added OPENAI_API_KEY

**Frontend:**
- `web/src/components/chat/ChatBot.tsx` - New floating button component
- `web/src/lib/api.ts` - New chatWithAI() and parseSearchFilters() functions
- `web/src/components/common/Providers.tsx` - Added ChatBot provider

## Features Implemented

### Core Chat (✅ Complete)
- Send/receive messages with OpenAI GPT-3.5-turbo
- Vietnamese language prompt for property domain
- Message history in chat panel
- Typing indicator while waiting for response

### Location Detection (✅ Complete)
- Automatic district name parsing
- Map movement on location requests
- Supported districts: Bình Thạnh, Tân Bình, Hoàn Kiếm, Quận 1
- Extensible locationMap for adding more districts

### UI Components (✅ Complete)
- Floating button (bottom-right, z-index 40)
- Chat panel with message history
- Input field with Send button
- Responsive design (96x96rem panel)
- Message role-based styling (user vs assistant)

### Future Enhancements (Not Yet Implemented)
- Price suggestion queries from database
- Filter auto-application to search
- Multi-turn conversation context
- More district coverage in location map
- Conversation history persistence

## Troubleshooting

### Issue: "Chat button doesn't appear"
- **Solution**: Check browser console for errors, verify Providers.tsx includes ChatBot

### Issue: "OPENAI_API_KEY undefined"
- **Solution**: 
  ```bash
  # Check .env file
  grep OPENAI_API_KEY backend/.env
  
  # If missing, add it:
  echo "OPENAI_API_KEY=your_key_here" >> backend/.env
  ```

### Issue: "401 Unauthorized on /chat endpoint"
- **Solution**: Ensure you have valid JWT token in Authorization header

### Issue: "API timeout or no response"
- **Solution**: 
  1. Check OpenAI API status: https://status.openai.com/
  2. Verify API key is valid and has credits
  3. Check network connectivity

### Issue: "Map doesn't move on location message"
- **Solution**: 
  1. Check if location name is in locationMap (ChatBot.tsx line ~97)
  2. Add new locations to locationMap:
     ```typescript
     const locationMap = {
       "bình thạnh": { latitude: 10.8141, longitude: 106.7294, zoom: 13 },
       "your_district": { latitude: LAT, longitude: LNG, zoom: 13 },
     };
     ```

## API Documentation

### POST /api/v1/chat
Send a message to the AI assistant.

**Request:**
```json
{
  "message": "Giá bất động sản ở Bình Thạnh bao nhiêu?",
  "context": {}
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "response": "Giá bất động sản ở Bình Thạnh dao động từ... chi tiết: ...",
    "action": {
      "type": "moveMap",
      "location": "bình thạnh"
    }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "OPENAI_API_KEY is not configured"
}
```

### POST /api/v1/chat/search
Parse natural language to extract structured search filters.

**Request:**
```json
{
  "message": "Tôi muốn tìm nhà ở Bình Thạnh dưới 100 triệu"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "district": "Bình Thạnh",
    "minPrice": null,
    "maxPrice": 100000000,
    "listingType": "sale",
    "keyword": "nhà"
  }
}
```

## Environment Variables

| Variable | Required | Example |
|----------|----------|---------|
| OPENAI_API_KEY | Yes | sk-... |
| NODE_ENV | No | development |
| PORT | No | 3000 |
| DB_HOST | Yes | localhost |

## Security Notes
- OPENAI_API_KEY is sensitive - never commit to git
- API key should be in `.env` (not `.env.example`)
- Chat endpoint requires JWT authentication
- All messages are logged for debugging

## Support
For issues or questions:
1. Check the Troubleshooting section above
2. Review the test cases to ensure basic functionality works
3. Check backend logs for API errors
4. Verify OPENAI_API_KEY is correctly set
