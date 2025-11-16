import './config/env.js'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { globalErrorHandler } from './middlewares/errorHandler.js';

import { authRouter } from './routes/auth.routes.js';
import { postRouter } from './routes/post.routes.js';

import { connectDB } from './config/db.js';

dotenv.config();

export const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Basic route
app.get('/', (req, res) => {
  res.send('Gkmit Server is running...');
});

// api routes
app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);


app.use(globalErrorHandler);

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  connectDB();
  console.log(`Server running on port http://localhost:${PORT}`);
});
