import React, { useState } from 'react';
import TeacherDashboard from './components/TeacherDashboard';
import StudentPortal from './components/StudentPortal';

function App() {
  const [role, setRole] = useState('student'); // 'student' or 'teacher'

  const toggleRole = () => {
    setRole(prevRole => prevRole === 'student' ? 'teacher' : 'student');
  };

  return (
    <div className="container py-5">
      <header className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <h1 className="h3 text-primary m-0">E-Test System</h1>
        <div className="d-flex align-items-center">
          <span className="me-3 text-muted">Viewing as: <strong>{role.toUpperCase()}</strong></span>
          <button 
            className={`btn ${role === 'student' ? 'btn-outline-dark' : 'btn-outline-info'}`}
            onClick={toggleRole}
          >
            Switch to {role === 'student' ? 'Teacher' : 'Student'} View
          </button>
        </div>
      </header>

      <main>
        {role === 'teacher' ? (
          <TeacherDashboard />
        ) : (
          <StudentPortal />
        )}
      </main>

      <footer className="mt-5 pt-4 border-top text-center text-muted">
        <small>E-Test Mock Implementation &copy; 2026</small>
      </footer>
    </div>
  );
}

export default App;
