const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
    user: env.DB_USER,
    host: env.DB_HOST,
    database: env.DB_NAME,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
});

pool.on('connect', () => {
    console.log('✅ PostgreSQL pool connected');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error:', err.message);
    process.exit(-1);
});

module.exports = pool;
