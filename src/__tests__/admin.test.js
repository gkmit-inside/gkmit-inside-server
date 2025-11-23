
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import { Role } from '../models/Role.model.js';
import { ROLES } from '../constants/roles.js';

let mongoServer;
let adminUser;
let regularUser;
let adminToken;
let regularToken;
let adminRole;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create roles
  adminRole = await Role.create({ name: ROLES.ADMIN });
  const userRole = await Role.create({ name: ROLES.EMPLOYEE });

  // Register regular user
  await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'password123',
      department: 'Engineering',
    });

  regularUser = await User.findOne({ email: 'user@example.com' });
  regularUser.isApproved = true;
  await regularUser.save();

  // Login as admin using environment credentials
  const adminLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });

  if (!adminLoginRes.body.data) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.body)}`);
  }
  adminToken = adminLoginRes.body.data.accessToken;

  // Login as regular user
  const userLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'user@example.com',
      password: 'password123',
    });

  if (!userLoginRes.body.data) {
    throw new Error(`User login failed: ${JSON.stringify(userLoginRes.body)}`);
  }
  regularToken = userLoginRes.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Admin Routes', () => {
  it('should get all users as an admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('should not get all users as a regular user', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${regularToken}`);
    expect(res.statusCode).toEqual(403);
  });

  it('should get users by status as an admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users?status=approved')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('should get all posts as an admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/posts')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it("should approve a user as an admin", async () => {
    // Create a new unapproved user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Pending User',
        email: 'pending@example.com',
        password: 'password123',
        department: 'Engineering',
      });

    const pendingUser = await User.findOne({ email: 'pending@example.com' });

    const res = await request(app)
      .patch(`/api/v1/admin/users/${pendingUser._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });
    expect(res.statusCode).toEqual(200);

    const updatedUser = await User.findById(pendingUser._id);
    expect(updatedUser.isApproved).toBe(true);
  });

  it("should not update user status with invalid status", async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${regularUser._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'invalid' });
    expect(res.statusCode).toEqual(400);
  });

  it("should not update status of a non-existent user", async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/60f6e1b3b3e3e3e3e3e3e3e3/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });
    expect(res.statusCode).toEqual(404);
  });

  it("should not update user status without being an admin", async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${regularUser._id}/status`)
      .set('Authorization', `Bearer ${regularToken}`)
      .send({ status: 'approved' });
    expect(res.statusCode).toEqual(403);
  });
});
