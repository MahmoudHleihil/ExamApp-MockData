import pool from './config/db.js';

async function testConnection() {
  try {
    console.log('Testing connection to PostgreSQL...');
    const res = await pool.query('SELECT NOW()');
    console.log('Connection successful!');
    console.log('Current time from DB:', res.rows[0].now);
    
    // Check if we can see any tables
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tables in "public" schema:');
    if (tableRes.rows.length === 0) {
      console.log('No tables found.');
    } else {
      tableRes.rows.forEach(row => console.log(`- ${row.table_name}`));
    }
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error connecting to the database:');
    console.error(err.message);
    console.error('\nMake sure your .env file is configured correctly with:');
    console.error('DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT');
    process.exit(1);
  }
}

testConnection();
