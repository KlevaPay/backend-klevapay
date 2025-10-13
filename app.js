require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const connectDB = require('./src/config/db');
require('./src/config/passport');

require('./src/config/passport');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Health check endpoint (for monitoring/keeping server alive)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'KlevaPay API',
    version: '1.0.0',
    endpoints: ['/api/auth', '']
  });
});

// Routes
app.use('/api/auth', require('./src/routes/auth'));

const PORT = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('Welcome to KlevaPay backend url');
});


connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(' Failed to start server', err);
    process.exit(1);
  });
