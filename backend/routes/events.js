const express = require('express');
const { supabase, getAuthClient } = require('../supabaseClient');
const { Resend } = require('resend');
const router = express.Router();

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Retrieve a list of all events
 *     responses:
 *       200:
 *         description: A list of events.
 *   post:
 *     summary: Create a new event
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               start_time: { type: string, format: date-time }
 *               end_time: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Event created
 *
 * /api/events/{id}:
 *   get:
 *     summary: Get event details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 *   put:
 *     summary: Edit event and notify participants
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               start_time: { type: string, format: date-time }
 *               end_time: { type: string, format: date-time }
 *               status: { type: string, enum: [upcoming, ongoing, completed] }
 *               notifyParticipants: { type: boolean }
 *     responses:
 *       200:
 *         description: Event updated
 * 
 * /api/events/{id}/register:
 *   post:
 *     summary: Register for an event
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Registration successful
 */

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Get all events
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get a user's registered events
router.get('/registered/:userId', async (req, res) => {
  const { userId } = req.params;
  
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      event_id,
      events (*)
    `)
    .eq('user_id', userId);

  if (error) return res.status(500).json({ error: error.message });
  
  // Flatten the response
  const registeredEvents = data.map(reg => reg.events);
  res.json(registeredEvents);
});

// Get hosted events with stats for an admin
router.get('/hosted/:userId', async (req, res) => {
  const { userId } = req.params;
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      registrations (
        attendance_status
      )
    `)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  
  // Compute stats
  const eventsWithStats = data.map(event => {
    const totalRegistrations = event.registrations ? event.registrations.length : 0;
    const totalPresent = event.registrations ? event.registrations.filter(r => r.attendance_status === true).length : 0;
    return {
      ...event,
      stats: {
        totalRegistrations,
        totalPresent
      }
    };
  });

  res.json(eventsWithStats);
});

