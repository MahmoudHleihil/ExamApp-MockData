import ExamRepository from "../repositories/ExamRepository.js";
import SubmissionRepository from "../repositories/SubmissionRepository.js";
import { mockDb } from "../data/mockDb.js";
import NotificationService from "./NotificationService.js";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

function sanitizeExamForClient(exam) {
  if (!exam || typeof exam !== "object") {
    return exam;
  }

  const {
    password,
    passwordHash,
    password_hash,
    ...safeExam
  } = exam;

  const isPublished = Boolean(
    exam.isPublished ??
    exam.published
  );

  return {
    ...safeExam,

    published: isPublished,
    isPublished,

    passwordRequired: Boolean(
      passwordHash ||
      password_hash
    ),
  };
}

class ExamService {

    async getAllExams() {
        return await ExamRepository.findAll();
    }

    async getExam(id, user) {
    const exam =
        await ExamRepository.findById(id);

    if (!exam) {
        const error =
        new Error(
            "Exam not found"
        );

        error.statusCode = 404;
        throw error;
    }

    if (
        user.role === "Student" &&
        !exam.published &&
        !exam.isPublished
    ) {
        const error =
        new Error(
            "Exam is not published."
        );

        error.statusCode = 403;
        throw error;
    }

    return exam;
    }

    async getExamForStudent(
    examId,
    user
    ) {
    const exam =
        await ExamRepository.findById(
        examId
        );

    if (!exam) {
        const error =
        new Error("Exam not found");

        error.statusCode = 404;
        throw error;
    }

    if (
        !exam.published &&
        !exam.isPublished
    ) {
        const error =
        new Error(
            "Exam is not published"
        );

        error.statusCode = 403;
        throw error;
    }

    const now = new Date();

    if (!exam.isAlwaysAvailable) {
    const now = new Date();

    const scheduledDate =
        new Date(
        exam.scheduledDate
        );

    const earlyAccessDate =
        new Date(
        scheduledDate.getTime() -
            (
            exam.earlyAccessMinutes ||
            0
            ) *
            60_000
        );

    const expiryDate =
        new Date(
        scheduledDate.getTime() +
            (
            exam.timeLimit ||
            60
            ) *
            60_000
        );

    if (now < earlyAccessDate) {
        const error =
        new Error(
            "Exam is not available yet"
        );

        error.statusCode = 403;
        throw error;
    }

    if (now > expiryDate) {
        const error =
        new Error(
            "Exam has expired"
        );

        error.statusCode = 403;
        throw error;
    }
    }

    return {
        id: exam.id,
        title: exam.title,
        description:
        exam.description,
        subject: exam.subject,
        timeLimit:
        exam.timeLimit,
        earlyAccessMinutes:
        exam.earlyAccessMinutes,
        isAlwaysAvailable:
        exam.isAlwaysAvailable,
        scheduledDate:
        exam.scheduledDate,
        passingScore:
        exam.passingScore,
        passwordRequired:
        Boolean(
            exam.passwordHash
        ),

        questions:
        exam.questions.map(
            (question) => ({
            id: question.id,
            type: question.type,
            text:
                question.text ||
                question.question,
            options:
                question.options,
            points:
                question.points,
            })
        ),
    };
    }

