-- Add new columns to events table for extended metadata
ALTER TABLE public.events 
  ADD COLUMN location TEXT,
  ADD COLUMN event_type TEXT CHECK (event_type IN ('online', 'offline')) DEFAULT 'offline',
  ADD COLUMN map_url TEXT,
  ADD COLUMN prize_pool TEXT;
