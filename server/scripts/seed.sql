-- Seed Users
INSERT INTO users (id, email, password, role, full_name, is_super_admin, status) VALUES
(1, 'admin@etest.com', '$2a$10$TtVDG/.tdNP/vIEScg0pBeDwg3ujMCCp2kdmeLurR/YpOeiGEgKwu', 'Admin', 'System Admin', true, 'active'),
(2, 'teacher@etest.com', '$2a$10$TtVDG/.tdNP/vIEScg0pBeDwg3ujMCCp2kdmeLurR/YpOeiGEgKwu', 'Teacher', 'Professor Smith', false, 'active'),
(3, 'student@etest.com', '$2a$10$TtVDG/.tdNP/vIEScg0pBeDwg3ujMCCp2kdmeLurR/YpOeiGEgKwu', 'Student', 'John Doe', false, 'active');

-- Reset user sequence
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Seed Exams
INSERT INTO exams (id, title, time_limit, early_access_minutes, is_always_available, release_scores_immediately, scheduled_date, passing_score, questions) VALUES
(1, 'React Fundamentals', 30, 30, false, true, '2026-06-01 10:00:00', 60, '[
  {
    "id": "q1",
    "type": "multiple-choice",
    "text": "What is JSX?",
    "options": ["A CSS framework", "A syntax extension for JavaScript", "A database type", "A server-side language"],
    "correctAnswer": "A syntax extension for JavaScript",
    "points": 50
  },
  {
    "id": "q2",
    "type": "multiple-choice",
    "text": "Which hook is used for side effects?",
    "options": ["useState", "useMemo", "useEffect", "useContext"],
    "correctAnswer": "useEffect",
    "points": 50
  }
]'::jsonb),
(2, 'Full-Stack Web Mastery', 60, 15, true, false, '2026-05-30 10:00:00', 70, '[
  {
    "id": "d1",
    "type": "multiple-choice",
    "text": "Which of the following is NOT a JavaScript framework?",
    "options": ["React", "Angular", "Vue", "Django"],
    "correctAnswer": "Django",
    "points": 25
  },
  {
    "id": "d2",
    "type": "true-false",
    "text": "JavaScript is a statically typed language.",
    "options": ["True", "False"],
    "correctAnswer": "False",
    "points": 25
  },
  {
    "id": "d3",
    "type": "multiple-response",
    "text": "Which of these are HTTP methods? (Select all that apply)",
    "options": ["GET", "POST", "PUSH", "DELETE"],
    "correctAnswer": ["GET", "POST", "DELETE"],
    "points": 25
  },
  {
    "id": "d4",
    "type": "written",
    "text": "What does CSS stand for?",
    "options": [],
    "correctAnswer": "Cascading Style Sheets",
    "points": 25
  }
]'::jsonb);

-- Reset exam sequence
SELECT setval('exams_id_seq', (SELECT MAX(id) FROM exams));

-- Seed Submissions
INSERT INTO submissions (exam_id, user_id, student_name, score, date, answers, feedback, question_feedback, is_feedback_visible) VALUES
(1, 3, 'John Doe', 85, '2023-10-27 10:00:00', '{ "q1": "A syntax extension for JavaScript", "q2": "useEffect" }'::jsonb, 'Great job on the fundamentals!', '{ "q1": "Perfect!", "q2": "Well explained." }'::jsonb, true),
(2, NULL, 'Jane Smith', 100, '2023-10-27 11:30:00', '{ "d1": "Django", "d2": "False", "d3": ["GET", "POST", "DELETE"], "d4": "Cascading Style Sheets" }'::jsonb, '', '{}'::jsonb, false);

-- Seed Notifications
INSERT INTO notifications (user_id, role, title, message, read, type) VALUES
('admin-id', 'Admin', 'New Teacher Registration', 'A new teacher has registered and is awaiting approval.', false, 'approval');