    async submitAnswers(
    {
        examId,
        answers = {},
    },
    user
    ) {
        const exam =
            await ExamRepository.findById(
            examId
            );

        if (!exam) {
            const error =
            new Error("Exam not found");

            error.statusCode = 404;
            throw error;
        }

        if (!exam.published) {
            const error =
            new Error(
                "Exam is not published"
            );

            error.statusCode = 403;
            throw error;
        }

        const existingSubmission =
        await SubmissionRepository
            .findByStudentAndExam(
            user.id,
            examId
            );

        if (existingSubmission) {
        const error = new Error(
            "You have already submitted this exam."
        );

        error.statusCode = 409;
        throw error;
        }

        let earnedPoints = 0;
        let maxScore = 0;

        const gradedAnswers =
            exam.questions.map(
            (question) => {
                const points =
                Number(
                    question.points
                ) || 0;

                maxScore += points;

                const studentAnswer =
                answers[question.id];

                const correctAnswer =
                question.correctAnswer;

                let isCorrect = false;

                if (
                question.type ===
                "multiple-response"
                ) {
                const submitted =
                    Array.isArray(
                    studentAnswer
                    )
                    ? studentAnswer
                    : [];

                const expected =
                    Array.isArray(
                    correctAnswer
                    )
                    ? correctAnswer
                    : [];

                isCorrect =
                    submitted.length ===
                    expected.length &&
                    submitted.every(
                    (value) =>
                        expected.includes(
                        value
                        )
                    );
                } else if (
                question.type ===
                "written"
                ) {
                isCorrect =
                    typeof studentAnswer ===
                    "string" &&
                    typeof correctAnswer ===
                    "string" &&
                    studentAnswer
                    .trim()
                    .toLowerCase() ===
                    correctAnswer
                        .trim()
                        .toLowerCase();
                } else {
                isCorrect =
                    studentAnswer ===
                    correctAnswer;
                }

                const awardedPoints =
                isCorrect ? points : 0;

                earnedPoints +=
                awardedPoints;

                return {
                questionId:
                    question.id,
                answer:
                    studentAnswer ?? null,
                isCorrect,
                awardedPoints,
                };
            }
            );

        const percentage =
            maxScore > 0
            ? Math.round(
                (
                    earnedPoints /
                    maxScore
                ) *
                    100
                )
            : 0;

        try {
            return SubmissionRepository.create({
                examId,
                studentId: user.id,
                status:
                "submitted",
                score: earnedPoints,
                maxScore,
                percentage,
                submittedAt:
                new Date(),
                answers:
                gradedAnswers,
                isFeedbackVisible:
                false,
                isScorePublished:
                Boolean(
                    exam
                    .releaseScoresImmediately
                ),
            });
        } catch (error) {
            if (error?.code === "23505") {
                const conflict =
                new Error(
                    "You have already submitted this exam."
                );

                conflict.statusCode = 409;
                throw conflict;
            }
        }
        throw error;
    }

    async createExam(examData, user) {
        if (!user?.id) {
            const error = new Error(
            "Authenticated user is required"
            );

            error.statusCode = 401;
            throw error;
        }

        if (
            !["Teacher", "Admin"].includes(
            user.role
            )
        ) {
            const error = new Error(
            "Forbidden: Only teachers and admins can create exams"
            );

            error.statusCode = 403;
            throw error;
        }

        const plainPassword =
        typeof examData.password === "string"
            ? examData.password.trim()
            : "";

        const passwordHash =
        plainPassword
            ? await bcrypt.hash(
                plainPassword,
                12
            )
            : null;

        const examToCreate = {
            ...examData,    
            createdBy: user.id,
            passwordHash,
            published: false,
            isPublished: false,

            createdAt: undefined,
            updatedAt: undefined,
        };

        delete examToCreate.password;

        const createdExam = await ExamRepository.create(examToCreate);
        return sanitizeExamForClient(createdExam);
    }

    async updateExam(
    examId,
    updates,
    user
    ) {
    const existingExam =
        await ExamRepository.findById(
        examId
        );

    if (!existingExam) {
        const error = new Error(
        `Exam not found: ${examId}`
        );

        error.statusCode = 404;
        throw error;
    }

    const isOwner =
        String(existingExam.createdBy) ===
        String(user.id);

    if (
        user.role !== "Admin" &&
        !isOwner
    ) {
        const error = new Error(
        "You are not allowed to update this exam"
        );

        error.statusCode = 403;
        throw error;
    }

    const safeUpdates = {
        ...updates,
    };

    /*
    * Normalize publication field.
    */
    if (
        safeUpdates.published ===
        undefined &&
        safeUpdates.isPublished !==
        undefined
    ) {
        safeUpdates.published =
        safeUpdates.isPublished;
    }

    delete safeUpdates.isPublished;

    /*
    * Prevent immutable or server-owned
    * fields from being modified.
    */
    delete safeUpdates.id;
    delete safeUpdates.createdBy;
    delete safeUpdates.teacherId;
    delete safeUpdates.teacherEmail;
    delete safeUpdates.createdAt;
    delete safeUpdates.updatedAt;

    /*
    * Hash a newly supplied password.
    *
    * An empty password explicitly removes
    * password protection.
    */
    if (
        Object.prototype.hasOwnProperty.call(
        safeUpdates,
        "password"
        )
    ) {
        const password =
        String(
            safeUpdates.password || ""
        ).trim();

        safeUpdates.passwordHash =
        password
            ? await bcrypt.hash(
                password,
                12
            )
            : null;
    }

    /*
    * Never pass plaintext passwords to
    * the repository.
    */
    delete safeUpdates.password;

    const updatedExam =
        await ExamRepository.update(
        examId,
        safeUpdates
        );

    if (!updatedExam) {
        const error =
        new Error("Exam not found");

        error.statusCode = 404;
        throw error;
    }

    return sanitizeExamForClient(
        updatedExam
    );
    }

