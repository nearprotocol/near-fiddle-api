module.exports = {
    development: {
        username: 'fiddle',
        password: 'fiddle',
        database: 'fiddle',
        host: '127.0.0.1',
        dialect: 'postgres',
    },
    test: {
        username: 'fiddle',
        password: 'fiddle',
        database: 'fiddle_test',
        host: '127.0.0.1',
        dialect: 'postgres',
    },
    ci: {
        username: 'fiddle',
        password: 'fiddle',
        database: 'fiddle_test',
        host: 'postgres',
        dialect: 'postgres',
    },
    production: {
        username: process.env.FIDDLE_DB_USERNAME || 'fiddle',
        password: process.env.FIDDLE_DB_PASSWORD || 'fiddle',
        database: process.env.FIDDLE_DB_NAME || 'fiddle',
        host: process.env.FIDDLE_DB_HOST || '127.0.0.1',
        dialect: 'postgres',
    },
};