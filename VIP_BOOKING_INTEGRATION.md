# VIP Room Booking System - Integration Guide

## Overview
A complete VIP Room Booking System with calendar, 3 package tiers (Bronze/Silver/Gold), and full admin management.

## Files Created

### 1. Database Schema
- **File**: `supabase-vip-bookings.sql`
- **Run this in Supabase SQL Editor** to create the `vip_bookings` table

### 2. API Endpoints
- **File**: `app/api/vip-bookings/route.ts` - Main API (GET all bookings, POST new booking)
- **File**: `app/api/vip-bookings/[id]/route.ts` - Individual booking API (PUT status, DELETE)

### 3. Frontend Pages
- **File**: `app/vip-booking/page.tsx` - User booking page with calendar
- **File**: `app/admin/vip-bookings/page.tsx` - Admin management dashboard

### 4. Admin Dashboard Updates
- **File**: `app/admin/page.tsx` - Added VIP Bookings tab and stats

## Setup Instructions

### Step 1: Run Database Migration
Execute `supabase-vip-bookings.sql` in your Supabase SQL Editor:

```sql
-- This creates:
-- - vip_bookings table
-- - RLS policies for security
-- - Indexes for performance
```

### Step 2: No Additional Setup Required
All files are already integrated. The system uses existing:
- Authentication system
- User management
- Event data

## Features

### User Features
1. **Interactive Calendar**
   - Shows only dates with events
   - Past dates disabled
   - Already booked dates marked
   - Month navigation

2. **3 VIP Packages**
   - **Bronze** (CHF 500): VIP Room + Sekt
   - **Silver** (CHF 800): VIP Room + Sekt + Softdrinks
   - **Gold** (CHF 1,200): VIP Room + Sekt + Softdrinks + 2 bottles vodka

3. **Booking Flow**
   - Select event date
   - Choose package
   - Add optional notes
   - Submit request (pending admin approval)

4. **Additional Info**
   - "Additional drinks and pizza can be ordered at any time through the staff."

### Admin Features
1. **Dashboard Integration**
   - New "VIP Bookings" tab in admin sidebar
   - Stats card showing pending bookings

2. **Booking Management**
   - View all bookings with user/event details
   - Filter by status (all/pending/approved/rejected)
   - Approve/Reject/Set to pending actions
   - Delete bookings
   - Package reference guide

3. **Booking Details**
   - User name & email
   - Event name & date
   - Selected package (Bronze/Silver/Gold)
   - Status with color coding
   - Timestamp

## URL Structure

| URL | Description |
|-----|-------------|
| `/vip-booking` | User booking page |
| `/admin/vip-bookings` | Admin management |
| `/api/vip-bookings` | API endpoint |

## Security

- Only logged-in users can book
- Users can only see their own bookings
- Only admins can see all bookings
- Only admins can update status
- RLS policies enforce these rules

## Design

- Matches existing Kinker Basel design
- Black background with red accents
- Fully responsive
- Uses existing Lucide icons
- Smooth animations with Framer Motion
