const request = require('supertest');
const { app } = require('../src/app');
const mongoose = require('mongoose');

describe('shopEZ Backend integration suite', () => {
  // Test global health check
  it('should return 200 OK for /health check', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('ok');
  });

  // Verify route handlers load cleanly
  it('should fail with 404 for non-existent API routes', async () => {
    const res = await request(app).get('/api/notfoundroute');
    expect(res.statusCode).toEqual(404);
  });
});
