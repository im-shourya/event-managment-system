const express = require('express');
const { supabase } = require('../supabaseClient');
const router = express.Router();

// Get user profile
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Create/Sync user profile (often called after auth signup)
router.post('/', async (req, res) => {
  const { id, email, name, role } = req.body;
  const { data, error } = await supabase
    .from('users')
    .insert([{ id, email, name, role }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

module.exports = router;
