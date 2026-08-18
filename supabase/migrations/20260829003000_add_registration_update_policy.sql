-- Allow admins (event creators) to update registrations for their own events
CREATE POLICY "Event creators can update registrations" 
ON public.registrations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = registrations.event_id 
    AND events.created_by = auth.uid()
  )
);