    async deleteExam(examId, user) {
    const exam =
        await ExamRepository.findById(examId);

    if (!exam) {
        const error = new Error("Exam not found");
        error.statusCode = 404;
        throw error;
    }

    if (
        user.role !== "Admin" &&
        exam.createdBy !== user.id
    ) {
        const error = new Error(
        "You are not allowed to delete this exam"
        );

        error.statusCode = 403;
        throw error;
    }

    const deleted =
        await ExamRepository.delete(examId);

    if (!deleted) {
        const error = new Error(
        "Exam could not be deleted"
        );

        error.statusCode = 500;
        throw error;
    }

    return deleted;
    }

    async submitScore(
    scoreData,
    user
    ) {
        if (!user?.id) {
            const error = new Error(
            "Authentication required"
            );

            error.statusCode = 401;
            throw error;
        }

        if (user.role !== "Student") {
            const error = new Error(
            "Only students can submit exams"
            );

            error.statusCode = 403;
            throw error;
        }

        const exam =
            await ExamRepository.findById(
            scoreData.examId
            );

        if (!exam) {
            const error =
            new Error("Exam not found");

            error.statusCode = 404;
            throw error;
        }

        if (
            !exam.published &&
            !exam.isPublished
        ) {
            const error = new Error(
            "This exam is not published"
            );

            error.statusCode = 403;
            throw error;
        }
        const createdSubmission =
        await SubmissionRepository.create({
            ...scoreData,
            studentId: user.id,
            status: "submitted",
        });

        return createdSubmission;
    }

    async getMyScores(user) {
    const submissions =
        await this.getMySubmissions(
        user
        );

    return submissions
        .filter(
        (submission) =>
            submission.isScorePublished
        )
        .map((submission) => ({
        submissionId:
            submission.id,

        examId:
            submission.examId,

        examTitle:
            submission.examTitle,

        score:
            submission.score,

        maxScore:
            submission.maxScore,

        percentage:
            submission.percentage,

        submittedAt:
            submission.submittedAt,
        }));
    }
    
    isAnswerCorrect(
    submittedAnswer,
    correctAnswer
    ) {
    if (Array.isArray(correctAnswer)) {
        if (
        !Array.isArray(
            submittedAnswer
        )
        ) {
        return false;
        }

        const submitted = [
        ...submittedAnswer,
        ]
        .map(String)
        .map((value) =>
            value.trim()
        )
        .sort();

        const expected = [
        ...correctAnswer,
        ]
        .map(String)
        .map((value) =>
            value.trim()
        )
        .sort();

        return (
        JSON.stringify(submitted) ===
        JSON.stringify(expected)
        );
    }

    return (
        String(
        submittedAnswer ?? ""
        )
        .trim()
        .toLowerCase() ===
        String(
        correctAnswer ?? ""
        )
        .trim()
        .toLowerCase()
    );
    }

    sanitizeSubmissionForUser(
    submission,
    user
    ) {
    if (!submission) return null;

    if (
        user.role === "Student" &&
        submission.studentId !== user.id
    ) {
        const error = new Error(
        "Forbidden"
        );

        error.statusCode = 403;
        throw error;
    }

    const base = {
        id: submission.id,
        examId: submission.examId,
        examTitle:
        submission.examTitle,

        studentId:
        submission.studentId,

        studentName:
        submission.studentName,

        status: submission.status,
        submittedAt:
        submission.submittedAt,
        date: submission.date,
    };

    if (
        user.role === "Student" &&
        !submission.isScorePublished
    ) {
        return {
        ...base,
        score: null,
        maxScore: null,
        percentage: null,
        feedback: "",
        questionFeedback: {},
        isScorePublished: false,
        isFeedbackVisible: false,
        };
    }

    return {
        ...base,

        score: submission.score,
        maxScore:
        submission.maxScore,

        percentage:
        submission.percentage,

        feedback:
        submission.isFeedbackVisible ||
        user.role !== "Student"
            ? submission.feedback
            : "",

        questionFeedback:
        submission.isFeedbackVisible ||
        user.role !== "Student"
            ? submission.questionFeedback
            : {},

        isScorePublished:
        submission.isScorePublished,

        isFeedbackVisible:
        submission.isFeedbackVisible,

        answers:
        user.role === "Student"
            ? submission.answers
            : submission.answers,

        answerDetails:
        user.role === "Student"
            ? undefined
            : submission.answerDetails,
    };
    }

