import pool from './config/db.js';

async function testGetExam() {
  const examId = process.argv[2] || 1; // Default to ID 1 or take from command line
  
  try {
    console.log(`Fetching exam with ID: ${examId}...`);
    
    const query = 'SELECT * FROM exams WHERE id = $1';
    const res = await pool.query(query, [examId]);
    
    if (res.rows.length === 0) {
      console.log(`No exam found with ID: ${examId}`);
      
      // List available exams so the user knows what's there
      const allExams = await pool.query('SELECT id, title FROM exams');
      console.log('\nAvailable exams in database:');
      allExams.rows.forEach(row => console.log(`ID: ${row.id} - Title: ${row.title}`));
    } else {
      const exam = res.rows[0];
      console.log('\n--- Exam Details ---');
      console.log(`ID: ${exam.id}`);
      console.log(`Title: ${exam.title}`);
      console.log(`Time Limit: ${exam.time_limit} mins`);
      console.log(`Passing Score: ${exam.passing_score}`);
      console.log(`Questions Count: ${exam.questions ? exam.questions.length : 0}`);
      
      console.log('\nQuestions JSON:');
      console.log(JSON.stringify(exam.questions, null, 2));
    }
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error fetching exam:');
    console.error(err.message);
    process.exit(1);
  }
}

testGetExam();
