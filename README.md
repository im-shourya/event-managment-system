# Club Event Management System

A full-stack event management platform built for student clubs. It features a complete Next.js frontend, an Express/Supabase backend, seamless magic-link authentication, and robust admin tools including QR code attendance tracking and automated email blasts.

## Features
- **User Authentication**: Secure magic-link & OTP login via Supabase.
- **Event Discovery & Registration**: Browse upcoming events and register with a single click.
- **QR Code Attendance**: Cryptographically generated QR passes for lightning-fast admin check-ins.
- **Smart Notifications**: Mass-mail registered or present participants via Resend.
- **Post-Event Analytics & Feedback**: Automated feedback collection and rating aggregation.
- **Ultra-Premium UI**: Fully responsive, cinematic glassmorphism design system.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS v4, Lucide React
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL) with advanced Row Level Security (RLS)
- **Mailing**: Resend API
- **QR Generation**: QuickChart API

---

## API Documentation

### Base URL: `http://localhost:3001/api`

### 1. Events List
- **Endpoint**: `GET /events`
- **Description**: Retrieves a list of all events, ordered by start time.
- **Auth Required**: No

### 2. Event Details
- **Endpoint**: `GET /events/:id`
- **Description**: Fetches detailed information for a specific event.
- **Auth Required**: No

### 3. Create Event
- **Endpoint**: `POST /events`
- **Description**: Creates a new event.
- **Auth Required**: Yes (Admin only)
- **Body Payload**:
  ```json
  {
    "title": "String",
    "description": "String",
    "start_time": "ISO Date String",
    "end_time": "ISO Date String"
  }
  ```

### 4. Edit Event
- **Endpoint**: `PUT /events/:id`
- **Description**: Updates event details and optionally emails participants.
- **Auth Required**: Yes (Event Creator only)
- **Body Payload**:
  ```json
  {
    "title": "String",
    "description": "String",
    "start_time": "ISO Date String",
    "end_time": "ISO Date String",
    "status": "upcoming | ongoing | completed",
    "notifyParticipants": Boolean
  }
  ```

### 5. Register for Event
- **Endpoint**: `POST /events/:id/register`
- **Description**: Registers the authenticated user for the event.
- **Auth Required**: Yes

### 6. Event Registrations (Admin)
- **Endpoint**: `GET /events/:id/registrations`
- **Description**: Fetches all registrations for an event.
- **Auth Required**: Yes (Admin only)

### 7. Mark Attendance (QR Check-in)
- **Endpoint**: `POST /events/:id/checkin/:registrationId`
- **Description**: Marks a specific registration as 'Present'.
- **Auth Required**: Yes (Event Creator only)

### 8. Send Mass Mail
- **Endpoint**: `POST /events/:id/mass-mail`
- **Description**: Sends an email blast to participants using Resend.
- **Auth Required**: Yes (Admin only)
- **Body Payload**:
  ```json
  {
    "subject": "String",
    "body": "String",
    "target_audience": "all | present",
    "includeQR": Boolean
  }
  ```

---

## Setup & Running Locally

1. **Install Dependencies**
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Environment Variables**
   - Create `backend/.env` with your Supabase URL, Anon Key, and Resend API Key.
   - Create `frontend/.env.local` with your Supabase URL and Anon Key.

3. **Start the Servers**
   - Backend: `cd backend && node index.js` (Runs on port 3001)
   - Frontend: `cd frontend && npm run dev` (Runs on port 3000)
