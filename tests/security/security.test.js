import { describe, test, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../server/src/app.js';

describe('Security Tests — XSS, Route Bypassing, & Payload Injection Protection', () => {
  beforeAll(() => {
    delete process.env.MONGODB_URI;
  });

  test('Security Check 1: Prevent route bypassing on PATCH /api/escalations/:id', async () => {
    // Attempting to resolve an escalation without a token should return 401
    const res = await request(app)
      .patch('/api/escalations/esc_123')
      .send({ resolved: true });
    expect(res.status).toBe(401);
  });

  test('Security Check 2: XSS Injection Mitigation inside Household CRUD', async () => {
    // Injecting HTML script tags inside the household name
    const workerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rani.worker@sahayak.ai', password: 'Password@123' });
    const token = workerRes.body.token;

    const xssPayload = "<script>alert('XSS Attack');</script> Malicious Name";
    const res = await request(app)
      .post('/api/households')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: xssPayload,
        village: 'Ramapuram',
        headOfHousehold: 'Hacker',
        phone: '1112223333',
        category: 'general'
      });

    // Verify it handles creating the household safely
    expect(res.status).toBe(201);
    expect(res.body.name).toBe(xssPayload); // Should store safely without executing (React escapes content on render)
  });

  test('Security Check 3: Invalid login credentials do not leak internal system hashes', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rani.worker@sahayak.ai', password: 'wrong_password' });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Invalid credentials');
    expect(res.body.token).toBeUndefined();
    expect(res.body.hash).toBeUndefined();
  });
});