// Get a single event
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Create an event
router.post('/', async (req, res) => {
  const { title, description, start_time, end_time, created_by, poster_url, banner_url, faq, team_size, external_link } = req.body;
  
  // Use authenticated client so RLS (auth.uid() = created_by) passes
  const authClient = getAuthClient(req.headers.authorization);

  const qr_code_data = `event-${Date.now()}`;

  const { data, error } = await authClient
    .from('events')
    .insert([{ title, description, start_time, end_time, created_by, qr_code_data, poster_url, banner_url, faq, team_size, external_link }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

// Get registrations for an event (Admin only ideally, but we rely on RLS/UI for simplicity here)
router.get('/:id/registrations', async (req, res) => {
  const { id } = req.params;
  
  // We join registrations with users to get emails, names, and new profile fields
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      id,
      attendance_status,
      registered_at,
      qr_code_url,
      users ( id, email, name, register_number, year, department, college )
    `)
    .eq('event_id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Register for an event
router.post('/:id/register', async (req, res) => {
  const { id } = req.params; // event_id
  const { user_id } = req.body;

  const authClient = getAuthClient(req.headers.authorization);

  // 1. Insert Registration
  const { data: registration, error: regError } = await authClient
    .from('registrations')
    .insert([{ event_id: id, user_id }])
    .select()
    .single();

  if (regError) return res.status(500).json({ error: regError.message });

  // 2. Fetch User & Event Details for Email
  const { data: user } = await supabase.from('users').select('email, name').eq('id', user_id).single();
  const { data: event } = await supabase.from('events').select('title, start_time').eq('id', id).single();

  // 3. Send Confirmation Email via Resend
  if (user && event && resend) {
    try {
      await resend.emails.send({
        from: 'Club Events <events@shouryaparashar.in>',
        to: user.email,
        subject: `Registration Confirmed: ${event.title}`,
        html: `<p>Hi ${user.name},</p><p>You have successfully registered for <strong>${event.title}</strong> happening on ${new Date(event.start_time).toLocaleString()}.</p><p>See you there!</p>`,
      });

      // Log email sent
      await authClient.from('email_logs').insert([{
        event_id: id,
        user_id: user_id,
        type: 'registration_confirmation',
        status: 'sent'
      }]);
    } catch (emailErr) {
      console.error("Failed to send email:", emailErr);
    }
  }

  res.status(201).json(registration);
});

// Send mass email to event participants
router.post('/:id/mass-mail', async (req, res) => {
  const { id } = req.params;
  const { subject, body, target_audience, includeQR } = req.body;
  const authClient = getAuthClient(req.headers.authorization);

  // 1. Fetch event and users based on target_audience
  let query = supabase.from('registrations').select(`id, users(email, name)`).eq('event_id', id);
  if (target_audience === 'present') {
    query = query.eq('attendance_status', true);
  }

  const { data: participants, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  if (!participants || participants.length === 0) return res.status(400).json({ error: "No participants found for the selected audience." });

  // 2. Prepare Resend Batch payload
  if (!resend) return res.status(500).json({ error: "Resend is not configured." });

  const FRONTEND_URL = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://events.shouryaparashar.in' : 'http://localhost:3000');

  // Limit to Resend's batch limits (100 per batch)
  const batchEmails = participants.slice(0, 100).map(p => {
    let qrHtml = "";
    if (includeQR) {
      const checkinUrl = `${FRONTEND_URL}/events/${id}/checkin/${p.id}`;
      const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(checkinUrl)}&size=250`;
      qrHtml = `<br><br><hr><br><h3>Your Attendance Pass</h3><p>Show this QR code to the event admin for quick check-in.</p><img src="${qrCodeUrl}" alt="Check-in QR Code" />`;
    }

    return {
      from: 'Club Events <events@shouryaparashar.in>',
      to: p.users.email,
      subject: subject,
      html: `<p>Hi ${p.users.name || 'Participant'},</p><p>${body.replace(/\n/g, '<br>')}</p>${qrHtml}`,
    };
  });

  try {
    const { data: emailData, error: emailError } = await resend.batch.send(batchEmails);
    if (emailError) throw new Error(emailError.message);

    return res.status(200).json({ message: `Successfully sent ${batchEmails.length} emails.` });
  } catch (err) {
    console.error("Mass mail error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Check-in a participant (Admin only)
router.post('/:id/checkin/:registrationId', async (req, res) => {
  const { id, registrationId } = req.params;
  const authClient = getAuthClient(req.headers.authorization);
  
  // 1. Get current user
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  // 2. Verify current user is the event creator (admin)
  const { data: event, error: eventError } = await authClient.from('events').select('created_by').eq('id', id).single();
  if (eventError || !event) return res.status(404).json({ error: "Event not found." });
  if (event.created_by !== user.id) return res.status(403).json({ error: "Only the admin of this event can mark attendance." });

  // 3. Mark registration as present
  const { data, error } = await authClient
    .from('registrations')
    .update({ attendance_status: true })
    .eq('id', registrationId)
    .eq('event_id', id)
    .select('users(name, email)')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Registration not found." });

  return res.json({ message: "Attendance marked successfully", participant: data.users });
});

// Update an event (Admin only)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, start_time, end_time, status, notifyParticipants, poster_url, banner_url, faq, team_size, external_link } = req.body;
  const authClient = getAuthClient(req.headers.authorization);

  // 1. Get current user
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  // 2. Verify admin
  const { data: event, error: eventError } = await authClient.from('events').select('created_by, title').eq('id', id).single();
  if (eventError || !event) return res.status(404).json({ error: "Event not found." });
  if (event.created_by !== user.id) return res.status(403).json({ error: "Only the admin can edit this event." });

  // 3. Update Event
  const { data: updatedEvent, error: updateError } = await authClient
    .from('events')
    .update({ title, description, start_time, end_time, status, poster_url, banner_url, faq, team_size, external_link })
    .eq('id', id)
    .select()
    .single();

  if (updateError) return res.status(500).json({ error: updateError.message });

  // 4. Send Notification Email if requested
  if (notifyParticipants && resend) {
    const { data: participants } = await supabase.from('registrations').select('users(email, name)').eq('event_id', id);
    
    if (participants && participants.length > 0) {
      const FRONTEND_URL = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://events.shouryaparashar.in' : 'http://localhost:3000');
      const eventUrl = `${FRONTEND_URL}/events/${id}`;
      
      const batchEmails = participants.slice(0, 100).map(p => ({
        from: 'Club Events <events@shouryaparashar.in>',
        to: p.users.email,
        subject: `Event Update: ${title}`,
        html: `<p>Hi ${p.users.name || 'Participant'},</p><p>Important updates have been made to <strong>${title}</strong>.</p>
               <p><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
               <p><strong>New Time:</strong> ${new Date(start_time).toLocaleString()} to ${new Date(end_time).toLocaleString()}</p>
               <p><a href="${eventUrl}">Click here to view the updated event page.</a></p>`,
      }));

      try {
        await resend.batch.send(batchEmails);
      } catch (err) {
        console.error("Failed to send update emails:", err);
      }
    }
  }

  return res.json(updatedEvent);
});

// Generate QR code for a specific registration
router.post('/:id/registrations/:registrationId/generate-qr', async (req, res) => {
  const { id, registrationId } = req.params;
  const { sendEmail } = req.body;
  const authClient = getAuthClient(req.headers.authorization);

  // Verify Admin
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  const { data: event, error: eventError } = await authClient.from('events').select('created_by, title').eq('id', id).single();
  if (eventError || !event) return res.status(404).json({ error: "Event not found." });
  if (event.created_by !== user.id) return res.status(403).json({ error: "Only the admin can generate QR codes." });

  // Check Registration
  const { data: registration, error: regError } = await authClient
    .from('registrations')
    .select('id, users(email, name)')
    .eq('id', registrationId)
    .eq('event_id', id)
    .single();

  if (regError || !registration) return res.status(404).json({ error: "Registration not found." });

  // Generate QR Url
  const FRONTEND_URL = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://events.shouryaparashar.in' : 'http://localhost:3000');
  const checkinUrl = `${FRONTEND_URL}/events/${id}/checkin/${registration.id}`;
  const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(checkinUrl)}&size=300`;

  // Update Registration
  const { error: updateRegError } = await authClient
    .from('registrations')
    .update({ qr_code_url: qrCodeUrl })
    .eq('id', registrationId);

  if (updateRegError) return res.status(500).json({ error: updateRegError.message });

  // Send Email
  if (sendEmail && resend && registration.users) {
    try {
      await resend.emails.send({
        from: 'Club Events <events@shouryaparashar.in>',
        to: registration.users.email,
        subject: `Your QR Code Pass for ${event.title}`,
        html: `<p>Hi ${registration.users.name},</p>
               <p>Here is your unique QR code for <strong>${event.title}</strong>.</p>
               <p>Please present this code at the check-in desk.</p>
               <img src="${qrCodeUrl}" alt="QR Code" />
               <p>See you there!</p>`,
      });
    } catch (err) {
      console.error("Email error:", err);
      // Even if email fails, the QR is generated successfully
    }
  }

  return res.json({ message: "QR generated successfully", qrCodeUrl });
});

module.exports = router;
