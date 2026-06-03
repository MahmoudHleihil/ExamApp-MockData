import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDb() {
  try {
    console.log('Seeding database with initial data...');
    
    const sqlPath = path.join(__dirname, 'seed.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('Database seeded successfully!');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:');
    console.error(err.message);
    process.exit(1);
  }
}

seedDb();
