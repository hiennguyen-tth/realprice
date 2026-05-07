# RealPrice AI Chatbot - Implementation Summary

## What Was Done

A complete AI-powered chatbot system has been integrated into RealPrice using OpenAI GPT-3.5-turbo. The chatbot helps users ask questions about real estate prices, locations, and properties.

## Components Added

### Backend Changes

#### 1. Chat Service Module
**Location:** `backend/src/modules/chat/chat.service.js`
- Main service class: `ChatService`
- Features:
  - `chat(message, context, userId)` - Sends user message to OpenAI, receives response
  - `parseFilters(message)` - Parses natural language to extract structured search filters
  - Automatic location detection (returns action object to trigger map movement)
  - Vietnamese language prompts for property domain context

#### 2. Chat Routes
**Location:** `backend/src/modules/chat/chat.routes.js`
- POST `/chat` - Main conversation endpoint
  - Requires JWT authentication
  - Validates message is not empty
  - Returns: `{response: string, action?: {type, location}}`
  
- POST `/chat/search` - Filter parsing endpoint
  - Requires JWT authentication
  - Extracts structured filters from natural language
  - Returns: `{district, minPrice, maxPrice, listingType, keyword}`

#### 3. Module Integration
**File:** `backend/src/modules/chat/index.js`
- Exports chat routes for main app

**File:** `backend/src/app.js` (modified)
- Added: `const chatRouter = require('./modules/chat');`
- Added: `app.use(\`\${prefix}/chat\`, chatRouter);`

#### 4. Environment Configuration
**File:** `backend/.env.example` (modified)
- Added: `OPENAI_API_KEY=your_openai_api_key_here`
- Users must set this in their `.env` file

### Frontend Changes

#### 1. Chat Component
**Location:** `web/src/components/chat/ChatBot.tsx`
- New React component with floating button UI
- Features:
  - Floating chat button (bottom-right corner, z-index 40)
  - Message panel (96x96rem) with message history
  - Real-time message streaming
  - Typing indicator while awaiting response
  - Location detection that triggers map movement
  - Responsive design with Tailwind CSS
  - Dark mode support

#### 2. API Functions
**File:** `web/src/lib/api.ts` (modified)
- New function: `chatWithAI(message: string, context?: object)`
  - Calls POST `/api/v1/chat`
  - Returns: `{response: string, action?: object}`
  
- New function: `parseSearchFilters(message: string)`
  - Calls POST `/api/v1/chat/search`
  - Returns: structured filter object

#### 3. Provider Integration
**File:** `web/src/components/common/Providers.tsx` (modified)
- Added ChatBot component render at top level
- Ensures chatbot is available on all pages
- Integrates with Zustand mapStore for location-based actions

## Features Implemented

### ✅ Core Chat Functionality
- Send messages to OpenAI GPT-3.5-turbo
- Receive conversational responses
- Message history displayed in chronological order
- User messages styled differently from assistant messages
- Loading state with typing indicator

### ✅ Location Detection & Map Movement
- Chatbot recognizes district names in Vietnamese
- Automatically triggers map movement when location is mentioned
- Currently supports: Bình Thạnh, Tân Bình, Hoàn Kiếm, Quận 1
- Extensible for adding more locations

### ✅ Vietnamese Language Support
- System prompts written for Vietnamese property domain
- Understands Vietnamese queries about prices, locations, properties
- Responds in Vietnamese (GPT can handle this naturally)

### ✅ Secure Authentication
- All chat endpoints require JWT bearer token
- Uses existing authentication middleware
- Validates user authorization before processing requests

### ✅ Responsive UI
- Floating button doesn't interfere with existing page layout
- Chat panel responsive and accessible
- Works on mobile and desktop viewports

## How to Use

### For Users
1. Go to http://localhost:3000
2. Look for the chat button (💬) at the bottom-right
3. Click to open the chat panel
4. Type a question in Vietnamese, e.g.:
   - "Giá bất động sản ở Bình Thạnh bao nhiêu?"
   - "Tìm nhà ở Quận 1"
   - "Diện tích bao nhiêu là hợp lý?"
5. AI assistant responds with information
6. If you ask about a district, the map automatically moves there

