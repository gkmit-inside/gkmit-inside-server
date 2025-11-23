import './config/env.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { authRouter } from './routes/auth.routes.js';
import { postRouter } from './routes/post.routes.js';
import { adminRouter } from './routes/admin.routes.js';

import { globalErrorHandler } from './middlewares/errorHandler.js';

const app = express();

const corsOptions = {
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());

// --- API Routes ---
app.get('/', (req, res) => {
  res.send('GKMIT Server is running...');
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/posts', postRouter);
app.use('/api/v1/admin', adminRouter);

app.use(globalErrorHandler);

export { app }; 