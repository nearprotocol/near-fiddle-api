const request = require('supertest');
const app = require('../app');
const models = require('../models');

beforeAll(async () => {
    await models.sequelize.sync({ force: true });
});

afterAll(async () => {
    await models.sequelize.close();
});

test('Create Fiddle', async () => {
    const response = await request(app.callback()).post('/api/set-fiddle');
    expect(response.status).toBe(200);
    expect(response.body.success).toBeTruthy();
    expect(response.body.id).toBeTruthy();
});

test('Create & View Fiddle', async () => {
    const createResponse = await request(app.callback()).post('/api/set-fiddle')
        .send({
            files: [{
                name: 'file1.txt',
                type: 'text',
                data: 'file contents'
            }]
        });
    expect(createResponse.status).toBe(200);

    const response = await request(app.callback()).get('/api/fiddle/' + createResponse.body.id);
    expect(response.status).toBe(200);
    expect(response.body.success).toBeTruthy();
    expect(response.body.id).toBeTruthy();
});
