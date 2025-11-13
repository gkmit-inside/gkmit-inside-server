
import request from 'supertest';
import { app } from '../src/server';

describe('GET / route test', () => {
  
  test('should respond with status 200 and the expected message', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Gkmit Server is running...');
  });
});