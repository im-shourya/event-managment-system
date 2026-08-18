const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Club Event Manager API is running' });
});

// Import Routes
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');

app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
