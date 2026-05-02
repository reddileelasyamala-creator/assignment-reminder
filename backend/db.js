const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_edHOCgUIuV94@ep-jolly-silence-aogk30ve-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;