    async getAllSubmissions(user) {
    if (
        !["Teacher", "Admin"].includes(
        user.role
        )
    ) {
        const error = new Error(
        "Teacher or Admin access required"
        );

        error.statusCode = 403;
        throw error;
    }

    let submissions =
        await SubmissionRepository.findAll();

    if (user.role === "Teacher") {
        const teacherExams =
        await ExamRepository.findByCreator(
            user.id
        );

        const allowedExamIds =
        new Set(
            teacherExams.map(
            (exam) => exam.id
            )
        );

        submissions =
        submissions.filter(
            (submission) =>
            allowedExamIds.has(
                submission.examId
            )
        );
    }

    return submissions.map(
        (submission) =>
        this.sanitizeSubmissionForUser(
            submission,
            user
        )
    );
    }

    async getStudentSubmissions(user) {
        if (!user?.id) {
            const error =
            new Error(
                "Authentication required"
            );

            error.statusCode = 401;
            throw error;
        }

        return SubmissionRepository
            .findByStudentId(
            user.id
            );
    }

    async getMySubmissions(user) {
    if (user.role !== "Student") {
        const error = new Error(
        "Student access required"
        );

        error.statusCode = 403;
        throw error;
    }

    const submissions =
        await SubmissionRepository
        .findByStudentId(user.id);

    return submissions.map(
        (submission) =>
        this.sanitizeSubmissionForUser(
            submission,
            user
        )
    );
    }

    async getSubmissionsByStudent(studentName, user) {
        if (user.role === "Student" && user.fullName !== studentName) {
            const error = new Error("Forbidden");
            error.statusCode = 403;
            throw error;
        }

        return mockDb.studentScores.filter(
            (s) => s.studentName === studentName
        );
    }

    async updateSubmissionFeedback(
    submissionId,
    updates,
    user
    ) {
    if (!user?.id) {
        const error = new Error(
        "Authentication required"
        );
        error.statusCode = 401;
        throw error;
    }

    const submission =
        await SubmissionRepository.findById(
        submissionId
        );

    if (!submission) {
        const error = new Error(
        "Submission not found"
        );
        error.statusCode = 404;
        throw error;
    }

    const exam =
        await ExamRepository.findById(
        submission.examId
        );

    if (!exam) {
        const error =
        new Error("Exam not found");
        error.statusCode = 404;
        throw error;
    }

    const isOwner =
        String(exam.createdBy) ===
        String(user.id);

    if (
        user.role !== "Admin" &&
        !isOwner
    ) {
        const error = new Error(
        "You cannot update feedback for another teacher's exam."
        );
        error.statusCode = 403;
        throw error;
    }

    return SubmissionRepository.updateFeedback(
        submissionId,
        {
        feedback:
            updates.feedback ?? "",

        questionFeedback:
            updates.questionFeedback ?? {},

        isFeedbackVisible:
            Boolean(
            updates.isFeedbackVisible
            ),

        gradedBy: user.id,
        }
    );
    }
    
    async getUserExams(user) {
        const exams = await ExamRepository.findAll();

        // const exams = this.sanitizeExamForUser(unsanitizedExams, user);
        if (user.role === "Admin") {
            return exams;
        }

        if (user.role === "Teacher") {
            return exams.filter(
            (exam) =>
                exam.createdBy === user.id ||
                exam.teacherId === user.id ||
                exam.teacherEmail === user.email
            );
        }

        if (user.role === "Student") {
            return exams.filter(
            (exam) =>
                exam.published === true ||
                exam.isPublished === true
            );
        }

        return [];
    }

