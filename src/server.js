import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

export const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('Gkmit Server is running...');
});

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port http://localhost:${PORT}`)
);


