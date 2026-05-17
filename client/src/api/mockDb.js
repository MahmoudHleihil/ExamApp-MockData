export const mockDb = {
  exams: [
    {
      id: "1",
      title: "React Fundamentals",
      questions: [
        {
          id: "q1",
          type: "multiple-choice",
          text: "What is JSX?",
          options: ["A CSS framework", "A syntax extension for JavaScript", "A database type", "A server-side language"],
          correctAnswer: "A syntax extension for JavaScript"
        },
        {
          id: "q2",
          type: "multiple-choice",
          text: "Which hook is used for side effects?",
          options: ["useState", "useMemo", "useEffect", "useContext"],
          correctAnswer: "useEffect"
        }
      ]
    },
    {
      id: "demo",
      title: "Full-Stack Web Mastery",
      password: "123",
      questions: [
        {
          id: "d1",
          type: "multiple-choice",
          text: "Which of the following is NOT a JavaScript framework?",
          options: ["React", "Angular", "Vue", "Django"],
          correctAnswer: "Django"
        },
        {
          id: "d2",
          type: "true-false",
          text: "JavaScript is a statically typed language.",
          options: ["True", "False"],
          correctAnswer: "False"
        },
        {
          id: "d3",
          type: "multiple-response",
          text: "Which of these are HTTP methods? (Select all that apply)",
          options: ["GET", "POST", "PUSH", "DELETE"],
          correctAnswer: ["GET", "POST", "DELETE"]
        },
        {
          id: "d4",
          type: "written",
          text: "What does CSS stand for?",
          options: [],
          correctAnswer: "Cascading Style Sheets"
        }
      ]
    }
  ],
  studentScores: []
};
