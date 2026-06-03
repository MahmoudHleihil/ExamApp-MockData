import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDb() {
  try {
    console.log('Initializing database tables...');
    
    const sqlPath = path.join(__dirname, 'initDb.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('Tables created successfully!');
    
    // Optional: Seed initial admin user if needed
    // const adminRes = await pool.query('SELECT * FROM users WHERE role = $1', ['Admin']);
    // if (adminRes.rows.length === 0) {
    //   console.log('Creating default admin user...');
    //   // Note: You should hash the password before inserting
    //   // This is just a placeholder
    // }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:');
    console.error(err.message);
    process.exit(1);
  }
}

initDb();
