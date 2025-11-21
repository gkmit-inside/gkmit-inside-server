import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app } from '../src/server.js'; 

const request = supertest(app);
describe('Auth API (/api/auth)', () => {

  describe('POST /api/auth/register', () => {

    test('should register a new user successfully', async () => {
      const newUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        department: 'Engineering'
      };

      const res = await request
        .post('/api/auth/register')
        .send(newUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Registration successful. Waiting for admin approval.');
    });

    it('should fail if the email is already taken', async () => {
      const user1 = {
        name: 'Test User 1',
        email: 'user1@example.com',
        password: 'password123',
        department: 'Engineering'
      };
      await request.post('/api/auth/register').send(user1);

      const res = await request
        .post('/api/auth/register')
        .send(user1);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User already exists');
    });

    it('should fail if the department is missing (validation)', async () => {
      const newUser = {
        name: 'Test User 2',
        email: 'test2@example.com',
        password: 'password123'
        // Missing department
      };

      const res = await request
        .post('/api/auth/register')
        .send(newUser);
      
      expect(res.statusCode).toBe(400); // 400 Bad Request
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('"department" is required');
    });
  });

  describe('POST /api/auth/login', () => {
    
    it('should fail to log in a user that is not approved', async () => {
      await request.post('/api/auth/register').send({
        name: 'Pending User',
        email: 'pending@example.com',
        password: 'password123',
        department: 'Limbo'
      });

      const res = await request.post('/api/auth/login').send({
        email: 'pending@example.com',
        password: 'password123'
      });

      expect(res.statusCode).toBe(403); // 403 Forbidden
      expect(res.body.message).toBe('Account not approved. Please contact admin.');
    });

    it('should fail to log in with a wrong password', async () => {
      const res = await request.post('/api/auth/login').send({
        email: 'user1@example.com',
        password: 'wrongpassword'
      });

      expect(res.statusCode).toBe(401); // 401 Unauthorized
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('Full Auth Flow (Admin Approval & Refresh Token)', () => {

    it('should register a new user to be approved', async () => {
      const res = await request.post('/api/auth/register').send(testUser);
      expect(res.statusCode).toBe(201);
    });

    it('should log in as Admin', async () => {
      const res = await request.post('/api/auth/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.token).toBeDefined();
      adminToken = res.body.data.token; // Save admin token
    });

    it('admin should find and approve the pending user', async () => {
      const pendingRes = await request.get('/api/admin/users?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const userToApprove = pendingRes.body.data.find(u => u.email === testUser.email);
      expect(userToApprove).toBeDefined();
      userId = userToApprove._id; // Save the user's ID

      const approveRes = await request.patch(`/api/admin/users/${userId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' });
      
      expect(approveRes.statusCode).toBe(200);
      expect(approveRes.body.data.isApproved).toBe(true);
    });

    it('user should log in successfully after approval', async () => {
      const res = await request.post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.id).toBe(userId);
      userToken = res.body.data.token;
      refreshTokenCookie = res.headers['set-cookie'];
    });

    it('user should be able to get a new access token using the refresh token', async () => {
      const res = await request.post('/api/auth/refresh')
        .set('Cookie', refreshTokenCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.accessToken).not.toBe(userToken); 
    });

    it('should fail to refresh if no refresh token is provided', async () => {
      const res = await request.post('/api/auth/refresh');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('No refresh token provided');
    });

  });

});