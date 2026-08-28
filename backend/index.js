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

// Swagger Configuration
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Manager API',
      version: '1.0.0',
      description: 'API documentation for the Club Event Management System',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Local server',
      },
      {
        url: 'https://event-manager-api.onrender.com', // Placeholder for actual prod URL
        description: 'Production server',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'], // Files containing annotations
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
