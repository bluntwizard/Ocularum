const request = require('supertest');
const express = require('express');

// Mock express app
const app = express();
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Ocularum API!' });
});

describe('API Endpoints', () => {
  it('should return welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toEqual('Welcome to Ocularum API!');
  });
}); 