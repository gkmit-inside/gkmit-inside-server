import './config/env.js'; // MUST BE FIRST

import express from 'express';
import cors from 'cors';
// import dotenv from 'dotenv'; // <-- 1. DELETE THIS LINE
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';

// Import all routers
import { authRouter } from './routes/auth.routes.js';
import { postRouter } from './routes/post.routes.js';
import { adminRouter } from './routes/admin.routes.js';

// Import global error handler
import { globalErrorHandler } from './middlewares/errorHandler.js';
// dotenv.config(); // <-- 2. DELETE THIS LINE

export const app = express();

// --- Core Middlewares ---
app.use(cors());
app.use(cookieParser());
app.use(express.json()); // This middleware is required to read req.body

// --- Test Route ---
app.get('/', (req, res) => {
    res.send('GKMIT Server is running...');
});

// --- API Routes ---
app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);
app.use('/api/admin', adminRouter);

// --- Global Error Handler (Must be LAST) ---
app.use(globalErrorHandler);

// --- Server Start ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port http://localhost:${PORT}`);
});