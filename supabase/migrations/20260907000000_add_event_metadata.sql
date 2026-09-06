-- Add new columns to events table
ALTER TABLE public.events 
  ADD COLUMN poster_url TEXT,
  ADD COLUMN banner_url TEXT,
  ADD COLUMN faq JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN team_size INTEGER DEFAULT 1,
  ADD COLUMN external_link TEXT;

-- Add new column to registrations table
ALTER TABLE public.registrations
  ADD COLUMN qr_code_url TEXT;

-- Create Storage Bucket for event images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for event-images bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'event-images');

CREATE POLICY "Authenticated users can upload images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');

CREATE POLICY "Event creators can update their images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'event-images' AND auth.role() = 'authenticated');

CREATE POLICY "Event creators can delete their images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'event-images' AND auth.role() = 'authenticated');
