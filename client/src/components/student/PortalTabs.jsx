// רכיב בחירת הדף בפורטל
const PortalTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="d-flex justify-content-center mb-5">
      <div className="btn-group p-1 bg-light rounded-pill shadow-sm">
        <button 
          className={`btn rounded-pill px-4 py-2 fw-bold transition-all ${activeTab === 'take-exam' ? 'btn-primary shadow-sm' : 'btn-light'}`}
          onClick={() => setActiveTab('take-exam')}
        >
          <i className="bi bi-pencil-square me-2"></i>Take Exam
        </button>
        <button 
          className={`btn rounded-pill px-4 py-2 fw-bold transition-all ${activeTab === 'my-feedback' ? 'btn-primary shadow-sm' : 'btn-light'}`}
          onClick={() => setActiveTab('my-feedback')}
        >
          <i className="bi bi-chat-right-text me-2"></i>My Feedback
        </button>
      </div>
    </div>
  );
};

export default PortalTabs;
