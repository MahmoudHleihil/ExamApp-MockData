export const mockDb = {
  // רשימת משתמשים
  users: [
    {
      id: "u1",
      email: "admin@etest.com",
      password: "$2a$10$TtVDG/.tdNP/vIEScg0pBeDwg3ujMCCp2kdmeLurR/YpOeiGEgKwu",
      role: "Admin",
      fullName: "System Admin",
      isSuperAdmin: true,
      status: "active"
    },
    {
      id: "u2",
      email: "teacher@etest.com",
      password: "$2a$10$TtVDG/.tdNP/vIEScg0pBeDwg3ujMCCp2kdmeLurR/YpOeiGEgKwu",
      role: "Teacher",
      fullName: "Professor Smith",
      exams: ["1", "demo"],
      status: "active"
    },
    {
      id: "u3",
      email: "student@etest.com",
      password: "$2a$10$TtVDG/.tdNP/vIEScg0pBeDwg3ujMCCp2kdmeLurR/YpOeiGEgKwu",
      role: "Student",
      fullName: "John Doe",
      submissions: ["s1"],
      scores: [85],
      status: "active"
    }
  ],
  exams: [
    {
      id: "1",
      title: "React Fundamentals",
      timeLimit: 30, // minutes
      earlyAccessMinutes: 30,
      isAlwaysAvailable: false,
      releaseScoresImmediately: true,
      scheduledDate: "2026-06-01T10:00:00.000Z",
      passingScore: 60,
      questions: [
        {
          id: "q1",
          type: "multiple-choice",
          text: "What is JSX?",
          options: ["A CSS framework", "A syntax extension for JavaScript", "A database type", "A server-side language"],
          correctAnswer: "A syntax extension for JavaScript",
          points: 50
        },
        {
          id: "q2",
          type: "multiple-choice",
          text: "Which hook is used for side effects?",
          options: ["useState", "useMemo", "useEffect", "useContext"],
          correctAnswer: "useEffect",
          points: 50
        }
      ]
    },
    {
      id: "demo",
      title: "Full-Stack Web Mastery",
      password: "pass",
      timeLimit: 60,
      earlyAccessMinutes: 15,
      isAlwaysAvailable: true,
      releaseScoresImmediately: false,
      scheduledDate: "2026-05-30T10:00:00.000Z",
      passingScore: 70,
      questions: [
        {
          id: "d1",
          type: "multiple-choice",
          text: "Which of the following is NOT a JavaScript framework?",
          options: ["React", "Angular", "Vue", "Django"],
          correctAnswer: "Django",
          points: 25
        },
        {
          id: "d2",
          type: "true-false",
          text: "JavaScript is a statically typed language.",
          options: ["True", "False"],
          correctAnswer: "False",
          points: 25
        },
        {
          id: "d3",
          type: "multiple-response",
          text: "Which of these are HTTP methods? (Select all that apply)",
          options: ["GET", "POST", "PUSH", "DELETE"],
          correctAnswer: ["GET", "POST", "DELETE"],
          points: 25
        },
        {
          id: "d4",
          type: "written",
          text: "What does CSS stand for?",
          options: [],
          correctAnswer: "Cascading Style Sheets",
          points: 25
        }
      ]
    }
  ],
  studentScores: [
    {
      id: "s1",
      examId: "1",
      examTitle: "React Fundamentals",
      score: 85,
      studentName: "Student User",
      date: "2023-10-27T10:00:00.000Z",
      answers: { "q1": "A syntax extension for JavaScript", "q2": "useEffect" },
      feedback: "Great job on the fundamentals!",
      questionFeedback: { "q1": "Perfect!", "q2": "Well explained." },
      isFeedbackVisible: true
    },
    {
      id: "s2",
      examId: "demo",
      examTitle: "Full-Stack Web Mastery",
      score: 100,
      studentName: "Jane Smith",
      date: "2023-10-27T11:30:00.000Z",
      answers: { "d1": "Django", "d2": "False", "d3": ["GET", "POST", "DELETE"], "d4": "Cascading Style Sheets" },
      feedback: "",
      questionFeedback: {},
      isFeedbackVisible: false
    }
  ],
  notifications: [
    {
      id: '1',
      userId: 'admin-id',
      role: 'Admin',
      title: 'New Teacher Registration',
      message: 'A new teacher has registered and is awaiting approval.',
      time: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      type: 'approval'
    }
  ]
};
