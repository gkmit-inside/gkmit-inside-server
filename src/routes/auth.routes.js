import express from 'express';
import { login, registerUser } from '../controllers/auth.controller.js';
import { validate, validateLogin, validateRegister } from '../middlewares/validators/auth.validators.js';

export const authRouter = express.Router();

authRouter.post('/login', validateLogin, login);
authRouter.post('/register', validateRegister, registerUser);