import { useState, useRef, useEffect } from 'react';
import { aiService } from '../../api/aiService';

const TeacherChatbot = ({ context }) => {
  // מצב הבוט ההתחלתי
  const [isVisible, setIsVisible] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hello Teacher! I am your AI assistant. I can help you create questions, find exam info, or navigate the dashboard. How can I assist you?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // הרכיב לא נטען מחדש רק יגלול למטה(שינוי עררך של JS אובייקט)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // בפתיחת הבוט יגלול למטה
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  // פונקציה אסינכרונית לשליחת הודעה לבוט וטעינת התשובה של AI
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await aiService.sendMessage(input, context);
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (error) {
      console.error("AI chat error:", error.response?.data || error.message);

      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          content:
            error.response?.data?.message ||
            "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // אם הרכיב סגור אז אינו נטען
  if (!isVisible) return null;

  return (
    <div className="position-fixed bottom-0 end-0 m-4 z-3" style={{ maxWidth: '400px' }}>
      {/* Floating Toggle Button Container */}
      <div className="position-relative d-flex justify-content-end">
        {!isOpen && (
          <button 
            className="btn btn-sm btn-dark rounded-circle position-absolute top-0 start-0 translate-middle shadow-sm z-3"
            style={{ width: '22px', height: '22px', padding: 0, fontSize: '0.6rem', marginLeft: '5px' }}
            onClick={() => setIsVisible(false)}
            title="Disable Chatbot"
          >
            <i className="bi bi-x"></i>
          </button>
        )}
        
        <button 
          className="btn btn-primary rounded-circle shadow-lg p-3 d-flex align-items-center justify-content-center transition-all"
          style={{ width: '60px', height: '60px' }}
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? "Minimize AI Assistant" : "Open AI Assistant"}
        >
          <i className="bi bi-robot fs-3"></i>
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="card shadow-lg border-0 mb-3 animate__animated animate__fadeInUp rounded-4 overflow-hidden" style={{ width: '350px', maxHeight: '500px' }}>
          <div className="card-header bg-primary text-white py-3 border-0 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <i className="bi bi-robot me-2 fs-5"></i>
              <h6 className="mb-0 fw-bold">AI Teaching Assistant</h6>
            </div>
            <button 
              className="btn btn-sm btn-link text-white p-0" 
              onClick={() => setIsOpen(false)}
              title="Close Chat"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          
          <div className="card-body overflow-auto p-3" style={{ height: '350px', backgroundColor: '#f8f9fa' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`d-flex mb-3 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                <div 
                  className={`p-3 rounded-4 shadow-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white text-dark border'}`}
                  style={{ maxWidth: '85%', fontSize: '0.9rem' }}
                >
                  {msg.content.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                </div>
              </div>
            ))}
            {/* אנימצית הכתיבה */}
            {isTyping && (
              <div className="d-flex mb-3 justify-content-start">
                <div className="bg-white text-dark border p-3 rounded-4 shadow-sm" style={{ fontSize: '0.9rem' }}>
                  <div className="spinner-grow spinner-grow-sm text-primary me-1" role="status"></div>
                  <div className="spinner-grow spinner-grow-sm text-primary me-1" style={{ animationDelay: '0.2s' }} role="status"></div>
                  <div className="spinner-grow spinner-grow-sm text-primary" style={{ animationDelay: '0.4s' }} role="status"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="card-footer bg-white p-3 border-0">
            <form onSubmit={handleSend} className="input-group">
              <input 
                type="text" 
                className="form-control border-light-subtle rounded-start-pill bg-light" 
                placeholder="Ask me anything..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
              />
              <button 
                type="submit" 
                className="btn btn-primary rounded-end-pill px-3"
                disabled={isTyping || !input.trim()}
              >
                <i className="bi bi-send-fill"></i>
              </button>
            </form>
            <div className="text-center mt-2">
              <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                <i className="bi bi-shield-check me-1"></i> Secure AI Assistant
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherChatbot;
