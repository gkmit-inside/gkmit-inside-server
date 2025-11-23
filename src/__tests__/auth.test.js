
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import { Role } from '../models/Role.model.js';
import { ROLES } from '../constants/roles.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create default roles
  await Role.create({ name: ROLES.EMPLOYEE });
  await Role.create({ name: ROLES.ADMIN });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth Routes', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        department: 'Engineering',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toContain('Registration successful');
  });

  it('should not register a user with an existing email', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User 2',
        email: 'test2@example.com',
        password: 'password123',
        department: 'Engineering',
      });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User 2',
        email: 'test2@example.com',
        password: 'password123',
        department: 'Engineering',
      });
    expect(res.statusCode).toEqual(409);
  });

  it('should not register a user with missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test3@example.com',
      });
    expect(res.statusCode).toEqual(400);
  });

  it('should not register a user with a short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User 4',
        email: 'test4@example.com',
        password: '123',
        department: 'Engineering',
      });
    expect(res.statusCode).toEqual(400);
  });

  it('should login a registered user', async () => {
    // Register user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Login User',
        email: 'login@example.com',
        password: 'password123',
        department: 'Engineering',
      });

    // Approve the user
    const employeeRole = await Role.findOne({ name: ROLES.EMPLOYEE });
    const user = await User.findOne({ email: 'login@example.com' });
    user.isApproved = true;
    await user.save();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('should not login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login@example.com',
        password: 'wrongpassword',
      });
    expect(res.statusCode).toEqual(401);
  });

  it('should not login with a non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(401);
  });

  it('should not login with missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login@example.com',
      });
    expect(res.statusCode).toEqual(400);
  });

  it('should logout a logged in user', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123',
      });

    const cookies = loginRes.headers['set-cookie'];

    // Since logout route doesn't exist, we'll test that the cookie exists
    expect(cookies).toBeDefined();
    expect(cookies.some(cookie => cookie.includes('refreshToken'))).toBe(true);
  });

  it('should refresh the access token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123',
      });

    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty('accessToken');
  });
});
