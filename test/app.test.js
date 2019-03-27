const supertest = require('supertest');
const app = require('../app');
const models = require('../models');

beforeAll(async () => {
    await models.sequelize.sync({ force: true });
    await app.sessionStore.Model.sync();
    app.sessionStore.synced = true;
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
    data: 'file contents'
};

const FILE2_UPDATED = {
    name: 'src/file2.txt',
    type: 'text',
    data: 'file contents 3'
};

const FILE_INDEX = {
    name: 'src/index.html',
    type: 'text',
    data: 'index contents'
};

const FILE_MAIN = {
    name: 'src/main.html',
    type: 'text',
    data: 'main contents'
};

let request = supertest(app.callback());

test('Create Fiddle No Content', async () => {
    const response = await request.post('/api/fiddle');
    expect(response.status).toBe(201);
    expect(response.body.success).toBeTruthy();
    expect(response.body.id).toBeTruthy();
    expect(response.body.id).toBe(response.body.id.toLowerCase());
});

test('Create & View Fiddle', async () => {
    const createResponse = await request.post('/api/fiddle')
        .send({ files: [FILE1, FILE2] });
    expect(createResponse.status).toBe(201);

    const response = await request.get('/api/fiddle/' + createResponse.body.id);
    expect(response.status).toBe(200);
    expect(response.body.success).toBeTruthy();
    expect(response.body.id).toBeTruthy();
    expect(response.body.files).toEqual([FILE1, FILE2]);
});

test('Create & View Fiddle Page', async () => {
    const createResponse = await request.post('/api/fiddle')
        .send({ files: [FILE1, FILE2] });
    expect(createResponse.status).toBe(201);

    const response = await request.get(`/app/${createResponse.body.id}/file1.txt`);
    expect(response.status).toBe(200);
    expect(response.type).toBe('text/plain');
    expect(response.text).toEqual(FILE1.data);
});

test('Create & View Fiddle Page Index', async () => {
    const createResponse = await request.post('/api/fiddle')
        .send({ files: [FILE1, FILE2, FILE_INDEX] });
    expect(createResponse.status).toBe(201);

    const response = await request.get(`/app/${createResponse.body.id}`);
    expect(response.status).toBe(200);
    expect(response.type).toBe('text/html');
    expect(response.text).toEqual(FILE_INDEX.data);
});

test('Create & View Fiddle Page Index (main.html)', async () => {
    const createResponse = await request.post('/api/fiddle')
        .send({ files: [FILE1, FILE2, FILE_MAIN] });
    expect(createResponse.status).toBe(201);

    const response = await request.get(`/app/${createResponse.body.id}`);
    expect(response.status).toBe(200);
    expect(response.type).toBe('text/html');
    expect(response.text).toEqual(FILE_MAIN.data);
});

test('Create Fiddle & Add File', async () => {
    // NOTE: request.agent creates client with cookie store
    const agent = supertest.agent(app.callback());
    const createResponse = await agent.post('/api/fiddle')
        .send({ files: [FILE1] });
    expect(createResponse.status).toBe(201);

    const updateResponse = await agent.patch('/api/fiddle/' + createResponse.body.id)
        .send({ files: [FILE2] });
    expect(updateResponse.status).toBe(204);

    const response = await agent.get('/api/fiddle/' + createResponse.body.id);
    expect(response.status).toBe(200);
    expect(response.body.success).toBeTruthy();
    expect(response.body.id).toBeTruthy();
    expect(response.body.files).toEqual([FILE1, FILE2]);
});

test('Create Fiddle & Update File', async () => {
    // NOTE: request.agent creates client with cookie store
    const agent = supertest.agent(app.callback());
    const createResponse = await agent.post('/api/fiddle')
        .send({ files: [FILE1, FILE2] });
    expect(createResponse.status).toBe(201);

    const updateResponse = await agent.patch('/api/fiddle/' + createResponse.body.id)
        .send({ files: [FILE2_UPDATED] });
    expect(updateResponse.status).toBe(204);

    const response = await agent.get('/api/fiddle/' + createResponse.body.id);
    expect(response.status).toBe(200);
    expect(response.body.success).toBeTruthy();
    expect(response.body.id).toBeTruthy();
    expect(response.body.files).toEqual([FILE1, FILE2_UPDATED]);
});

test('Create Fiddle & Update File Unauthorized', async () => {
    const createResponse = await request.post('/api/fiddle')
        .send({ files: [FILE1, FILE2] });
    expect(createResponse.status).toBe(201);

    const updateResponse = await request.patch('/api/fiddle/' + createResponse.body.id)
        .send({ files: [FILE2_UPDATED] });
    expect(updateResponse.status).toBe(403);
});


