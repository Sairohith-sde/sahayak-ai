import { describe, test, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../server/src/app.js';

describe('Sanity Tests - Authenticated Critical Workflows', () => {
  let authToken;
  let householdId;

  beforeAll(() => {
    delete process.env.MONGODB_URI;
  });

  test('Sanity Step 1: Successful login for Rani Devi ASHA worker', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'rani.worker@sahayak.ai',
        password: 'Password@123'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe('Rani Devi');
    expect(res.body.user.role).toBe('worker');
    
    authToken = res.body.token;
  });

  test('Sanity Step 2: Retrieve seeded households', async () => {
    const res = await request(app)
      .get('/api/households')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('Sanity Step 3: Create a new household file', async () => {
    const res = await request(app)
      .post('/api/households')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Lakshmi Bai',
        village: 'Ramapuram',
        headOfHousehold: 'Vijay Bai',
        phone: '9888877777',
        category: 'Maternal Health'
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Lakshmi Bai');
    expect(res.body.village).toBe('Ramapuram');
    expect(res.body._id).toBeDefined();

    householdId = res.body._id;
  });

  test('Sanity Step 4: Update household records', async () => {
    const res = await request(app)
      .patch(`/api/households/${householdId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        headOfHousehold: 'Vijay Kumar Bai',
        phone: '9999988888'
      });

    expect(res.status).toBe(200);
    expect(res.body.headOfHousehold).toBe('Vijay Kumar Bai');
    expect(res.body.phone).toBe('9999988888');
  });

  test('Sanity Step 5: Delete household records', async () => {
    const res = await request(app)
      .delete(`/api/households/${householdId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted successfully');

    // Confirm it is gone
    const checkRes = await request(app)
      .get(`/api/households/${householdId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(checkRes.status).toBe(404);
  });
});
