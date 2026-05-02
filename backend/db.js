const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'assignment_db',
  password: '1234', // Replace with your real password
  port: 5432,
});

module.exports = pool;