import React, { useState, useMemo, useEffect, useRef } from 'react';
import { examService } from '../../api/examService';

// רכיב רשימת ההגשות
const SubmissionList = ({ submissions, loading, onBack, onViewDetails }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [exams, setExams] = useState([]);
  const [filterExamId, setFilterExamId] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [examsLoading, setExamsLoading] = useState(false);
  const [pinnedIds, setPinnedIds] = useState([]);
  const suggestionRef = useRef(null);

  // Fetch exams for the filter dropdown
  useEffect(() => {
    const fetchExams = async () => {
      setExamsLoading(true);
      try {
        const data = await examService.getAllExams();
        setExams(data);
      } catch (error) {
        console.error("Failed to fetch exams for filter:", error);
      } finally {
        setExamsLoading(false);
      }
    };
    fetchExams();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePin = (id) => {
    setPinnedIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  // Filter and Sort submissions
  const processedSubmissions = useMemo(() => {
    let result = [...submissions];

    // 1. Search Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.studentName.toLowerCase().includes(term) || 
        s.examTitle.toLowerCase().includes(term)
      );
    }

    // 2. Exam Filter
    if (filterExamId !== 'all') {
      result = result.filter(s => s.examId === filterExamId);
    }

    // 3. Sorting (with Pin Priority)
    result.sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id);
      const bPinned = pinnedIds.includes(b.id);

      // Pin priority
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // Secondary Sort (User selected)
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date) - new Date(a.date);
        case 'date-asc':
          return new Date(a.date) - new Date(b.date);
        case 'score-desc':
          return b.score - a.score;
        case 'score-asc':
          return a.score - b.score;
        case 'name-asc':
          return a.studentName.localeCompare(b.studentName);
        default:
          return 0;
      }
    });

    return result;
  }, [submissions, searchTerm, filterExamId, sortBy, pinnedIds]);

  // Generate suggestions while typing
  useEffect(() => {
    if (searchTerm.length < 1) {
      setSuggestions([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const matches = new Set();
    
    submissions.forEach(s => {
      if (s.studentName.toLowerCase().includes(term)) {
        matches.add(s.studentName);
      }
      if (s.examTitle.toLowerCase().includes(term)) {
        matches.add(s.examTitle);
      }
    });

    setSuggestions(Array.from(matches).slice(0, 5)); // Limit to 5 suggestions
  }, [searchTerm, submissions]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading submissions...</span>
        </div>
        <p className="mt-2 text-muted">Retrieving student results...</p>
      </div>
    );
  }

  return (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-dark">Student Submissions</h3>
        <button className="btn btn-secondary px-4" onClick={onBack}>Back to Menu</button>
      </div>

      {/* Search Component */}
      <div className="mb-4 position-relative" ref={suggestionRef}>
        <div className="input-group shadow-sm">
          <span className="input-group-text bg-white border-end-0">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0 ps-0"
            placeholder="Search by student name or exam title..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          {searchTerm && (
            <button 
              className="btn btn-outline-secondary border-start-0" 
              type="button"
              onClick={() => {
                setSearchTerm('');
                setShowSuggestions(false);
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="list-group position-absolute w-100 shadow-lg mt-1 z-3" style={{ top: '100%' }}>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="list-group-item list-group-item-action border-0 py-2 d-flex align-items-center"
                onClick={() => {
                  setSearchTerm(suggestion);
                  setShowSuggestions(false);
                }}
              >
                <i className="bi bi-clock-history text-muted me-3"></i>
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter & Sort Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-filter"></i>
            </span>
            <select 
              className="form-select border-start-0" 
              value={filterExamId}
              onChange={(e) => setFilterExamId(e.target.value)}
              disabled={examsLoading}
            >
              <option value="all">All Exams</option>
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>{exam.title}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-sort-down"></i>
            </span>
            <select 
              className="form-select border-start-0" 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="score-desc">Score (High to Low)</option>
              <option value="score-asc">Score (Low to High)</option>
              <option value="name-asc">Student Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {processedSubmissions.length === 0 ? (
        <div className="card border-0 shadow-sm p-5 text-center">
          <div className="display-1 text-muted opacity-25 mb-3">
            <i className="bi bi-search"></i>
          </div>
          <h4>No matches found</h4>
          <p className="text-muted">Try adjusting your filters or search terms.</p>
          <button className="btn btn-link" onClick={() => {
            setSearchTerm('');
            setFilterExamId('all');
            setSortBy('date-desc');
          }}>Reset All Filters</button>
        </div>
      ) : (
        <div className="table-responsive shadow-sm rounded-3"
        data-testid="teacher-submission-list">
          <table className="table table-hover align-middle mb-0 bg-white">
            <thead className="table-light">
              <tr>
                <th className="ps-4">Student Name</th>
                <th>Exam Title</th>
                <th>Date</th>
                <th>Score</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedSubmissions.map((submission, index) => {
                const isPinned = pinnedIds.includes(submission.id);
                return (
                  <tr key={submission.id || index} className={isPinned ? 'table-primary-subtle' : ''}
                  data-testid="submission-card"
                  data-submission-id={submission.id}
                  data-exam-id={submission.examId}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center">
                        <div className="avatar-sm bg-primary-subtle text-primary rounded-circle me-3 d-flex align-items-center justify-content-center fw-bold" style={{width: '32px', height: '32px'}}>
                          {submission.studentName.charAt(0)}
                        </div>
                        <span className="fw-semibold"
                        data-testid="submission-student-name">
                          {submission.studentName}
                          {isPinned && <i className="bi bi-pin-fill ms-2 text-primary small"></i>}
                        </span>
                      </div>
                    </td>
                    <td data-testid="submission-exam-title">{submission.examTitle}</td>
                    <td className="text-muted small">
                      {new Date(submission.date).toLocaleDateString()} {new Date(submission.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <span 
                      data-testid="submission-score"
                      className={`badge rounded-pill px-3 py-2 ${submission.score >= 60 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                        {submission.score.toFixed(0)}%
                      </span>
                    </td>
                    <td className="text-end pe-4">
                      <div className="btn-group">
                        <button 
                          className={`btn btn-sm ${isPinned ? 'btn-primary' : 'btn-outline-secondary'} me-2`}
                          onClick={() => togglePin(submission.id)}
                          title={isPinned ? 'Unpin' : 'Pin to top'}
                        >
                          <i className={`bi bi-pin${isPinned ? '-fill' : ''}`}></i>
                        </button>
                        <button className="btn btn-sm btn-outline-primary" data-testid="submission-view-button" onClick={() => onViewDetails(submission)}>
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubmissionList;
