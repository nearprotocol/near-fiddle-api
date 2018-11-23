const request = require('supertest');
const app = require('../app');
const models = require('../models');

beforeAll(async () => {
    await models.sequelize.sync({ force: true });
});

afterAll(async () => {
    await models.sequelize.close();
});

const FILE1 = {
    name: 'src/file1.txt',
    type: 'text',
    data: 'file contents'
};

const FILE2 = {
    name: 'src/file2.txt',
    type: 'text',
    data: 'file contents 2'
};

const FILE2_UPDATED = {
    name: 'src/file2.txt',
    type: 'text',
    data: 'file contents 3'
};

test('Create Fiddle No Content', async () => {
    const response = await request(app.callback()).post('/api/set-fiddle');
    expect(response.status).toBe(200);
    expect(response.body.success).toBeTruthy();
    expect(response.body.id).toBeTruthy();
});

test('Create & View Fiddle', async () => {
    const createResponse = await request(app.callback()).post('/api/set-fiddle')
        .send({ files: [FILE1, FILE2] });
    expect(createResponse.status).toBe(200);

    const response = await request(app.callback()).get('/api/fiddle/' + createResponse.body.id);
    expect(response.status).toBe(200);
    expect(response.body.success).toBeTruthy();
    expect(response.body.id).toBeTruthy();
    expect(response.body.files).toEqual([FILE1, FILE2]);
});

test('Create Fiddle & Add File', async () => {
    const createResponse = await request(app.callback()).post('/api/set-fiddle')
        .send({ files: [FILE1] });
    expect(createResponse.status).toBe(200);

    const updateResponse = await request(app.callback()).patch('/api/fiddle/' + createResponse.body.id)
        .send({ files: [FILE2] });
    expect(updateResponse.status).toBe(200);

    const response = await request(app.callback()).get('/api/fiddle/' + createResponse.body.id);
    expect(response.status).toBe(200);
    expect(response.body.success).toBeTruthy();
    expect(response.body.id).toBeTruthy();
    expect(response.body.files).toEqual([FILE1, FILE2]);
});

test('Create Fiddle & Update File', async () => {
    const createResponse = await request(app.callback()).post('/api/set-fiddle')
        .send({ files: [FILE1, FILE2] });
    expect(createResponse.status).toBe(200);

    const updateResponse = await request(app.callback()).patch('/api/fiddle/' + createResponse.body.id)
        .send({ files: [FILE2_UPDATED] });
    expect(updateResponse.status).toBe(200);

    const response = await request(app.callback()).get('/api/fiddle/' + createResponse.body.id);
    expect(response.status).toBe(200);
    expect(response.body.success).toBeTruthy();
    expect(response.body.id).toBeTruthy();
    expect(response.body.files).toEqual([FILE1, FILE2_UPDATED]);
});

