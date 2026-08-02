import { describe, test, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../server/src/app.js';

describe('API Tests - Schema Validation, Auth, & Permissions', () => {
  let workerToken;
  let supervisorToken;
  let escalationId;

  beforeAll(async () => {
    delete process.env.MONGODB_URI;

    // Login worker to get token
    const workerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rani.worker@sahayak.ai', password: 'Password@123' });
    workerToken = workerRes.body.token;

    // Login supervisor to get token
    const supervisorRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sharma.supervisor@sahayak.ai', password: 'Password@123' });
    supervisorToken = supervisorRes.body.token;
  });

  test('GET /api/households returns 401 on missing credentials', async () => {
    const res = await request(app).get('/api/households');
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Authentication required');
  });

  test('GET /api/households returns 401 on malformed Authorization header', async () => {
    const res = await request(app)
      .get('/api/households')
      .set('Authorization', 'InvalidTokenStructure');
    expect(res.status).toBe(401);
  });

  test('GET /api/supervisor/escalations returns 403 for worker role sessions', async () => {
    const res = await request(app)
      .get('/api/supervisor/escalations')
      .set('Authorization', `Bearer ${workerToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access denied');
  });

  test('POST /api/auth/login returns 400 Bad Request on missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rani.worker@sahayak.ai' }); // missing password
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Missing email or password');
  });

  test('POST /api/visits returns 400 Bad Request on empty payload', async () => {
    const res = await request(app)
      .post('/api/visits')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Missing householdId');
  });

  test('Unknown router endpoints return 404 API Endpoint not found', async () => {
    const res = await request(app)
      .get('/api/non-existent-route-path')
      .set('Authorization', `Bearer ${workerToken}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toContain('API Endpoint not found');
  });
});
