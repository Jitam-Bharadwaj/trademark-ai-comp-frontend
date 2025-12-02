# Trademark Frontend - Next.js

A modern Next.js frontend for the Trademark Search & PDF Processing system.

## Features

- **Authentication**: Signup, Client Login, Admin Login
- **Image Search**: Upload images and find similar trademarks
- **PDF Processing**: Extract and index trademarks from PDFs
- **Trademark Details**: View detailed information about trademarks
- **Protected Routes**: All features require authentication

## Getting Started

### Prerequisites

- Node.js 18+ installed
- FastAPI backend running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with AuthProvider
│   ├── page.tsx            # Login/Signup page
│   ├── app/
│   │   └── page.tsx        # Main app page (protected)
│   └── globals.css         # Global styles
├── components/
│   ├── LoginPage.tsx       # Login/Signup page component
│   ├── MainApp.tsx         # Main app component
│   ├── ImageModal.tsx      # Image modal component
│   └── tabs/
│       ├── ImageSearchTab.tsx      # Image search functionality
│       ├── PDFProcessingTab.tsx    # PDF processing functionality
│       └── TrademarkDetailsTab.tsx # Trademark details functionality
├── contexts/
│   └── AuthContext.tsx     # Authentication context
└── lib/
    └── api.ts              # API client functions
```

## Authentication Flow

1. User visits `/` - Login/Signup page
2. User signs up or logs in
3. On success, redirects to `/app` - Main application
4. All API calls include credentials (cookies)
5. If not authenticated, redirects back to `/`

## API Integration

The frontend communicates with the FastAPI backend:

- **Authentication**: `/auth/client/signup`, `/auth/client/login`, `/auth/admin/login`, `/auth/client/logout`, `/auth/admin/logout`, `/auth/me`
- **Search**: `/search`
- **PDF Processing**: `/process-pdf-and-index`
- **Trademark Details**: `/trademark/{id}`
- **Images**: `/image/{id}`

## Build for Production

```bash
npm run build
npm start
```

## Development

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```
