import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import { app } from '../src/app.js'; // Import the testable app
import path from 'path';
import { fileURLToPath } from 'url';

// --- Test Client ---
const request = supertest(app);

// --- State Variables ---
let adminToken;
let userToken;
let userId;
let postId; // The ID of the post we create and test

// --- Helper: Get a placeholder image path ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testImagePath = path.resolve(__dirname, 'test-image.png'); // You must add this file

/**
 * We need an admin and an approved user before we can test posts.
 * This block runs once before all tests in this file.
 */
beforeAll(async () => {
  // 1. Log in as Admin (relies on .env credentials)
  const adminLoginRes = await request.post('/api/auth/login').send({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  adminToken = adminLoginRes.body.data.token;

  // 2. Register a new user
  const testUser = {
    name: 'Post Tester',
    email: 'post-tester@example.com',
    password: 'password123',
    department: 'Post Test'
  };
  await request.post('/api/auth/register').send(testUser);

  // 3. Admin: Find the pending user
  const pendingRes = await request.get('/api/admin/users?status=pending')
    .set('Authorization', `Bearer ${adminToken}`);
  
  const userToApprove = pendingRes.body.data.find(u => u.email === testUser.email);
  userId = userToApprove._id;

  // 4. Admin: Approve the user
  await request.patch(`/api/admin/users/${userId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'approved' });
  
  // 5. Log in as the new user
  const userLoginRes = await request.post('/api/auth/login').send({
    email: testUser.email,
    password: testUser.password,
  });
  userToken = userLoginRes.body.data.token;
});


describe('Post API (/api/posts)', () => {

  describe('Phase 1: Post Creation & Approval', () => {

    it('should fail to create a post without a title (validation)', async () => {
      const res = await request.post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .field('description', 'This post has no title')
        .attach('image', testImagePath);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Title is required');
    });

    it('should successfully create a new post (status: pending)', async () => {
      const res = await request.post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'My First Test Post')
        .field('description', 'This is the description for my test post.')
        .attach('image', testImagePath);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.title).toBe('My First Test Post');
      expect(res.body.data.postStatus).toBe('pending');
      postId = res.body.data._id; // <-- Save the Post ID!
    });

    it('admin should approve the pending post', async () => {
      const res = await request.patch(`/api/admin/posts/${postId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.postStatus).toBe('approved');
    });

  });

  describe('Phase 2: Feeds (Read Data)', () => {

    it('should appear in the main feed', async () => {
      const res = await request.get('/api/posts')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(200);
      const post = res.body.data.find(p => p._id === postId);
      expect(post).toBeDefined();
      expect(post.title).toBe('My First Test Post');
    });

    it('should appear in "My Posts" feed (using ?userId)', async () => {
      const res = await request.get(`/api/posts?userId=${userId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(200);
      const post = res.body.data.find(p => p._id === postId);
      expect(post).toBeDefined();
    });

    it('should fail to get posts for a different user', async () => {
      const res = await request.get(`/api/posts?userId=60d5ec44ab7f5a001c9d8e0f`) // A fake, random ID
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('Not authorized to view these posts');
    });

    it('should get the single post by its ID (with comments/likes)', async () => {
      const res = await request.get(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data._id).toBe(postId);
      expect(res.body.data.title).toBe('My First Test Post');
      expect(res.body.data.comments).toBeInstanceOf(Array);
      expect(res.body.data.reactionCount).toBe(0);
    });

  });

  describe('Phase 3: Interactions (Like, Comment, Bookmark)', () => {

    it('should add a comment to the post', async () => {
      const res = await request.post(`/api/posts/${postId}/comment`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'My first comment!' });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.data.content).toBe('My first comment!');
    });

    it('should like the post', async () => {
      const res = await request.post(`/api/posts/${postId}/react`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Reaction added successfully');
    });

    it('should unlike the post (toggle)', async () => {
      const res = await request.post(`/api/posts/${postId}/react`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Reaction removed successfully');
    });

    it('should bookmark the post', async () => {
      const res = await request.post(`/api/posts/${postId}/bookmark`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Bookmark added successfully');
    });

    it('should appear in the bookmarks feed', async () => {
      const res = await request.get('/api/posts/bookmarks')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data[0]._id).toBe(postId);
    });

    it('should un-bookmark the post (toggle)', async () => {
      const res = await request.post(`/api/posts/${postId}/bookmark`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Bookmark removed successfully');
    });

    it('should no longer appear in the bookmarks feed', async () => {
      const res = await request.get('/api/posts/bookmarks')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

  });

  describe('Phase 4: Management (Update/Delete)', () => {

    it('should FAIL to update an APPROVED post', async () => {
      const res = await request.put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'This Should Fail' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Only pending posts can be updated');
    });

    it('should soft-delete an owned post', async () => {
      const res = await request.delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Post deleted successfully');
    });

    it('should no longer appear in the main feed after deletion', async () => {
      const res = await request.get('/api/posts')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(200);
      const post = res.body.data.find(p => p._id === postId);
      expect(post).toBeUndefined();
    });

    it('should successfully update a PENDING post', async () => {
      // 1. Create a new pending post
      const newPostRes = await request.post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Pending Post to Update')
        .field('description', 'Original Description')
        .attach('image', testImagePath);
      const newPostId = newPostRes.body.data._id;

      // 2. Update the pending post
      const res = await request.put(`/api/posts/${newPostId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Updated Title!' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe('Updated Title!');
    });

  });

});