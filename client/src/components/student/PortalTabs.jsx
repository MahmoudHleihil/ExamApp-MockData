import { NavLink } from 'react-router-dom';

// רכיב בחירת הדף בפורטל
const PortalTabs = () => {
  return (
    <div className="d-flex justify-content-center mb-5">
      <div className="btn-group p-1 bg-light rounded-pill shadow-sm">
        <NavLink 
          to="/student/exams"
          className={({ isActive }) => 
            `btn rounded-pill px-4 py-2 fw-bold transition-all ${isActive ? 'btn-primary shadow-sm' : 'btn-light'}`
          }
        >
          <i className="bi bi-pencil-square me-2"></i>Take Exam
        </NavLink>
        <NavLink 
          to="/student/feedback"
          className={({ isActive }) => 
            `btn rounded-pill px-4 py-2 fw-bold transition-all ${isActive ? 'btn-primary shadow-sm' : 'btn-light'}`
          }
        >
          <i className="bi bi-chat-right-text me-2"></i>My Feedback
        </NavLink>
      </div>
    </div>
  );
};

export default PortalTabs;
