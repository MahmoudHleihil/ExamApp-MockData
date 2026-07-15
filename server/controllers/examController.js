import ExamService from "../services/ExamService.js";

export const getAllExams = async (req, res, next) => {
    try {
        const exams = await ExamService.getAllExams();

        res.status(200).json(exams);

    } catch (err) {
        next(err);
    }
};

export const getExamById =
  async (req, res, next) => {
    try {
      const exam =
        await ExamService.getExam(
          req.params.id,
          req.user
        );

      res.json(exam);
    } catch (error) {
      next(error);
    }
  };

export const getExamForStudent = async (
  req,
  res,
  next
) => {
  try {
    const exam =
      await ExamService.getExamForStudent(
        req.params.id,
        req.user
      );

    res.json(exam);
  } catch (error) {
    next(error);
  }
};

export const getAvailableExams = async (
  req,
  res,
  next
) => {
  try {
    const exams =
      await ExamService.getUserExams(
        req.user
      );

    const sanitized =
      exams.map((exam) =>
        ExamService.sanitizeExamForUser(
          exam,
          req.user
        )
      );

    res.json(sanitized);
  } catch (error) {
    next(error);
  }
};

export const createExam = async (req, res, next) => {
    try {

        const exam = await ExamService.createExam(
            req.body,
            req.user
        );

        res.status(201).json(exam);

    } catch (err) {
        next(err);
    }
};

export const updateExam = async (
  req,
  res,
  next
) => {
  try {
    const examId =
      req.params.id ||
      req.params.examId;

    if (!examId) {
      const error = new Error(
        "Exam ID is required"
      );

      error.statusCode = 400;
      throw error;
    }

    const updatedExam =
      await ExamService.updateExam(
        examId,
        req.body,
        req.user
      );

    res.json(updatedExam);
  } catch (error) {
    next(error);
  }
};

export const deleteExam = async (req, res, next) => {
    try {

        await ExamService.deleteExam(
            req.params.id,
            req.user
        );

        res.json({
            success: true
        });

    } catch (err) {
        next(err);
    }
};

export const submitAnswers = async (
  req,
  res,
  next
) => {
  try {
    const submission =
      await ExamService.submitAnswers(
        {
          examId:
            req.body.examId,
          answers:
            req.body.answers,
        },
        req.user
      );

    res.status(201).json(
      submission
    );
  } catch (error) {
    next(error);
  }
};

export const submitScore = async (
  req,
  res,
  next
) => {
  try {
    const submission =
      await ExamService.submitAnswers(
        {
          examId:
            req.body.examId,

          answers:
            req.body.answers ||
            {},
        },
        req.user
      );

    res.status(201).json({
      success: true,
      submission,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllSubmissions = async (req, res, next) => {
    try {

        const submissions =
            await ExamService.getAllSubmissions(req.user);

        res.json(submissions);

    } catch (err) {
        next(err);
    }
};

export const getSubmissionsByStudent = async (req, res, next) => {
        try {
            const submissions = await ExamService.getSubmissionsByStudent(
            req.params.studentName,
            req.user
            );

            res.json(submissions);
        } catch (err) {
            next(err);
        }
    };

export const getStudentSubmissions =
  async (req, res, next) => {
    try {
      const submissions =
        await ExamService
          .getStudentSubmissions(
            req.user
          );

      res.json(submissions);
    } catch (error) {
      next(error);
    }
  };

export const updateSubmissionFeedback = async (
    req,
    res,
    next
) => {

    try {

        const submission =
            await ExamService.updateSubmissionFeedback(

                req.params.id,

                req.body,

                req.user

            );

        res.json(submission);

    } catch (err) {
        next(err);
    }
};

export const getStudentSubmissionReview =
  async (req, res, next) => {
    try {
      const review =
        await ExamService.getStudentSubmissionReview(
          req.params.submissionId,
          req.user
        );

      res.json({
        success: true,
        review,
      });
    } catch (error) {
      next(error);
    }
  };

export const verifyExamPassword = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await ExamService.verifyExamPassword(
        req.params.id,
        req.body.password,
        req.user
      );

    res.json(result);
  } catch (error) {
    next(error);
  }
};