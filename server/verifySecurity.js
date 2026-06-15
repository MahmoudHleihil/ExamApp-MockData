import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function runSecurityTests() {
  console.log('--- Starting Security Validation ---');

  let cookie = '';
  
  // 1. Test Login and Cookie Issuance
  console.log('\n[1] Testing Login & HttpOnly Cookie...');
  try {
    const loginRes = await axios.post(`${API_URL}/users/login`, {
      email: 'student@etest.com',
      password: 'password123'
    });
    
    const setCookie = loginRes.headers['set-cookie'];
    if (setCookie && setCookie[0].includes('etest_token') && setCookie[0].includes('HttpOnly')) {
      console.log('✅ PASS: HttpOnly cookie issued on login.');
      cookie = setCookie[0].split(';')[0];
    } else {
      console.error('❌ FAIL: HttpOnly cookie NOT found in headers.');
      console.log('Headers received:', loginRes.headers);
    }
  } catch (error) {
    console.error('❌ FAIL: Login request failed:', error.message);
  }

  // 2. Test CSP Headers
  console.log('\n[2] Testing Content Security Policy (CSP) Headers...');
  try {
    const healthRes = await axios.get(`${API_URL}/health`);
    const csp = healthRes.headers['content-security-policy'];
    if (csp) {
      console.log('✅ PASS: CSP Header present.');
      console.log('CSP Policy:', csp.substring(0, 100) + '...');
    } else {
      console.error('❌ FAIL: CSP Header missing.');
    }
  } catch (error) {
    console.error('❌ FAIL: Health check failed:', error.message);
  }

  // 3. Test Protected Route (Access Control)
  console.log('\n[3] Testing Cookie Access Control...');
  try {
    // Attempt without cookie
    try {
      await axios.get(`${API_URL}/exams`);
      console.error('❌ FAIL: Accessed protected route without cookie.');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ PASS: Blocked access without cookie (401).');
      } else {
        console.error('❌ FAIL: Unexpected error status:', error.response?.status);
      }
    }

    // Attempt with cookie
    const examsRes = await axios.get(`${API_URL}/exams`, {
      headers: { Cookie: cookie }
    });
    if (examsRes.status === 200) {
      console.log('✅ PASS: Granted access with valid cookie.');
    }
  } catch (error) {
    console.error('❌ FAIL: Protected route test error:', error.message);
  }

  // 4. Test Backend Score Validation
  console.log('\n[4] Testing Backend Score Validation (Anti-Cheat)...');
  try {
    // We'll submit answers for the '1' (React Fundamentals) exam
    // q1 correct: "A syntax extension for JavaScript" (50 pts)
    // q2 correct: "useEffect" (50 pts)
    // We'll send WRONG answers but try to claim 100% score
    const submissionData = {
      examId: '1',
      studentName: 'Security Tester',
      answers: {
        'q1': 'WRONG ANSWER',
        'q2': 'WRONG ANSWER'
      },
      score: 100 // THE "CHEAT" - trying to claim 100%
    };

    const submitRes = await axios.post(`${API_URL}/exams/submit`, submissionData, {
      headers: { Cookie: cookie }
    });

    if (submitRes.data.score === 0) {
      console.log('✅ PASS: Backend ignored fake score and calculated correct one (0%).');
    } else {
      console.error('❌ FAIL: Backend accepted fake score or calculated wrong:', submitRes.data.score);
    }
  } catch (error) {
    console.error('❌ FAIL: Score validation test error:', error.message);
    if (error.response) console.log('Data:', error.response.data);
  }

  console.log('\n--- Security Validation Complete ---');
}

runSecurityTests();
