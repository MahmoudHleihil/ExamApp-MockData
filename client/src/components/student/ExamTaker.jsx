const ExamTaker = ({ 
  exam, 
  currentQuestionIndex, 
  setCurrentQuestionIndex, 
  selectedAnswers, 
  handleAnswerChange, 
  handleSubmitExam 
}) => {
  const question = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;

  // טעינת התשובות
  const renderQuestionInput = (question) => {
    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        return (
          <div className="list-group mt-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                className={`list-group-item list-group-item-action ${selectedAnswers[question.id] === option ? 'active' : ''}`}
                onClick={() => handleAnswerChange(question.id, option, question.type)}
              >
                {option}
              </button>
            ))}
          </div>
        );
      case 'multiple-response':
        return (
          <div className="list-group mt-3">
            {question.options.map((option, index) => {
              const isSelected = (selectedAnswers[question.id] || []).includes(option);
              return (
                <button
                  key={index}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${isSelected ? 'list-group-item-primary' : ''}`}
                  onClick={() => handleAnswerChange(question.id, option, question.type)}
                >
                  {option}
                  {isSelected && <span className="badge bg-primary rounded-pill">Selected</span>}
                </button>
              );
            })}
            <div className="form-text mt-2">Select all that apply.</div>
          </div>
        );
      case 'written':
        return (
          <div className="mt-3">
            <textarea
              className="form-control"
              rows="3"
              placeholder="Type your answer here..."
              value={selectedAnswers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mt-4">
      <div className="progress mb-4" style={{height: '8px'}}>
        <div className="progress-bar" role="progressbar" style={{width: `${progress}%`}}></div>
      </div>

      <div className="card shadow border-0">
        <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
          <h4 className="mb-0 text-primary fw-bold">{exam.title}</h4>
          <span className="badge bg-secondary py-2 px-3">Question {currentQuestionIndex + 1} of {exam.questions.length}</span>
        </div>
        <div className="card-body p-4">
          <h5 className="card-title mb-4 lh-base">{question.text}</h5>
          {renderQuestionInput(question)}
        </div>
        <div className="card-footer bg-white border-0 p-4 d-flex justify-content-between">
          <button 
            className="btn btn-outline-secondary px-4" 
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </button>
          
          {currentQuestionIndex === exam.questions.length - 1 ? (
            <button 
              className="btn btn-success px-5 fw-bold" 
              onClick={handleSubmitExam}
            >
              Submit Exam
            </button>
          ) : (
            <button 
              className="btn btn-primary px-5" 
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamTaker;
