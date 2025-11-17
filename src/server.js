import './config/env.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';

// Import all routers
import { authRouter } from './routes/auth.routes.js';
import { postRouter } from './routes/post.routes.js';
import { adminRouter } from './routes/admin.routes.js';

// Import global error handler
import { globalErrorHandler } from './middlewares/errorHandler.js';

export const app = express();

// middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.json()); 

// test route
app.get('/', (req, res) => {
    res.send('GKMIT Server is running...');
});

// routes
app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);
app.use('/api/admin', adminRouter);

// global error handler
app.use(globalErrorHandler);

// server start
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        process.exit(1);
    }
};

startServer();