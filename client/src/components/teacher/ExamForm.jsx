import React from 'react';

// רשימת הטיפוסים של השאלות של המבחנים
const QUESTION_TYPES = [
  { value: 'multiple-choice', label: 'Multiple Choice' },
  { value: 'true-false', label: 'True/False' },
  { value: 'written', label: 'Written Answer' },
  { value: 'multiple-response', label: 'Multiple Response' }
];

// רכיב טופס עריכת מבחנים קיימים או הוספת מבחנים חדשים.
const ExamForm = ({ formData, setFormData, isEditing, onSave, onCancel }) => {
  const questions =
    Array.isArray(
      formData?.questions
    )
      ? formData.questions
      : [];

  // פןנקציית הוספת שאלה חדשה לטופס.
  const handleAddQuestion = () => {
    setFormData((previous) => ({
      ...previous,

      questions: [
        ...(
          Array.isArray(
            previous.questions
          )
            ? previous.questions
            : []
        ),

        {
          id: `q${Date.now()}`,
          type:
            "multiple-choice",
          text: "",
          options: [
            "",
            "",
            "",
            "",
          ],
          correctAnswer: "",
          points: 10,
        },
      ],
    }));
  };

  // פונקציית מחיקת שאלה לפי אינדקס מהטופס.
  const handleRemoveQuestion = (index) => {
    const updatedQuestions = formData.questions.filter((_, i) => i !== index);
    // מעדכנים הטופס אחרי מחיקת השאלה.
    setFormData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  // פונקציה משנה את טיפוס השאלה בטופס.
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index][field] = value; 
    
    // עדכון השאלה לפי טיפוס.
    if (field === 'type') {
      if (value === 'true-false') {
        updatedQuestions[index].options = ['True', 'False'];
        updatedQuestions[index].correctAnswer = '';
      } else if (value === 'written') {
        updatedQuestions[index].options = [];
        updatedQuestions[index].correctAnswer = '';
      } else if (value === 'multiple-response') {
        updatedQuestions[index].options = ['', '', '', ''];
        updatedQuestions[index].correctAnswer = [];
      } else if (value === 'multiple-choice') {
        updatedQuestions[index].options = ['', '', '', ''];
        updatedQuestions[index].correctAnswer = '';
      }
    }
    
    // עדכון השאלה בטופס.
    setFormData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  // פונקציה שמעדכנת שינוי בשאלה.
  const handleOptionChange = (qIndex, oIndex, value) => {
    const updatedQuestions = [...formData.questions];
    const oldOptionValue = updatedQuestions[qIndex].options[oIndex];
    updatedQuestions[qIndex].options[oIndex] = value;
    
    if (updatedQuestions[qIndex].type === 'multiple-response') {
      if (Array.isArray(updatedQuestions[qIndex].correctAnswer)) {
        updatedQuestions[qIndex].correctAnswer = updatedQuestions[qIndex].correctAnswer.map(
          ans => ans === oldOptionValue ? value : ans
        );
      }
    } else if (updatedQuestions[qIndex].correctAnswer === oldOptionValue) {
      updatedQuestions[qIndex].correctAnswer = value;
    }
    
    // עדכון הטופס.
    setFormData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  // פונקציה שמעדכנת הוספת או הסרת האופציה הנכונה בשאלה.
  const handleToggleCorrectAnswer = (qIndex, option) => {
    const updatedQuestions = [...formData.questions];
    const currentAnswers = Array.isArray(updatedQuestions[qIndex].correctAnswer) 
      ? updatedQuestions[qIndex].correctAnswer 
      : [];
    
    if (currentAnswers.includes(option)) {
      updatedQuestions[qIndex].correctAnswer = currentAnswers.filter(a => a !== option);
    } else {
      updatedQuestions[qIndex].correctAnswer = [...currentAnswers, option];
    }
    
    setFormData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  return (
    <div className="card shadow-sm border-primary animate__animated animate__fadeIn">
      <div className="card-header bg-primary text-white py-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{isEditing ? 'Update Exam' : 'Create New Exam'}</h5>
        <button className="btn-close btn-close-white" onClick={onCancel}></button>
      </div>
      <div className="card-body p-4">
        <form onSubmit={onSave} data-testid="exam-form">
          <div className="row mb-4">
            <div className="col-md-6">
              <label className="form-label fw-bold">Exam Title</label>
              <input 
                type="text" 
                className="form-control form-control-lg border-primary border-opacity-25" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                data-testid="exam-title"
                required 
                placeholder="e.g., Advanced JavaScript Concepts"
              />
            </div>
            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-bold mb-0">Scheduled Date & Time</label>
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="isAlwaysAvailable"
                    checked={formData.isAlwaysAvailable}
                    onChange={(e) => setFormData({...formData, isAlwaysAvailable: e.target.checked})} data-testid="exam-always-available"
                  />
                  <label className="form-check-label small fw-bold text-primary" htmlFor="isAlwaysAvailable">
                    Open All The Time
                  </label>
                </div>
              </div>
              <input 
                type="datetime-local" 
                className="form-control form-control-lg border-primary border-opacity-25" 
                value={formData.scheduledDate ? new Date(new Date(formData.scheduledDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} 
                onChange={(e) => setFormData({...formData, scheduledDate: new Date(e.target.value).toISOString()})}
                required={!formData.isAlwaysAvailable}
                disabled={formData.isAlwaysAvailable}
                data-testid="exam-scheduled-date"
              />
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-4">
              <label className="form-label fw-bold">Time Limit (minutes)</label>
              <input 
                type="number" 
                className="form-control form-control-lg border-primary border-opacity-25" 
                value={formData.timeLimit || ''} 
                onChange={(e) => setFormData({...formData, timeLimit: parseInt(e.target.value)})}
                required 
                min="1"
                placeholder="e.g., 60"
                data-testid="exam-time-limit"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold">Early Access (minutes)</label>
              <input 
                type="number" 
                className="form-control form-control-lg border-primary border-opacity-25" 
                value={formData.earlyAccessMinutes || 0} 
                onChange={(e) => setFormData({...formData, earlyAccessMinutes: parseInt(e.target.value)})}
                required 
                min="0"
                placeholder="e.g., 30"
                data-testid="exam-early-access"
              />
              <div className="form-text small">Allow students to enter early.</div>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold">Passing Score</label>
              <input 
                type="number" 
                className="form-control form-control-lg border-primary border-opacity-25" 
                value={formData.passingScore || ''} 
                onChange={(e) => setFormData({...formData, passingScore: parseInt(e.target.value)})}
                required 
                min="0"
                max="100"
                placeholder="e.g., 60"
                data-testid="exam-passing-score"
              />
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-4">
              <label className="form-label fw-bold">Exam Password (Optional)</label>
              <input 
                type="text" 
                className="form-control form-control-lg border-primary border-opacity-25" 
                value={formData.password || ''} 
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Set a password"
                data-testid="exam-password"
              />
              <div className="form-text small">Leave blank for no password.</div>
            </div>
            {/* button for releasing the score immediatly */}
            <div className="col-md-8 d-flex align-items-center">
              <div className="form-check form-switch mt-4">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="releaseScoresImmediately"
                  checked={formData.releaseScoresImmediately}
                  onChange={(e) => setFormData({...formData, releaseScoresImmediately: e.target.checked})}
                  data-testid="exam-release-scores"
                />
                <label className="form-check-label fw-bold text-primary" htmlFor="releaseScoresImmediately">
                  Release Scores Immediately After Submission
                </label>
                <div className="form-text small text-muted">If disabled, students will wait for your manual release.</div>
              </div>
            </div>
          </div>
          
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-4">
            <h6 className="fw-bold mb-0 text-primary">
              <i className="bi bi-list-task me-2"></i>
              Questions ({questions.length})
            </h6>
          </div>
          
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="card mb-4 border-0 bg-light shadow-sm" data-testid="question-card">
              <div className="card-header d-flex justify-content-between align-items-center bg-white border-0 py-3">
                <span className="fw-bold text-secondary">Question {qIndex + 1}</span>
                <button 
                  type="button" 
                  className="btn btn-outline-danger btn-sm rounded-pill"
                  onClick={() => handleRemoveQuestion(qIndex)}
                  disabled={questions.length === 1}
                >
                  <i className="bi bi-trash me-1"></i> Remove
                </button>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Question Text</label>
                    <textarea 
                      className="form-control border-0 shadow-sm" 
                      rows="2"
                      value={q.text} 
                      onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                      required 
                      placeholder="Enter the question here..."
                      data-testid={`question-text-${qIndex}`}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Question Type</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={q.type} 
                      onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                      data-testid={`question-type-${qIndex}`}
                    >
                      {QUESTION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  {/* changing points for each question */}
                  <div className="col-md-2">
                    <label className="form-label small fw-bold">Points</label>
                    <input 
                      type="number" 
                      className="form-control border-0 shadow-sm" 
                      value={q.points || 0} 
                      onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value))}
                      required 
                      min="0"
                      data-testid={`question-points-${qIndex}`}
                    />
                  </div>
                </div>

                {q.type !== 'written' && (
                  <div className="mt-4">
                    <label className="form-label small fw-bold">Options & Answers</label>
                    <div className="row g-3">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="col-md-6">
                          <div className="input-group shadow-sm">
                            <div className="input-group-text bg-white border-0">
                              {q.type === 'multiple-response' ? (
                                <input 
                                  className="form-check-input mt-0" 
                                  type="checkbox" 
                                  checked={Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt)}
                                  onChange={() => handleToggleCorrectAnswer(qIndex, opt)}
                                  disabled={!opt.trim()}
                                  data-testid={`question-${qIndex}-correct-${oIndex}`}
                                />
                              ) : (
                                <input 
                                  className="form-check-input mt-0" 
                                  type="radio" 
                                  name={`correct-${qIndex}`}
                                  checked={q.correctAnswer === opt && opt !== ''}
                                  onChange={() => handleQuestionChange(qIndex, 'correctAnswer', opt)}
                                  disabled={!opt.trim()}
                                  data-testid={`question-${qIndex}-correct-${oIndex}`}
                                />
                              )}
                            </div>
                            <input 
                              type="text" 
                              className="form-control border-0" 
                              value={opt} 
                              onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                              placeholder={`Option ${oIndex + 1}`}
                              required={q.type !== 'written'}
                              disabled={q.type === 'true-false'}
                              data-testid={`question-${qIndex}-option-${oIndex}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {q.type === 'written' && (
                  <div className="mt-4">
                    <label className="form-label small fw-bold text-success">Expected Correct Answer</label>
                    <input 
                      type="text" 
                      className="form-control border-0 shadow-sm" 
                      value={q.correctAnswer} 
                      onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                      placeholder="The exact answer for automatic grading"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <div className="d-flex justify-content-between align-items-center mt-5">
            <button type="button" className="btn btn-outline-primary px-4" onClick={handleAddQuestion} data-testid="add-question">
              <i className="bi bi-plus-lg me-1"></i> Add Question
            </button>
            <div className="d-flex gap-3">
              <button type="button" className="btn btn-light px-4" onClick={onCancel} data-testid="exam-cancel">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary px-5 fw-bold" data-testid="exam-save">
                {isEditing ? 'Update Exam' : 'Save Exam'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamForm;
