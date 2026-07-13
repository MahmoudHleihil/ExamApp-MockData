import React, { useState, useEffect } from 'react';
import { userService } from '../api/userService';
import { examService } from '../api/examService';
import { notificationService } from '../api/notificationService';
import AIChatbot from './AIChatbot';
import FloatingFileUpload from "./documents/FloatingFileUpload";

const AdminDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [recentExams, setRecentExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'approvals', 'admins'
  
  // New Admin form state
  const [newAdmin, setNewAdmin] = useState({ fullName: '', email: '', password: '' });
  const [adminCreating, setAdminCreating] = useState(false);

  const [chatPrompt, setChatPrompt] = useState("");

  const handleGenerateFromMaterial = (document) => {
    setChatPrompt(
      `Generate a medium-difficulty exam with 10 multiple-choice questions using only the uploaded PDF "${document.title}". Save it as a draft.`
    );
  };

  // טעינת ניתונים מ db 
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, examsData] = await Promise.all([
        userService.getSystemStats(),
        userService.getAllUsers(),
        examService.getAllExams()
      ]);
      setStats(statsData);
      setUsers(usersData);
      // חמישת המבחנים שנוסיפו לאחרונה
      setRecentExams(examsData.slice(-5).reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // הנתונים נטענים רק בפעם הראשונה שהרכיב נטען
  useEffect(() => {
    fetchData();
  }, []);

  // פונקציה אסינכרונית לאשר החשבון של המורה
  const handleApprove = async (userId) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      await userService.approveUser(userId);
      
      // Notify the teacher that their account has been approved
      if (targetUser) {
        notificationService.addNotification({
          userId: userId,
          title: 'Account Approved',
          message: 'Welcome! Your teacher account has been approved by the administrator.',
          type: 'approval'
        });
      }

      fetchData();
    } catch (err) {
      alert('Approval failed');
    }
  };

  // פונקציה אסינכרונית לטפל ביצירת Admin חדש
  const handleCreateAdmin = async (e) => {
    // הטופס לא יעשה טעינה מחדש לדף
    e.preventDefault();
    setAdminCreating(true);
    try {
      await userService.createAdmin(newAdmin);
      setNewAdmin({ fullName: '', email: '', password: '' });
      alert('New administrator created successfully!');
      fetchData();
    } catch (err) {
      alert('Failed to create admin');
    } finally {
      setAdminCreating(false);
    }
  };

  // מחיקת משתמש
  const handleDeleteUser = async (targetUser) => {
    if (targetUser.id === user.id) {
      alert("You cannot delete yourself!");
      return;
    }

    // Restriction: Only Head Admin can delete other Admins
    if (targetUser.role === 'Admin' && !user.isSuperAdmin) {
      alert("Only the Head Administrator can remove other administrators.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${targetUser.fullName}?`)) {
      try {
        await userService.deleteUser(targetUser.id);
        
        // Notify admins about the deletion
        notificationService.addNotification({
          role: 'Admin',
          title: 'User Deleted',
          message: `The user ${targetUser.fullName} (${targetUser.role}) was removed from the system by ${user.fullName}.`,
          type: 'deletion'
        });

        fetchData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2">Loading Administration Panel...</p>
      </div>
    );
  }

  const pendingUsers = users.filter(u => u.status === 'pending');

  return (
    <div className="admin-dashboard animate__animated animate__fadeIn">
      {/* Admin Info Header */}
      <div className="card border-0 shadow-sm bg-dark text-white p-4 rounded-4 mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <div className="rounded-circle bg-primary p-3 me-3">
              <i className="bi bi-shield-check fs-2"></i>
            </div>
            <div>
              <h4 className="fw-bold mb-0">{user.isSuperAdmin ? 'Head Administrator' : 'Administrator'}</h4>
              <p className="mb-0 opacity-75">{user.fullName} ({user.email})</p>
            </div>
          </div>
          <div className="text-end">
            <span className="badge bg-primary px-3 py-2">{stats?.totalUsers} Total Users</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <ul className="nav nav-pills mb-4 gap-2">
        <li className="nav-item">
          <button className={`nav-link px-4 ${activeTab === 'overview' ? 'active' : 'bg-white shadow-sm'}`} onClick={() => setActiveTab('overview')}>Overview</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link px-4 ${activeTab === 'users' ? 'active' : 'bg-white shadow-sm'}`} onClick={() => setActiveTab('users')}>All Users</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link px-4 position-relative ${activeTab === 'approvals' ? 'active' : 'bg-white shadow-sm'}`} onClick={() => setActiveTab('approvals')}>
            Approvals
            {pendingUsers.length > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{pendingUsers.length}</span>}
          </button>
        </li>
        {user.isSuperAdmin && (
          <li className="nav-item">
            <button className={`nav-link px-4 ${activeTab === 'admins' ? 'active' : 'bg-white shadow-sm'}`} onClick={() => setActiveTab('admins')}>Manage Admins</button>
          </li>
        )}
      </ul>

      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="animate__animated animate__fadeIn">
            <div className="row g-4 mb-4">
              <div className="col-md-3">
                <div className="card h-100 border-0 shadow-sm p-4 text-center">
                  <h6 className="text-muted small text-uppercase fw-bold">Teachers</h6>
                  <h2 className="fw-bold text-success">{stats?.roleDistribution.Teacher}</h2>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card h-100 border-0 shadow-sm p-4 text-center">
                  <h6 className="text-muted small text-uppercase fw-bold">Students</h6>
                  <h2 className="fw-bold text-info">{stats?.roleDistribution.Student}</h2>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card h-100 border-0 shadow-sm p-4 text-center">
                  <h6 className="text-muted small text-uppercase fw-bold">Exams</h6>
                  <h2 className="fw-bold text-primary">{stats?.totalExams}</h2>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card h-100 border-0 shadow-sm p-4 text-center">
                  <h6 className="text-muted small text-uppercase fw-bold">Waitlist</h6>
                  <h2 className="fw-bold text-danger">{pendingUsers.length}</h2>
                </div>
              </div>
            </div>
            
            <div className="card border-0 shadow-sm rounded-4">
               <div className="card-header bg-transparent border-0 pt-4 px-4"><h5 className="fw-bold">Recent System Activity</h5></div>
               <div className="card-body p-4">
                  <div className="table-responsive">
                    <table className="table table-borderless align-middle">
                      <tbody>
                        {recentExams.map(exam => (
                          <tr key={exam.id}>
                            <td style={{ width: '50px' }}><div className="bg-light p-2 rounded text-primary text-center"><i className="bi bi-file-earmark-text"></i></div></td>
                            <td><h6 className="mb-0 fw-bold">{exam.title}</h6><small className="text-muted">ID: {exam.id}</small></td>
                            <td className="text-end"><span className="badge bg-light text-dark">{exam.questions.length} Qs</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="card border-0 shadow-sm rounded-4 animate__animated animate__fadeIn">
            <div className="card-body p-4">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.fullName}</td>
                        <td>{u.email}</td>
                        <td><span className={`badge ${u.role === 'Admin' ? 'bg-danger' : u.role === 'Teacher' ? 'bg-success' : 'bg-info'}`}>{u.role}</span></td>
                        <td><span className={`badge ${u.status === 'active' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>{u.status}</span></td>
                        <td>
                           <button 
                             className="btn btn-sm btn-outline-danger" 
                             onClick={() => handleDeleteUser(u)} 
                             disabled={u.id === user.id || (u.role === 'Admin' && !user.isSuperAdmin)}
                           >
                             <i className="bi bi-trash"></i>
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="card border-0 shadow-sm rounded-4 animate__animated animate__fadeIn">
            <div className="card-body p-4 text-center">
              {pendingUsers.length === 0 ? (
                <div className="py-5">
                  <i className="bi bi-check-circle text-success display-1"></i>
                  <h4 className="mt-3">All caught up!</h4>
                  <p className="text-muted">No pending teacher approvals.</p>
                </div>
              ) : (
                <div className="table-responsive text-start">
                  <table className="table table-hover align-middle">
                    <thead><tr><th>Name</th><th>Email</th><th>Registration Date</th><th>Action</th></tr></thead>
                    <tbody>
                      {pendingUsers.map(u => (
                        <tr key={u.id}>
                          <td>{u.fullName}</td>
                          <td>{u.email}</td>
                          <td><small className="text-muted">Today</small></td>
                          <td>
                            <button className="btn btn-success btn-sm px-3 fw-bold shadow-sm" onClick={() => handleApprove(u.id)}>Approve Teacher</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manage Admins Tab (Head Admin Only) */}
        {activeTab === 'admins' && user.isSuperAdmin && (
          <div className="row g-4 animate__animated animate__fadeIn">
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-header bg-transparent border-0 pt-4 px-4"><h5 className="fw-bold">Invite New Admin</h5></div>
                <div className="card-body p-4">
                  <form onSubmit={handleCreateAdmin}>
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Full Name</label>
                      <input type="text" className="form-control" value={newAdmin.fullName} onChange={e => setNewAdmin({...newAdmin, fullName: e.target.value})} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Email Address</label>
                      <input type="email" className="form-control" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} required />
                    </div>
                    <div className="mb-4">
                      <label className="form-label small fw-bold">Initial Password</label>
                      <input type="password" className="form-control" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} required />
                    </div>
                    <button className="btn btn-primary w-100 py-2 fw-bold shadow-sm" disabled={adminCreating}>
                       {adminCreating ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Create Admin Account'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
               <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-header bg-transparent border-0 pt-4 px-4"><h5 className="fw-bold">Active Administrators</h5></div>
                  <div className="card-body p-4">
                    <ul className="list-group list-group-flush">
                      {users.filter(u => u.role === 'Admin').map(adm => (
                        <li key={adm.id} className="list-group-item px-0 border-0 mb-2">
                           <div className="d-flex justify-content-between">
                              <div>
                                 <h6 className="mb-0 fw-bold">{adm.fullName} {adm.isSuperAdmin && <span className="badge bg-warning text-dark ms-1">Head</span>}</h6>
                                 <small className="text-muted">{adm.email}</small>
                              </div>
                              <span className="text-success small"><i className="bi bi-dot fs-4"></i> Online</span>
                           </div>
                        </li>
                      ))}
                    </ul>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      <FloatingFileUpload onGenerateExam={handleGenerateFromMaterial} />
      <AIChatbot user={user} context={{ dashboard: "admin" }} initialPrompt={chatPrompt} />
    </div>
  );
};

export default AdminDashboard;
