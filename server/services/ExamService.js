import ExamRepository from "../repositories/ExamRepository.js";
import SubmissionRepository from "../repositories/SubmissionRepository.js";
import { mockDb } from "../data/mockDb.js";
import NotificationService from "./NotificationService.js";
import { randomUUID } from "crypto";

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

    return await ExamRepository.create({
        ...examData,

        createdBy: user.id,

        published: false,
        isPublished: false,

        createdAt: undefined,
        updatedAt: undefined,
    });
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
        existingExam.createdBy ===
        user.id;

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

    const normalizedUpdates = {
        ...updates,
    };

    if (
        normalizedUpdates.published ===
        undefined &&
        normalizedUpdates.isPublished !==
        undefined
    ) {
        normalizedUpdates.published =
        normalizedUpdates.isPublished;
    }

    delete normalizedUpdates.isPublished;
    delete normalizedUpdates.id;
    delete normalizedUpdates.createdBy;
    delete normalizedUpdates.teacherId;
    delete normalizedUpdates.teacherEmail;
    delete normalizedUpdates.createdAt;
    delete normalizedUpdates.updatedAt;

    return ExamRepository.update(
        examId,
        normalizedUpdates
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

    return SubmissionRepository.create({
        ...scoreData,

        studentId: user.id,

        studentName:
        user.fullName ||
        user.name ||
        scoreData.studentName,
    });
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
        .findByStudent(user.id);

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

    async updateSubmissionFeedback(id, data, user) {
        const index = mockDb.studentScores.findIndex((s) => s.id === id);

        if (index === -1) {
            const error = new Error("Submission not found");
            error.statusCode = 404;
            throw error;
        }

        mockDb.studentScores[index] = {
            ...mockDb.studentScores[index],
            feedback: data.feedback,
            questionFeedback: data.questionFeedback,
            isFeedbackVisible: data.isFeedbackVisible,
            score:
            data.score !== undefined
                ? data.score
                : mockDb.studentScores[index].score,
        };

        return mockDb.studentScores[index];
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

    const answerUpdates =
        submission.answerDetails.map(
        (answer) => {
            const update =
            gradingData.answers?.find(
                (item) =>
                item.questionId ===
                answer.questionId
            );

            return {
            ...answer,

            awardedPoints:
                update?.awardedPoints ??
                answer.awardedPoints,

            feedback:
                update?.feedback ??
                answer.feedback,
            };
        }
        );

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

    return SubmissionRepository.update(
        submissionId,
        {
        answers: answerUpdates,
        score,
        maxScore,
        percentage,
        feedback:
            gradingData.feedback ??
            submission.feedback,

        status: "graded",
        gradedBy: user.id,
        gradedAt:
            new Date().toISOString(),
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
}

export default new ExamService();