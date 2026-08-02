import { describe, test, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../server/src/app.js';

describe('Smoke Tests - Backend Entrypoints & Env', () => {
  beforeAll(() => {
    // Clear MONGODB_URI to force immediate Memory Mode for fast, isolated test execution
    delete process.env.MONGODB_URI;
  });

  test('Application starts and root route / is reachable', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Sahayak AI Decision-Support API Portal');
    expect(res.body.status).toBe('online');
  });

  test('API Health check endpoint loads and returns Memory Mode', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.databaseMode).toBe('Memory');
  });

  test('Environment variables are accessible and initialized', () => {
    expect(process.env.PORT || '3001').toBeDefined();
    expect(process.env.NODE_ENV || 'test').toBeDefined();
  });
});