    async publishExam(examId, user) {
        const exam = await ExamRepository.findById(examId);

        if (!exam) {
            const error = new Error("Exam not found");
            error.statusCode = 404;
            throw error;
        }

        if (user.role !== "Admin" && exam.createdBy !== user.id) {
            const error = new Error("Forbidden");
            error.statusCode = 403;
            throw error;
        }

        return await ExamRepository.update(examId, {
            published: true,
            isPublished: true,
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }

    async getExamStatistics(
    examId,
    user
    ) {
    const exam =
        await ExamRepository.findById(
        examId
        );

    if (!exam) {
        const error = new Error(
        "Exam not found"
        );

        error.statusCode = 404;
        throw error;
    }

    const isOwner =
        exam.createdBy === user.id;

    if (
        user.role !== "Admin" &&
        !isOwner
    ) {
        const error = new Error(
        "Forbidden"
        );

        error.statusCode = 403;
        throw error;
    }

    const statistics =
        await SubmissionRepository
        .getExamStatistics(examId);

    const submissions =
        await SubmissionRepository
        .findByExam(examId);

    return {
        ...statistics,

        submissions:
        submissions.map(
            (submission) => ({
            submissionId:
                submission.id,

            studentId:
                submission.studentId,

            studentName:
                submission.studentName,

            score:
                submission.score,

            percentage:
                submission.percentage,

            status:
                submission.status,

            scorePublished:
                submission.isScorePublished,

            feedbackVisible:
                submission.isFeedbackVisible,

            submittedAt:
                submission.submittedAt,
            })
        ),
    };
    }

    async findExamByTitle(title) {
    const exams = await ExamRepository.findAll();

    return exams.find(
        (exam) =>
        exam.title.toLowerCase() === title.toLowerCase()
    );
    }

    async gradeSubmission(
    submissionId,
    gradingData,
    user
    ) {
    if (
        !["Teacher", "Admin"].includes(
        user.role
        )
    ) {
        const error = new Error(
        "Teacher or Admin access required"
        );

        error.statusCode = 403;
        throw error;
    }

    const submission =
        await SubmissionRepository.findById(
        submissionId
        );

    if (!submission) {
        const error = new Error(
        "Submission not found"
        );

        error.statusCode = 404;
        throw error;
    }

    const exam =
        await ExamRepository.findById(
        submission.examId
        );

    if (
        user.role !== "Admin" &&
        exam.createdBy !== user.id
    ) {
        const error = new Error(
        "You cannot grade this submission"
        );

        error.statusCode = 403;
        throw error;
    }

    const answerDetails = Array.isArray(
    submission.answerDetails
    )
    ? submission.answerDetails
    : [];

    const gradingAnswers = Array.isArray(
    gradingData.answers
    )
    ? gradingData.answers
    : [];

    const answerUpdates =
    answerDetails.map((answer) => {
        const update =
        gradingAnswers.find(
            (item) =>
            String(item.questionId) ===
            String(answer.questionId)
        );

        return {
        questionId:
            answer.questionId,

        answer:
            answer.answer ?? null,

        isCorrect:
            update?.isCorrect ??
            answer.isCorrect ??
            null,

        awardedPoints:
            update?.awardedPoints ??
            answer.awardedPoints ??
            0,

        feedback:
            update?.feedback ??
            answer.feedback ??
            "",
        };
    });

    const score =
        answerUpdates.reduce(
        (total, answer) =>
            total +
            Number(
            answer.awardedPoints || 0
            ),
        0
        );

    const maxScore =
        exam.questions.reduce(
        (total, question) =>
            total +
            Number(question.points || 0),
        0
        );

    const percentage =
        maxScore > 0
        ? Number(
            (
                (score / maxScore) *
                100
            ).toFixed(2)
            )
        : 0;

        return await SubmissionRepository.updateGrade(
            submissionId,
            {
                score,
                maxScore,
                percentage,

                feedback:
                    gradingData.feedback || "",

                isFeedbackVisible:
                    Boolean(gradingData.isFeedbackVisible),

                isScorePublished:
                    Boolean(gradingData.isScorePublished),

                gradedBy: user.id,

                answers: answerUpdates,
            }
        );
    }

    async publishSubmissionScore(
    submissionId,
    user
    ) {
    const submission =
        await SubmissionRepository.findById(
        submissionId
        );

    if (!submission) {
        const error = new Error(
        "Submission not found"
        );

        error.statusCode = 404;
        throw error;
    }

    const exam =
        await ExamRepository.findById(
        submission.examId
        );

    if (
        user.role !== "Admin" &&
        exam.createdBy !== user.id
    ) {
        const error = new Error(
        "Forbidden"
        );

        error.statusCode = 403;
        throw error;
    }

    return SubmissionRepository
        .publishScore(submissionId);
    }

    sanitizeExamForUser(exam, user) {
    const base = {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        subject: exam.subject,
        difficulty: exam.difficulty,
        published: exam.published,
        timeLimit: exam.timeLimit,
        scheduledDate: exam.scheduledDate,
        passingScore: exam.passingScore,
    };

    if (user.role === "Student") {
        return {
        ...base,

        questions: exam.questions.map(
            ({
            correctAnswer,
            sourceEvidence,
            ...question
            }) => question
        ),
        };
    }

    return {
        ...base,
        questions: exam.questions,
        createdBy: exam.createdBy,
        releaseScoresImmediately:
        exam.releaseScoresImmediately,
        sourceDocumentId:
        exam.sourceDocumentId,
        sourceDocumentTitle:
        exam.sourceDocumentTitle,
    };
    }

    async getStudentSubmissionReview(
    submissionId,
    user
    ) {
    if (!user?.id) {
        const error =
        new Error(
            "Authentication required"
        );

        error.statusCode = 401;
        throw error;
    }

    const submission =
        await SubmissionRepository.findById(
        submissionId
        );

    if (!submission) {
        const error =
        new Error(
            "Submission not found"
        );

        error.statusCode = 404;
        throw error;
    }

    if (
        String(submission.studentId) !==
        String(user.id)
    ) {
        const error =
        new Error(
            "You cannot access another student's submission."
        );

        error.statusCode = 403;
        throw error;
    }

    const exam =
        await ExamRepository.findById(
        submission.examId
        );

    if (!exam) {
        const error =
        new Error("Exam not found");

        error.statusCode = 404;
        throw error;
    }

    const questionsById =
        new Map(
        exam.questions.map(
            (question) => [
            String(question.id),
            question,
            ]
        )
        );

    const answerDetails =
        Array.isArray(
        submission.answerDetails
        )
        ? submission.answerDetails
        : [];

    const questions =
        answerDetails.map(
        (answer) => {
            const question =
            questionsById.get(
                String(
                answer.questionId
                )
            );

            return {
            questionId:
                answer.questionId,

            text:
                question?.text ||
                question?.question ||
                "",

            type:
                question?.type ||
                null,

            options:
                question?.options ||
                [],

            points:
                Number(
                question?.points ||
                0
                ),

            studentAnswer:
                answer.answer,

            awardedPoints:
                answer.awardedPoints ===
                null
                ? null
                : Number(
                    answer.awardedPoints
                    ),

            isCorrect:
                submission.isFeedbackVisible
                ? answer.isCorrect
                : undefined,

            feedback:
                submission.isFeedbackVisible
                ? answer.feedback || ""
                : "",
            };
        }
        );

    return {
        id: submission.id,
        examId: submission.examId,
        examTitle:
        submission.examTitle ||
        exam.title,

        status:
        submission.status,

        score:
        submission.isScorePublished
            ? Number(
                submission.score
            )
            : null,

        maxScore:
        Number(
            submission.maxScore ||
            0
        ),

        percentage:
        submission.isScorePublished
            ? Number(
                submission.percentage
            )
            : null,

        feedback:
        submission.isFeedbackVisible
            ? submission.feedback ||
            ""
            : "",

        isFeedbackVisible:
        Boolean(
            submission.isFeedbackVisible
        ),

        isScorePublished:
        Boolean(
            submission.isScorePublished
        ),

        submittedAt:
        submission.submittedAt,

        gradedAt:
        submission.gradedAt,

        questions,
    };
    }

    async verifyExamPassword(
    examId,
    password,
    user
    ) {
        if (!user?.id) {
            const error = new Error(
            "Authentication required"
            );
            error.statusCode = 401;
            throw error;
        }

        const exam =
            await ExamRepository.findById(
            examId
            );

        if (!exam) {
            const error =
            new Error("Exam not found");
            error.statusCode = 404;
            throw error;
        }

        if (
            !exam.published &&
            !exam.isPublished
        ) {
            const error = new Error(
            "Exam is not published"
            );
            error.statusCode = 403;
            throw error;
        }

        if (!exam.passwordHash) {
            return {
            success: true,
            passwordRequired: false,
            };
        }

        const matches =
            await bcrypt.compare(
            String(password || ""),
            exam.passwordHash
            );

        if (!matches) {
            console.warn(
            "Incorrect exam password attempt",
            {
                examId,
                studentId: user.id,
            }
            );
            
            const error = new Error(
            "Incorrect exam password"
            );
            error.statusCode = 403;
            throw error;
        }

        return {
            success: true,
            passwordRequired: true,
        };
    }
}

export default new ExamService();