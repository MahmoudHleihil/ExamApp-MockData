export const mockDb = {
  exams: [
    {
      id: "1",
      title: "React Fundamentals",
      questions: [
        {
          id: "q1",
          text: "What is JSX?",
          options: ["A CSS framework", "A syntax extension for JavaScript", "A database type", "A server-side language"],
          correctAnswer: "A syntax extension for JavaScript"
        },
        {
          id: "q2",
          text: "Which hook is used for side effects?",
          options: ["useState", "useMemo", "useEffect", "useContext"],
          correctAnswer: "useEffect"
        }
      ]
    },
    {
      id: "2",
      title: "Node.js Basics",
      questions: [
        {
          id: "q1",
          text: "Which module is used for file system operations?",
          options: ["http", "path", "fs", "url"],
          correctAnswer: "fs"
        }
      ]
    }
  ],
  studentScores: []
};
