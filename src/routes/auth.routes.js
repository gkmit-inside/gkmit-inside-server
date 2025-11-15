import express from 'express';
import { login, registerUser } from '../controllers/auth.controller.js';

export const authRouter = express.Router();

authRouter.post('/login', login);
authRouter.post('/register', registerUser);
