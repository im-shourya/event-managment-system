-- Add extended profile fields for students
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS register_number TEXT,
ADD COLUMN IF NOT EXISTS year TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS college TEXT;