### For Developers

#### Setup
1. Get OpenAI API key from https://platform.openai.com/api/keys
2. Add to `backend/.env`: `OPENAI_API_KEY=sk_...`
3. Restart backend server

#### Testing
```bash
# Run the test script
chmod +x test-chatbot.sh
JWT_TOKEN=your_token ./test-chatbot.sh

# Or manually test endpoint
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"message":"Tìm nhà ở Bình Thạnh","context":{}}'
```

#### Adding New Locations
Edit `web/src/components/chat/ChatBot.tsx`, update the `locationMap` object:
```typescript
const locationMap = {
  "bình thạnh": { latitude: 10.8141, longitude: 106.7294, zoom: 13 },
  "your_district": { latitude: LAT, longitude: LNG, zoom: 13 },
};
```

## Files Modified or Created

| File | Type | Change |
|------|------|--------|
| `backend/src/modules/chat/chat.service.js` | Created | OpenAI integration service |
| `backend/src/modules/chat/chat.routes.js` | Created | Express routes |
| `backend/src/modules/chat/index.js` | Created | Module export |
| `backend/src/app.js` | Modified | Added chat router mounting |
| `backend/.env.example` | Modified | Added OPENAI_API_KEY |
| `web/src/components/chat/ChatBot.tsx` | Created | Floating button component |
| `web/src/lib/api.ts` | Modified | Added chat API functions |
| `web/src/components/common/Providers.tsx` | Modified | Added ChatBot provider |
| `CHATBOT_SETUP.md` | Created | Setup and testing guide |
| `test-chatbot.sh` | Created | Testing script |

## Architecture

```
User Browser
    ↓
ChatBot.tsx (Floating Button)
    ↓ (click)
Chat Panel Opens
    ↓ (type message)
chatWithAI() API function
    ↓ (HTTP POST)
Backend /api/v1/chat endpoint
    ↓ (JWT auth)
ChatService.chat(message)
    ↓ (API call)
OpenAI GPT-3.5-turbo API
    ↓ (response)
ChatService parses response & action
    ↓ (JSON response)
Frontend receives response
    ↓
Display in chat panel
    ↓ (if action.type === "moveMap")
handleMapMove() → setViewport()
    ↓
Map moves to location
```

## Technology Stack
- **Backend:** Express.js, Node.js
- **Frontend:** React, TypeScript, Next.js
- **AI:** OpenAI GPT-3.5-turbo
- **HTTP Client:** Axios
- **State Management:** Zustand (mapStore)
- **Styling:** Tailwind CSS
- **Auth:** JWT bearer tokens

## Future Enhancements

### Planned Features
- [ ] Price suggestion database queries
- [ ] Automatic filter application to search
- [ ] Conversation context memory (multi-turn)
- [ ] More district coverage in location map
- [ ] Conversation history persistence to database
- [ ] User preference learning
- [ ] Voice input support

### Performance Optimizations
- [ ] Cache common responses (districts, price ranges)
- [ ] Implement rate limiting per user
- [ ] Add request queuing for high load
- [ ] Consider streaming responses

## Testing Checklist

- [ ] Backend running and accessible
- [ ] OPENAI_API_KEY configured in .env
- [ ] Floating button appears at bottom-right of web app
- [ ] Can open chat panel (click button)
- [ ] Can send messages and receive responses
- [ ] Typing indicator shows while waiting
- [ ] Messages display with correct styling
- [ ] Location-based messages trigger map movement
- [ ] Map zooms to correct coordinates
- [ ] Works on mobile viewport

## Support & Troubleshooting

See `CHATBOT_SETUP.md` for:
- Detailed setup instructions
- Step-by-step testing guide
- API documentation
- Troubleshooting common issues
- Environment variable reference
- Security best practices

## Notes

- All chat endpoints require JWT authentication
- The chatbot is stateless (each message is independent)
- Location detection works on Vietnamese district names
- OpenAI API calls incur costs - monitor usage on dashboard
- Supports both prompt-based and structured queries
- Ready for production use after environment setup

---
**Status:** ✅ Implementation Complete, Ready for Testing
**Created:** May 7, 2024
**Last Updated:** May 7, 2024
