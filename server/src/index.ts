import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Enable more verbose logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  console.log('Received request to root endpoint');
  res.send('Server is running with TypeScript!');
});

// Add a test endpoint
app.get('/test', (_req, res) => {
  res.send('Test endpoint is working!');
});

const PORT = process.env.PORT || 3000; // Changed to port 3000 instead of 5000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Server is running with TypeScript!');
});
