# Frontend Admin Inbox - Features & Components

This is the Next.js web admin dashboard for managing conversations, routing AI responses, and controlling payment workflows.

## Features

### 1. Unified Inbox
- **Conversation List**: All messages from multiple channels in one interface
- **Filtering**: By status, channel, client
- **Pagination**: Handle large conversation volumes
- **Real-time Updates**: Ready for WebSocket integration (planned)

### 2. Message Thread
- **Thread View**: All messages in chronological order
- **Sender Identification**: Client vs AI vs manual responses
- **Timestamps**: Show when each message was sent
- **Scrollable**: Navigate through long conversations

### 3. AI Response Control
- **Mode Toggle**: Manual → Draft → Auto
- **Suggestion Panel**: AI-generated reply suggestions
- **Confidence Score**: Show when AI is confident in its reply
- **One-click Approve**: Accept AI suggestion or edit first

### 4. Client Profile Sidebar
- **Contact Info**: Email, phone, linked accounts
- **Tags**: VIP, repeat customer, payment pending, etc.
- **Activity Timeline**: Recent messages, payment history
- **Quick Actions**: View history, create task, flag urgent

### 5. Reply Editor
- **Rich Text**: Format responses
- **Templates**: Quick reply templates (planned)
- **Emoji Support**: Add emotional context
- **Draft Auto-save**: Never lose work

### 6. Analytics Dashboard
- **Metrics**: Response time, AI accuracy, satisfaction
- **Charts**: Messages by channel, trends over time
- **Export**: CSV or PDF reports

### 7. Settings
- **Account**: Email, display name, timezone
- **API Keys**: For n8n and integrations
- **Integrations**: Stripe, Paystack, OpenAI config
- **Security**: Password, 2FA (planned)

## Component Structure

```
app/
├── page.tsx              # Redirect to inbox or login
├── login/
│   └── page.tsx          # Login page
├── inbox/
│   └── page.tsx          # Main inbox interface
├── analytics/
│   └── page.tsx          # Analytics dashboard
└── settings/
    └── page.tsx          # Settings page

components/
├── Layout.tsx            # Main layout with sidebar
├── ConversationList.tsx  # Conversation list
├── MessageThread.tsx     # Message thread display
├── ReplyEditor.tsx       # Reply composition area
└── ClientProfile.tsx     # Client sidebar

lib/
└── api.ts               # API client utilities
```

## Pages

### Login (`/login`)
- Simple email/ID based authentication
- Links to backend `/auth/login` endpoint
- Stores JWT in localStorage
- Demo mode for testing

**Component**: `apps/admin/src/app/login/page.tsx`

### Inbox (`/inbox`)
- Three-column layout:
  - Left: Conversation list (scrollable)
  - Center: Selected conversation + reply editor
  - Right: Client profile sidebar
- Real-time conversation fetching
- JWT auth guard

**Components**:
- `apps/admin/src/app/inbox/page.tsx`
- `apps/admin/src/components/ConversationList.tsx`
- `apps/admin/src/components/MessageThread.tsx`
- `apps/admin/src/components/ReplyEditor.tsx`
- `apps/admin/src/components/ClientProfile.tsx`

### Analytics (`/analytics`)
- Key metrics cards
- Charts (Chart.js/Recharts placeholder)
- Date range filters

**Component**: `apps/admin/src/app/analytics/page.tsx`

### Settings (`/settings`)
- Account configuration
- API key management
- Integration setup
- Danger zone logout

**Component**: `apps/admin/src/app/settings/page.tsx`

## API Integration

All API calls use auth tokens and connect to the backend at `NEXT_PUBLIC_BACKEND_URL`.

### Endpoints Called

```
GET  /messages/conversations      # List conversations
GET  /messages/conversations/:id  # Get single conversation
GET  /messages/conversations/:id/messages # Get messages
POST /auth/login                  # Authenticate
POST /ai/respond                  # Get AI suggestion
POST /payments/link               # Create payment link
```

### Client Library

Located in `apps/admin/src/lib/api.ts`:

```typescript
// Usage
const conversations = await apiClient.get('/messages/conversations?take=50');
const token = await apiClient.post('/auth/login', { userId: 'user@example.com' });
```

## Development

### Start Frontend Only
```bash
npm run dev -w apps/admin
# Available at http://localhost:3000
```

### Backend Connection
- Default: `http://localhost:3001`
- Override: `NEXT_PUBLIC_BACKEND_URL` env var

### Styling
- Tailwind CSS
- No component library (custom)
- Responsive design

## Key Features by Page

### Inbox
| Feature | Status | Notes |
|---------|--------|-------|
| Conversation list | ✅ Done | Fetches from backend |
| Message thread | ✅ Done | Displays with timestamps |
| Reply editor | ✅ Done | Basic text input |
| AI mode toggle | ✅ Done | UI ready, backend integration pending |
| Client sidebar | ✅ Done | Profile stub, needs data fetch |
| Real-time updates | ⏳ Planned | Requires WebSocket |

### Analytics
| Feature | Status | Notes |
|---------|--------|-------|
| Stats cards | ✅ Done | Hardcoded data |
| Charts | ⏳ Planned | Need Chart library |
| Date filters | ⏳ Planned | Date range picker |

### Settings
| Feature | Status | Notes |
|---------|--------|-------|
| Account settings | ✅ Done | UI only |
| API key display | ✅ Done | Masked for security |
| Integrations | ✅ Done | Setup buttons |

## Next Steps

1. **Connect AI Response Engine**
   - Fetch AI suggestions when "Suggest with AI" clicked
   - Display confidence scores
   - One-click approval

2. **Implement Payment Workflows**
   - Detect payment intent in keyboard
   - Show "Create Payment Link" button
   - Track payment status

3. **Real-time Updates**
   - Add WebSocket for live message streaming
   - Notify on new conversations
   - Push notifications

4. **Charts & Analytics**
   - Integrate Chart.js or Recharts
   - Display real data from backend
   - Add date filters

5. **Advanced Features**
   - Message search
   - Bulk actions
   - Custom fields
   - Message templates
   - Conversation merge
   - Client notes

6. **Mobile Responsive**
   - Test on mobile devices
   - Hide sidebar on small screens
   - Touch-friendly controls

## Testing

### Manual Testing
1. Start backend: `npm run start:dev -w apps/backend`
2. Start frontend: `npm run dev -w apps/admin`
3. Login with any email
4. Create test conversation via n8n or API
5. Verify it appears in inbox

### Browser DevTools
- Check network tab for API calls
- Verify JWT token in localStorage
- Test responsive design

## Performance

- **Pagination**: 50 conversations/messages by default
- **Caching**: Future - add React Query or SWR
- **Lazy Loading**: Images and components
- **Code Splitting**: Automatic via Next.js

## Accessibility

- Semantic HTML
- Keyboard navigation
- ARIA labels (to be added)
- Color contrast ratios

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Environment Variables

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Deployment

```bash
npm run build -w apps/admin
npm start -w apps/admin
```

Vercel deployment:
```bash
vercel deploy
```

---

**Last Updated**: 2026-02-18
