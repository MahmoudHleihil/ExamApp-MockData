import pool from './config/db.js';

async function runQueries() {
  try {
    console.log('--- Query 1: All Users ---');
    const usersRes = await pool.query('SELECT id, email, full_name, role FROM users');
    console.table(usersRes.rows);

    console.log('\n--- Query 2: All Exams ---');
    const examsRes = await pool.query('SELECT id, title, passing_score, time_limit FROM exams');
    console.table(examsRes.rows);

    console.log('\n--- Query 3: Submissions (Users joined with Exams) ---');
    const joinQuery = `
      SELECT 
        s.id AS submission_id,
        u.full_name AS student_name,
        e.title AS exam_title,
        s.score,
        s.date
      FROM submissions s
      LEFT JOIN users u ON s.user_id = u.id
      JOIN exams e ON s.exam_id = e.id
      ORDER BY s.date DESC
    `;
    const joinRes = await pool.query(joinQuery);
    
    if (joinRes.rows.length === 0) {
      console.log('No submissions found.');
    } else {
      console.table(joinRes.rows);
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error running queries:');
    console.error(err.message);
    process.exit(1);
  }
}

runQueries();
