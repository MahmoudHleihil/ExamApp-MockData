import React, { useState, useEffect, useRef } from 'react';
import { notificationService } from '../api/notificationService';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // לעדכן את ההודעות לפי המשתמש, לכל שינוי של משתמש, ולבטל את ההרשמה כשהרכיב נמחק
  useEffect(() => {
    const updateNotifications = async () => {
      try {
        const data = await notificationService.getNotifications(user);
        setNotifications(data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    updateNotifications();
    const unsubscribe = notificationService.subscribe(updateNotifications);

    return () => unsubscribe();
  }, [user]);

  // להוספת את המאזין כך שבלחיצה מחוץ לרכיב הרכיב נסגר, ולהסרת את המאזין עם הסרת הרכיב
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // מספר ההודעות הנקראות
  const unreadCount = notifications.filter(n => !n.read).length;

  // לסמן את ההודעה המסוימת כנקראה
  const handleMarkAsRead = (e, id) => {
    e.stopPropagation();
    notificationService.markAsRead(id);
  };

  // לסמן את כל ההודעות כנקראות
  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead(user);
  };

  // מחשב ומחזיר את הזמן שממנו נשלחה ההודעה
  const getTimeLabel = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  // מחזיר את הסמל המתאים לפי טיפוס ההודעה
  const getIcon = (type) => {
    switch (type) {
      case 'submission': return 'bi-file-earmark-check text-primary';
      case 'feedback': return 'bi-chat-right-dots text-success';
      case 'approval': return 'bi-person-check text-warning';
      case 'deletion': return 'bi-person-x text-danger';
      default: return 'bi-bell text-secondary';
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    await notificationService.markAsRead(notification.id);

    // Navigate according to notification type
    switch (notification.type) {
      case 'submission':
        navigate('/teacher/submissions');
        break;

      case 'feedback':
        navigate('/student/feedback');
        break;

      case 'approval':
        navigate('/admin/users');
        break;

      case 'deletion':
        navigate('/admin/users');
        break;

      default:
        navigate('/');
    }

    setIsOpen(false);
  };
  
  return (
    <div className="position-relative" ref={dropdownRef}>
      <button 
        className="btn btn-light position-relative rounded-circle shadow-sm border d-flex align-items-center justify-content-center p-0"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        style={{ width: '40px', height: '40px', flexShrink: 0 }}
      >
        <i className={`bi bi-bell-fill fs-5 ${unreadCount > 0 ? 'text-primary' : 'text-muted'}`}></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light" style={{ fontSize: '0.65rem', marginTop: '5px', marginLeft: '-5px' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="position-absolute end-0 mt-2 shadow-lg border-0 rounded-4 overflow-hidden bg-white" 
          style={{ width: '320px', zIndex: 1050, top: '100%' }}
        >
          <div className="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
            <h6 className="fw-bold mb-0">Notifications</h6>
            {unreadCount > 0 && (
              <button 
                className="btn btn-link btn-sm text-decoration-none p-0 fw-bold" 
                onClick={handleMarkAllAsRead}
                style={{ fontSize: '0.8rem' }}
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="overflow-auto" style={{ maxHeight: '400px' }}>
            {notifications.length === 0 ? (
              <div className="p-4 text-center">
                <i className="bi bi-bell-slash fs-1 text-muted opacity-25 d-block mb-2"></i>
                <p className="text-muted small mb-0">No notifications yet</p>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`list-group-item list-group-item-action p-3 border-bottom-0 position-relative ${!n.read ? 'bg-primary-subtle' : ''}`}
                    onClick={() => handleNotificationClick(n)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-start gap-3">
                      <div className={`rounded-circle bg-white p-2 shadow-sm d-flex align-items-center justify-content-center border`} style={{ width: '38px', height: '38px', flexShrink: 0 }}>
                        <i className={`bi ${getIcon(n.type)} fs-5`}></i>
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="d-flex justify-content-between align-items-start">
                          <h6 className={`mb-1 small fw-bold text-truncate ${!n.read ? 'text-primary' : 'text-dark'}`}>{n.title}</h6>
                          <span className="text-muted" style={{ fontSize: '0.65rem', flexShrink: 0 }}>{getTimeLabel(n.time)}</span>
                        </div>
                        <p className="text-muted mb-0 small text-wrap lh-sm" style={{ fontSize: '0.8rem' }}>{n.message}</p>
                      </div>
                      {!n.read && (
                        <div 
                          className="bg-primary rounded-circle" 
                          style={{ width: '8px', height: '8px', flexShrink: 0, marginTop: '6px' }}
                        ></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-top bg-light text-center">
            <button className="btn btn-link btn-sm text-decoration-none text-muted small" onClick={() => setIsOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
