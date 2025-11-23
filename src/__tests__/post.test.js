
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import { Post } from '../models/Post.model.js';
import { Role } from '../models/Role.model.js';
import { ROLES } from '../constants/roles.js';

let mongoServer;
let user;
let otherUser;
let token;
let otherToken;
let post;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create default roles
  const employeeRole = await Role.create({ name: ROLES.EMPLOYEE });
  await Role.create({ name: ROLES.ADMIN });

  // Register users
  await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Post User',
      email: 'postuser@example.com',
      password: 'password123',
      department: 'Engineering',
    });

  await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Other User',
      email: 'otheruser@example.com',
      password: 'password123',
      department: 'Engineering',
    });

  // Approve users
  user = await User.findOne({ email: 'postuser@example.com' });
  user.isApproved = true;
  await user.save();

  otherUser = await User.findOne({ email: 'otheruser@example.com' });
  otherUser.isApproved = true;
  await otherUser.save();

  // Login users
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'postuser@example.com',
      password: 'password123',
    });
  token = loginRes.body.data.accessToken;

  const otherLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'otheruser@example.com',
      password: 'password123',
    });
  otherToken = otherLoginRes.body.data.accessToken;

  post = await Post.create({
    userId: user._id,
    title: 'Test Post',
    description: 'This is a test post',
    postStatus: 'approved',
  });

  // Create a pending post for update tests
  const pendingPost = await Post.create({
    userId: user._id,
    title: 'Pending Post',
    description: 'This is a pending post',
    postStatus: 'pending',
  });

  // Store pending post ID for update tests
  global.pendingPostId = pendingPost._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Post Routes', () => {
  it('should create a new post', async () => {
    const res = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'New Post')
      .field('description', 'This is a new post')
      .attach('image', Buffer.from('fake-image-data'), 'test.jpg');
    expect(res.statusCode).toEqual(201);
    expect(res.body.data).toHaveProperty('description', 'This is a new post');
  });

  it('should not create a post without an image', async () => {
    const res = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Post without image',
        description: 'This post has no image'
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toContain('Image file is required');
  });

  it('should get all posts', async () => {
    const res = await request(app)
      .get('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('should get a single post', async () => {
    const res = await request(app)
      .get(`/api/v1/posts/${post._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.description).toEqual('This is a test post');
  });

  it('should not get a non-existent post', async () => {
    const res = await request(app)
      .get(`/api/v1/posts/60f6e1b3b3e3e3e3e3e3e3e3`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(404);
  });

  it('should update a post', async () => {
    const res = await request(app)
      .put(`/api/v1/posts/${global.pendingPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'This is an updated post' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.description).toEqual('This is an updated post');
  });

  it('should not update a non-existent post', async () => {
    const res = await request(app)
      .put(`/api/v1/posts/60f6e1b3b3e3e3e3e3e3e3e3`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'This is an updated post' });
    expect(res.statusCode).toEqual(404);
  });

  it('should not update a post that does not belong to the user', async () => {
    const res = await request(app)
      .put(`/api/v1/posts/${post._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ description: 'This is an updated post' });
    expect(res.statusCode).toEqual(403);
  });

  it('should delete a post', async () => {
    const newPost = await Post.create({
      userId: user._id,
      title: 'Post to Delete',
      description: 'This is a post to be deleted',
    });
    const res = await request(app)
      .delete(`/api/v1/posts/${newPost._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
  });

  it('should not delete a non-existent post', async () => {
    const res = await request(app)
      .delete(`/api/v1/posts/60f6e1b3b3e3e3e3e3e3e3e3`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(404);
  });

  it('should not delete a post that does not belong to the user', async () => {
    const res = await request(app)
      .delete(`/api/v1/posts/${post._id}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.statusCode).toEqual(403);
  });
});
