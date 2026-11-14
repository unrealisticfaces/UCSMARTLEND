import { Outlet, useNavigate, Link } from 'react-router-dom';
import { LogOut, Moon, Sun, Bell, Calendar, X, Library, Settings, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

export default function Layout() {
  const { user, logout, isDarkMode, setIsDarkMode, notifications, markNotificationsRead, isLoading, transactions, inventory, confirmConfig, cancelConfirm, executeConfirm } = useApp();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDateTxs, setSelectedDateTxs] = useState([]);
  const [selectedDateStr, setSelectedDateStr] = useState('');

  const unreadCount = notifications.filter(n => !n.read).length;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const handleDayClick = (dateStr) => {
    const dayTxs = transactions?.filter(tx => tx.request_date === dateStr && (tx.status === 'Pending' || tx.status === 'Borrowed')) || [];
    setSelectedDateTxs(dayTxs);
    setSelectedDateStr(dateStr);
  };

  return (
    <div className="min-h-screen flex flex-col bg-tabler-light dark:bg-tabler-body transition-colors duration-200 font-sans">
      
      {/* Activity Loading Bar */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 z-[100] bg-gray-200 dark:bg-[#2f3e4e] overflow-hidden">
          <div className="h-full bg-tabler-primary animate-pulse w-full origin-left transform transition-transform duration-1000 scale-x-50"></div>
        </div>
      )}

      <header className="bg-white dark:bg-tabler-card border-b border-gray-200 dark:border-tabler-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to={user ? `/${user.role}` : '/login'} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="bg-gradient-to-br from-tabler-primary to-[#8b5cf6] text-white p-1.5 rounded-lg shadow-md"><Library className="w-5 h-5" /></div>
              <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-tabler-primary to-[#8b5cf6] tracking-tight hidden sm:block">SmartLend</span>
            </Link>

            {user && (
              <nav className="hidden md:flex items-center gap-2">
                <button onClick={() => { setIsCalendarOpen(true); setSelectedDateTxs([]); setSelectedDateStr(''); }} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-tabler-muted hover:bg-gray-50 dark:hover:bg-tabler-body rounded-md transition-colors">
                  <Calendar className="w-4 h-4" /> Live Schedule
                </button>
              </nav>
            )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-gray-500 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-tabler-border/30">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user && (
              <>
                <div className="relative">
                  <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); if(!notifOpen) markNotificationsRead(); }} className="relative text-gray-500 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-tabler-border/30">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-tabler-danger rounded-full border-2 border-white dark:border-tabler-card"></span>}
                  </button>
                  {notifOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)}></div>
                      <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-tabler-card border rounded-md shadow-2xl z-50 overflow-hidden dark:border-tabler-border animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-3 border-b bg-gray-50 dark:bg-tabler-body/50 dark:border-tabler-border"><h3 className="font-semibold text-sm">Notifications</h3></div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? <div className="p-4 text-center text-sm text-gray-500">No new notifications.</div> : notifications.map(n => (
                            <div key={n.id} className={`p-4 border-b hover:bg-gray-50 dark:hover:bg-tabler-body/50 dark:border-tabler-border/50 ${!n.read ? 'bg-blue-50/50 dark:bg-tabler-primary/5' : ''}`}>
                              <div className="flex justify-between items-start mb-1"><h4 className="text-sm font-semibold">{n.title}</h4><span className="text-[10px] text-gray-500">{n.time}</span></div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{n.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="relative">
                  <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }} className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-tabler-border/30 p-1.5 rounded-md outline-none">
                    <img src={user.avatar} className="w-8 h-8 rounded-full object-cover border dark:border-tabler-border shadow-sm" alt="Profile" />
                  </button>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-tabler-card border rounded-md shadow-2xl py-1 z-50 dark:border-tabler-border animate-in fade-in slide-in-from-top-2">
                        <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-tabler-body"><Settings className="w-4 h-4" /> Account Settings</Link>
                        <div className="h-px bg-gray-100 dark:bg-tabler-border my-1"></div>
                        <button onClick={() => { setProfileOpen(false); logout(); navigate('/login'); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-tabler-danger hover:bg-red-50 dark:hover:bg-tabler-danger/10"><LogOut className="w-4 h-4" /> Logout</button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        <Outlet />
      </main>

      {/* GLOBAL CONFIRMATION MODAL */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border rounded-xl shadow-2xl max-w-sm w-full p-6 flex flex-col items-center text-center dark:bg-tabler-card dark:border-tabler-border animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-tabler-warning/10 text-tabler-warning">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{confirmConfig.title}</h3>
            <p className="text-sm text-gray-600 dark:text-tabler-muted mb-8">{confirmConfig.message}</p>
            <div className="flex gap-3 w-full">
              <button onClick={cancelConfirm} className="flex-1 py-2.5 bg-gray-100 dark:bg-tabler-body hover:bg-gray-200 dark:hover:bg-tabler-border/50 text-gray-800 dark:text-gray-200 rounded-md text-sm font-bold transition-colors">Cancel</button>
              <button onClick={executeConfirm} className="flex-1 py-2.5 bg-tabler-primary hover:bg-[#1d5fb3] text-white rounded-md text-sm font-bold transition-colors shadow-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* TRACKER CALENDAR */}
      {isCalendarOpen && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-tabler-body/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-2xl max-w-6xl w-full h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-tabler-border flex justify-between items-center bg-gray-50 dark:bg-tabler-body/50">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Active Schedule Tracker — {monthNames[currentMonth]} {currentYear}</h3>
              <button onClick={() => setIsCalendarOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              <div className="w-full md:w-2/3 p-6 overflow-y-auto border-r border-gray-200 dark:border-tabler-border">
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-gray-500 dark:text-tabler-muted uppercase pb-2">{day}</div>
                  ))}
                  
                  {Array.from({length: firstDayOfMonth}).map((_, i) => (
                    <div key={`empty-${i}`} className="h-24 rounded-md border border-transparent"></div>
                  ))}
                  
                  {Array.from({length: daysInMonth}, (_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const dayTxs = transactions?.filter(tx => tx.request_date === dateStr && (tx.status === 'Pending' || tx.status === 'Borrowed')) || [];
                    const isSelected = selectedDateStr === dateStr;
                    
                    return (
                      <div 
                        key={i} 
                        onClick={() => handleDayClick(dateStr)}
                        className={`h-24 rounded-md border p-2 overflow-y-auto cursor-pointer transition-colors
                          ${isSelected ? 'border-tabler-primary border-2 bg-tabler-primary/10 shadow-inner' : 
                            dayTxs.length > 0 ? 'border-gray-200 dark:border-tabler-border bg-gray-50 hover:border-tabler-primary/50 dark:bg-tabler-body' : 
                            'border-gray-100 dark:border-tabler-border/50 hover:bg-gray-50 dark:bg-tabler-card dark:hover:bg-tabler-body/50'
                          }`}
                      >
                        <div className={`text-xs font-bold mb-1 ${isSelected ? 'text-tabler-primary' : 'text-gray-700 dark:text-gray-300'}`}>{dayNum}</div>
                        {dayTxs.length > 0 && (
                          <div className="flex items-center justify-center h-8 bg-tabler-primary text-white text-xs font-bold rounded mt-2 shadow-sm">
                            {dayTxs.length} Event{dayTxs.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="w-full md:w-1/3 bg-gray-50 dark:bg-tabler-body/50 overflow-y-auto flex flex-col">
                {selectedDateStr ? (
                  <div className="p-6 space-y-4">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white border-b border-gray-200 dark:border-tabler-border pb-2">
                      Agenda: {selectedDateStr}
                    </h4>
                    {selectedDateTxs.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-tabler-muted">No reservations scheduled for this day.</p>
                    ) : (
                      selectedDateTxs.map(tx => {
                        const item = inventory?.find(i => i.id === tx.item_id);
                        return (
                          <div key={tx.transaction_id} className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${tx.status === 'Pending' ? 'bg-tabler-warning/10 text-tabler-warning' : 'bg-tabler-primary/10 text-tabler-primary'}`}>{tx.status}</span>
                              <span className="text-[10px] font-mono text-gray-400">{tx.transaction_id}</span>
                            </div>
                            <div className="flex gap-3 items-center">
                              <img src={item?.image || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded object-cover border border-gray-100 dark:border-tabler-border" />
                              <div>
                                <div className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{item?.name || 'Unknown Book'}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Reserved by: <span className="font-mono text-tabler-primary font-semibold">{tx.student_id}</span></div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 dark:text-tabler-muted">
                    <Calendar className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">Select a date on the calendar grid to view detailed daily transactions.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}