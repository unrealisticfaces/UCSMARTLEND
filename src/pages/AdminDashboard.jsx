import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Package, ShieldCheck, RefreshCcw, Users, Edit, Trash2, Database, Search, X, LayoutDashboard, ShieldAlert, Tags, TrendingUp, UserPlus } from 'lucide-react';

const Pagination = ({ page, setPage, total, perPage = 8 }) => {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 bg-gray-50 dark:bg-tabler-body/50 border-t border-gray-200 dark:border-tabler-border mt-auto">
      <span className="text-xs text-gray-500 dark:text-tabler-muted font-medium">Showing {(page-1)*perPage + 1} to {Math.min(page*perPage, total)} of {total}</span>
      <div className="flex gap-2 w-full sm:w-auto">
        <button onClick={() => setPage(page - 1)} disabled={page === 1} className="flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1.5 border border-gray-200 dark:border-tabler-border rounded text-xs font-bold disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-tabler-body transition-colors">Prev</button>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1.5 border border-gray-200 dark:border-tabler-border rounded text-xs font-bold disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-tabler-body transition-colors">Next</button>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { user, inventory = [], usersList = [], transactions = [], genres = [], addInventoryItem, updateInventoryItem, deleteInventoryItem, updateUserRole, updateUserPermissions, addGenre, deleteGenre, requestConfirm, adminCreateUser, showToast } = useApp();
  
  const [activeTab, setActiveTab] = useState('overview'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [txSearchQuery, setTxSearchQuery] = useState('');
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', inventory_code: '', category: 'Computer Science', status: 'Available', image: '', description: '' });
  const [newGenre, setNewGenre] = useState('');

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', idNumber: '', email: '', password: '', role: 'student' });

  const [invPage, setInvPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [txPage, setTxPage] = useState(1);

  const [syncedHover, setSyncedHover] = useState(null);
  const [activityHover, setActivityHover] = useState(null);

  const validInventory = inventory.filter(item => item !== null && item !== undefined);
  const validUsers = usersList.filter(u => u !== null && u !== undefined);

  const stats = {
    total: validInventory.length,
    available: validInventory.filter(i => i.status === 'Available').length,
    borrowed: validInventory.filter(i => i.status === 'Borrowed').length,
    users: validUsers.length
  };

  // UPGRADE: 100% Precise Data (No simulated variance)
  const last30Days = useMemo(() => {
    const days = [];
    const today = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const displayDate = `${String(d.getDate()).padStart(2, '0')} ${monthNames[d.getMonth()]}`;
      
      const dayTxs = transactions.filter(tx => tx.request_date === dateStr);
      
      days.push({ 
        dateStr, 
        displayDate, 
        requests: dayTxs.length, // Exact total requests
        borrowed: dayTxs.filter(tx => tx.status === 'Borrowed').length, // Exact active borrowed
        returned: dayTxs.filter(tx => ['Returned', 'Declined', 'Cancelled'].includes(tx.status)).length, // Exact resolved
        total: dayTxs.length
      });
    }
    return days;
  }, [transactions]);

  const buildSmoothPath = (dataArray, maxVal, invertY = false) => {
    if(dataArray.length === 0) return '';
    const safeMax = Math.max(maxVal, 1);
    const points = dataArray.map((val, i) => ({
      x: (i / (dataArray.length - 1)) * 1000,
      y: invertY ? (val / safeMax) * 85 + 10 : 95 - (val / safeMax) * 85 
    }));

    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const cpX1 = p1.x + (p2.x - p1.x) * 0.4;
      const cpX2 = p2.x - (p2.x - p1.x) * 0.4;
      d += ` C ${cpX1},${p1.y} ${cpX2},${p2.y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const maxRequests = Math.max(...last30Days.map(d => d.requests), 5);
  const maxBorrowed = Math.max(...last30Days.map(d => d.borrowed), 5);
  const maxReturned = Math.max(...last30Days.map(d => d.returned), 5);
  const maxActivity = Math.max(...last30Days.map(d => d.total), 5);

  const requestsPath = buildSmoothPath(last30Days.map(d => d.requests), maxRequests);
  const borrowedPath = buildSmoothPath(last30Days.map(d => d.borrowed), maxBorrowed);
  const activityPath = buildSmoothPath(last30Days.map(d => d.total), maxActivity);

  const deptStats = useMemo(() => {
    const counts = transactions.reduce((acc, tx) => {
      const dept = tx.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    const maxCount = Math.max(...Object.values(counts), 1);
    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts).map(([name, count]) => ({ 
      name, count, barPercent: (count / maxCount) * 100, realPercent: totalCount > 0 ? (count / totalCount) * 100 : 0 
    })).sort((a,b) => b.count - a.count);
  }, [transactions]);

  const invStats = useMemo(() => {
    const total = validInventory.length || 1;
    const avail = validInventory.filter(i => i.status === 'Available').length;
    const borrowed = validInventory.filter(i => i.status === 'Borrowed').length;
    const pending = validInventory.filter(i => i.status === 'Pending').length;
    const issues = validInventory.filter(i => i.status === 'Damaged' || i.status === 'Maintenance').length;
    
    return {
      total: validInventory.length,
      avail: { count: avail, pct: (avail/total)*100, color: 'bg-[#2fb344]' },
      borrowed: { count: borrowed, pct: (borrowed/total)*100, color: 'bg-[#206bc4]' },
      pending: { count: pending, pct: (pending/total)*100, color: 'bg-[#f59f00]' },
      issues: { count: issues, pct: (issues/total)*100, color: 'bg-[#d63939]' }
    };
  }, [validInventory]);

  const filteredInventory = validInventory.filter(item => {
    if (!item) return false;
    const itemName = typeof item.name === 'string' ? item.name : '';
    const itemCode = typeof item.inventory_code === 'string' ? item.inventory_code : '';
    const query = typeof searchQuery === 'string' ? searchQuery.toLowerCase() : '';
    if (query && itemName === '' && itemCode === '') return false;
    return itemName.toLowerCase().includes(query) || itemCode.toLowerCase().includes(query);
  });

  const filteredUsers = validUsers.filter(u => {
    if (!u) return false;
    const userName = typeof u.name === 'string' ? u.name : '';
    const userEmail = typeof u.email === 'string' ? u.email : '';
    const query = typeof searchQuery === 'string' ? searchQuery.toLowerCase() : '';
    return userName.toLowerCase().includes(query) || userEmail.toLowerCase().includes(query);
  });

  const filteredTxs = transactions.filter(tx => {
    const q = txSearchQuery.toLowerCase();
    if (!q) return true;
    const item = validInventory.find(i => i.id === tx.item_id);
    const student = validUsers.find(u => u.id === tx.student_id);
    const itemName = item?.name?.toLowerCase() || '';
    const studentName = student?.name?.toLowerCase() || '';
    return tx.transaction_id.toLowerCase().includes(q) || tx.student_id.toLowerCase().includes(q) || itemName.includes(q) || studentName.includes(q);
  }).sort((a,b) => new Date(b.request_date) - new Date(a.request_date));

  const paginatedInventory = filteredInventory.slice((invPage - 1) * 8, invPage * 8);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * 8, userPage * 8);
  const paginatedTxs = filteredTxs.slice((txPage - 1) * 8, txPage * 8);

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (editingItem && editingItem.id) await updateInventoryItem({ ...editingItem, ...itemForm });
    else await addInventoryItem({ id: `item_${Date.now()}`, rating: 5.0, reviews: 0, ...itemForm });
    setIsItemModalOpen(false);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (userForm.password.length < 6) return showToast('Password must be at least 6 characters.', 'error');
    try {
      await adminCreateUser(userForm.name, userForm.idNumber, userForm.email, userForm.password, userForm.role);
      setIsUserModalOpen(false);
      setUserForm({ name: '', idNumber: '', email: '', password: '', role: 'student' });
    } catch (error) { showToast(error.message, 'error'); }
  };

  const handleGenreSubmit = (e) => {
    e.preventDefault();
    if(newGenre.trim()){ 
      requestConfirm('Add Genre', `Are you sure you want to add "${newGenre.trim()}" as a new category?`, async () => {
        await addGenre(newGenre.trim()); 
        setNewGenre('');
      });
    }
  };

  const togglePermission = (u, permKey) => {
    const currentPerms = u.permissions || { create: false, read: true, update: false, delete: false };
    updateUserPermissions(u.uid, { ...currentPerms, [permKey]: !currentPerms[permKey] });
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-gray-900 dark:text-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Administrator</h2>
          <p className="text-sm text-gray-500 dark:text-tabler-muted mt-1">Manage overall portal operations, inventory, and user access roles.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm flex overflow-x-auto scrollbar-hide">
        <button onClick={() => {setActiveTab('overview'); setTxPage(1);}} className={`whitespace-nowrap flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-tabler-primary text-tabler-primary bg-gray-50 dark:bg-tabler-body/50' : 'border-transparent text-gray-500 dark:text-tabler-muted hover:text-gray-900 dark:hover:text-white'}`}><LayoutDashboard className="w-4 h-4" /> Analytics Dashboard</button>
        <button onClick={() => {setActiveTab('inventory'); setInvPage(1);}} className={`whitespace-nowrap flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'inventory' ? 'border-tabler-primary text-tabler-primary bg-gray-50 dark:bg-tabler-body/50' : 'border-transparent text-gray-500 dark:text-tabler-muted hover:text-gray-900 dark:hover:text-white'}`}><Database className="w-4 h-4" /> Book Database</button>
        <button onClick={() => {setActiveTab('users'); setUserPage(1);}} className={`whitespace-nowrap flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users' ? 'border-tabler-primary text-tabler-primary bg-gray-50 dark:bg-tabler-body/50' : 'border-transparent text-gray-500 dark:text-tabler-muted hover:text-gray-900 dark:hover:text-white'}`}><Users className="w-4 h-4" /> User Management</button>
        <button onClick={() => setActiveTab('genres')} className={`whitespace-nowrap flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'genres' ? 'border-tabler-primary text-tabler-primary bg-gray-50 dark:bg-tabler-body/50' : 'border-transparent text-gray-500 dark:text-tabler-muted hover:text-gray-900 dark:hover:text-white'}`}><Tags className="w-4 h-4" /> Genres</button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'stat-books', label: 'Total Books', val: stats.total, color: 'text-tabler-success', icon: Package, fill: 'bg-tabler-primary' },
              { id: 'stat-avail', label: 'Available', val: stats.available, color: 'text-tabler-success', icon: ShieldCheck, fill: 'bg-[#2fb344]' },
              { id: 'stat-borrowed', label: 'Borrowed', val: stats.borrowed, color: 'text-tabler-warning', icon: RefreshCcw, fill: 'bg-tabler-warning' },
              { id: 'stat-users', label: 'System Users', val: stats.users, color: 'text-tabler-success', icon: Users, fill: 'bg-purple-500' }
            ].map((stat) => (
              <div key={stat.id} className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg p-5 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-md text-white shadow-sm ${stat.fill}`}><stat.icon className="w-5 h-5" /></div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 dark:text-tabler-muted uppercase tracking-wider mb-0.5">{stat.label}</div>
                      <div className="text-2xl font-bold leading-none text-gray-900 dark:text-white">{stat.val}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            
            <div className="lg:col-span-2 bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm p-6 relative">
              <div className="flex justify-between items-center mb-6 relative z-30">
                <h3 className="font-semibold text-sm">Synced Operations Charts</h3>
                <div className="text-xs text-gray-500 dark:text-tabler-muted font-medium bg-gray-50 dark:bg-tabler-body/50 px-3 py-1 rounded">
                  Hover to synchronize views
                </div>
              </div>

              <div className="relative w-full flex flex-col">
                
                <div className="absolute top-0 left-0 right-0 bottom-8 z-40 flex">
                  {last30Days.map((day, i) => (
                    <div 
                      key={`hover-${i}`} 
                      className="flex-1 h-full relative cursor-crosshair group"
                      onMouseEnter={() => setSyncedHover({ ...day, index: i })}
                      onMouseLeave={() => setSyncedHover(null)}
                    >
                      <div className={`hidden group-hover:block absolute top-0 bottom-0 left-1/2 w-px bg-gray-300 dark:bg-gray-600 border-dashed border-l pointer-events-none`}></div>
                    </div>
                  ))}
                </div>

                {/* CHART 1: Requests (Blue Area Spline) */}
                <div className="relative h-24 w-full border-b border-gray-100 dark:border-tabler-border/50 pb-2 mb-4">
                  <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                    <defs>
                      <linearGradient id="gradReq" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#206bc4" stopOpacity="0.2"/><stop offset="100%" stopColor="#206bc4" stopOpacity="0"/></linearGradient>
                    </defs>
                    <path d={`${requestsPath} L1000,100 L0,100 Z`} fill="url(#gradReq)" className="transition-all duration-300" />
                    <path d={requestsPath} fill="none" stroke="#206bc4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {syncedHover && <circle cx={(syncedHover.index / 29) * 1000} cy={95 - (syncedHover.requests / Math.max(maxRequests, 1)) * 85} r="4" fill="#206bc4" stroke="#fff" strokeWidth="2" />}
                  </svg>
                  {syncedHover && (
                    <div className="absolute top-1 z-50 pointer-events-none transform -translate-x-1/2 bg-[#182433] text-white p-2 rounded shadow-lg flex flex-col min-w-[120px] transition-all duration-75" style={{ left: `calc(${(syncedHover.index / 29) * 100}%)` }}>
                      <span className="text-[10px] font-bold border-b border-gray-700 pb-1 mb-1 text-center">{syncedHover.displayDate}</span>
                      <span className="text-xs flex justify-between items-center"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#206bc4]"></div> Total Requests</div> <span>{syncedHover.requests}</span></span>
                    </div>
                  )}
                </div>

                {/* CHART 2: Borrowed (Green Line Spline) */}
                <div className="relative h-24 w-full border-b border-gray-100 dark:border-tabler-border/50 pb-2 mb-4">
                  <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                    <path d={borrowedPath} fill="none" stroke="#2fb344" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {syncedHover && <circle cx={(syncedHover.index / 29) * 1000} cy={95 - (syncedHover.borrowed / Math.max(maxBorrowed, 1)) * 85} r="4" fill="#2fb344" stroke="#fff" strokeWidth="2" />}
                  </svg>
                  {syncedHover && (
                    <div className="absolute top-1 z-50 pointer-events-none transform -translate-x-1/2 bg-[#182433] text-white p-2 rounded shadow-lg flex flex-col min-w-[120px] transition-all duration-75" style={{ left: `calc(${(syncedHover.index / 29) * 100}%)` }}>
                      <span className="text-[10px] font-bold border-b border-gray-700 pb-1 mb-1 text-center">{syncedHover.displayDate}</span>
                      <span className="text-xs flex justify-between items-center"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#2fb344]"></div> Active Borrowed</div> <span>{syncedHover.borrowed}</span></span>
                    </div>
                  )}
                </div>

                {/* CHART 3: Resolved (Blue Bar Chart) */}
                <div className="relative h-24 w-full border-b border-gray-100 dark:border-tabler-border/50 pb-2">
                  <div className="absolute inset-0 flex items-end justify-between px-1">
                    {last30Days.map((day, i) => (
                      <div key={`bar-${i}`} className="w-full flex justify-center h-full items-end">
                         <div className={`w-3/4 max-w-[14px] rounded-t-sm transition-all duration-300 ${syncedHover?.index === i ? 'bg-[#206bc4]' : 'bg-[#206bc4]/70 dark:bg-[#206bc4]/50'}`} style={{ height: `${(day.returned / Math.max(maxReturned, 1)) * 90}%` }}></div>
                      </div>
                    ))}
                  </div>
                  {syncedHover && (
                    <div className="absolute top-1 z-50 pointer-events-none transform -translate-x-1/2 bg-[#182433] text-white p-2 rounded shadow-lg flex flex-col min-w-[120px] transition-all duration-75" style={{ left: `calc(${(syncedHover.index / 29) * 100}%)` }}>
                      <span className="text-[10px] font-bold border-b border-gray-700 pb-1 mb-1 text-center">{syncedHover.displayDate}</span>
                      <span className="text-xs flex justify-between items-center"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#3da9fc]"></div> Resolved</div> <span>{syncedHover.returned}</span></span>
                    </div>
                  )}
                </div>

                <div className="w-full flex pt-3 pb-1 relative">
                  {last30Days.map((day, i) => (
                    <div key={`label-${i}`} className="flex-1 relative">
                      {i % 4 === 0 && (
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400 font-medium whitespace-nowrap">
                          {day.displayDate}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

              </div>
            </div>

            <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm p-6 flex flex-col relative">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-semibold text-sm">Asset Distribution</h3>
                <span className="text-[10px] font-bold tracking-widest uppercase bg-gray-100 dark:bg-tabler-body/50 px-2 py-1 rounded text-gray-500">{invStats.total} Total</span>
              </div>

              <div className="w-full h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex mb-8 shadow-inner">
                <div style={{width: `${invStats.avail.pct}%`}} className="h-full bg-[#2fb344] transition-all duration-1000"></div>
                <div style={{width: `${invStats.borrowed.pct}%`}} className="h-full bg-[#206bc4] transition-all duration-1000 border-l border-white/20"></div>
                <div style={{width: `${invStats.pending.pct}%`}} className="h-full bg-[#f59f00] transition-all duration-1000 border-l border-white/20"></div>
                <div style={{width: `${invStats.issues.pct}%`}} className="h-full bg-[#d63939] transition-all duration-1000 border-l border-white/20"></div>
              </div>

              <div className="space-y-5 flex-1 mt-2">
                {[
                  { label: 'Available (On Shelf)', stat: invStats.avail },
                  { label: 'Borrowed (In Field)', stat: invStats.borrowed },
                  { label: 'Pending (Reserved)', stat: invStats.pending },
                  { label: 'Attention (Damaged)', stat: invStats.issues }
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.stat.color} shadow-sm`}></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-bold text-gray-900 dark:text-white">{item.stat.count}</span>
                      <span className="text-gray-400 dark:text-gray-500 w-8 text-right text-[11px] font-mono font-bold bg-gray-50 dark:bg-tabler-body/50 px-1.5 py-0.5 rounded">{Math.round(item.stat.pct)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            
            <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-tabler-border">
                <h3 className="font-semibold text-sm">Department Activity</h3>
              </div>
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {deptStats.map(dept => (
                  <div key={dept.name} className="group">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="text-gray-600 dark:text-gray-300 font-medium group-hover:text-tabler-primary transition-colors">{dept.name}</span>
                      <span className="text-gray-900 dark:text-white font-bold">{Math.round(dept.realPercent)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#206bc4] h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${dept.barPercent}%` }}></div>
                    </div>
                  </div>
                ))}
                {deptStats.length === 0 && <div className="text-center text-gray-500 text-sm pt-8">No transaction data yet.</div>}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-tabler-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-tabler-card relative z-30">
                <div>
                  <h3 className="font-semibold text-sm">System Activity Log</h3>
                  <div className="text-xs text-[#2fb344] font-medium flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3"/> Database syncing nominal</div>
                </div>
                <div className="relative w-full sm:w-auto">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-tabler-muted" />
                  <input type="text" placeholder="Search logs (Txn ID, Book, User)..." value={txSearchQuery} onChange={(e) => {setTxSearchQuery(e.target.value); setTxPage(1);}} className="w-full sm:w-72 pl-9 pr-3 py-2 sm:py-1.5 bg-gray-50 dark:bg-tabler-body border border-gray-200 dark:border-tabler-border rounded text-sm outline-none focus:border-tabler-primary transition-colors" />
                </div>
              </div>
              
              <div className="w-full h-28 relative z-0 hidden sm:block bg-white dark:bg-[#151f2b] border-b border-gray-100 dark:border-tabler-border">
                <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10">
                  <defs>
                    <linearGradient id="gradAct" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25"/><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/></linearGradient>
                  </defs>
                  <path d={`${activityPath} L1000,100 L0,100 Z`} fill="url(#gradAct)" className="transition-all duration-700" />
                  <path d={activityPath} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700" />
                  {activityHover && (
                    <circle cx={(activityHover.index / 29) * 1000} cy={95 - (activityHover.total / Math.max(maxActivity, 1)) * 85} r="4" fill="#8b5cf6" stroke="#fff" strokeWidth="2" />
                  )}
                </svg>

                <div className="absolute inset-0 z-20 flex pb-2">
                  {last30Days.map((day, i) => (
                    <div 
                      key={i} 
                      className="flex-1 h-full relative cursor-crosshair group"
                      onMouseEnter={() => setActivityHover({ ...day, index: i })}
                      onMouseLeave={() => setActivityHover(null)}
                    >
                      <div className="hidden group-hover:block absolute top-0 bottom-0 left-1/2 w-px bg-gray-300 dark:bg-gray-600 border-dashed border-l pointer-events-none"></div>
                    </div>
                  ))}
                </div>

                {activityHover && (
                  <div 
                    className="absolute top-2 z-30 pointer-events-none transform -translate-x-1/2 bg-[#182433] text-white px-3 py-2 rounded shadow-lg flex flex-col gap-1.5 min-w-[120px]"
                    style={{ left: `calc(${(activityHover.index / 29) * 100}%)` }}
                  >
                    <span className="text-[10px] font-bold border-b border-gray-700 pb-1 mb-1 text-center text-gray-400 uppercase tracking-wider">{activityHover.dateStr}</span>
                    <span className="text-xs flex items-center justify-between font-medium"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#8b5cf6]"></div> Total Actions</div> <span>{activityHover.total}</span></span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-x-auto relative z-30 bg-white dark:bg-tabler-card">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-tabler-body/50 text-[10px] text-gray-500 dark:text-tabler-muted uppercase tracking-wider border-b dark:border-tabler-border">
                    <tr><th className="px-5 py-3 font-medium">User ID</th><th className="px-5 py-3 font-medium">Action Event</th><th className="px-5 py-3 font-medium text-right">Date</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-tabler-border">
                    {paginatedTxs.map(tx => {
                      const item = inventory.find(i => i?.id === tx.item_id);
                      const studentInfo = validUsers.find(u => u.id === tx.student_id);
                      return (
                        <tr key={tx.transaction_id} className="hover:bg-gray-50 dark:hover:bg-tabler-border/30 transition-colors">
                          <td className="px-5 py-3 flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-tabler-primary/10 text-tabler-primary flex items-center justify-center text-[10px] font-bold">{tx.student_id ? tx.student_id.substring(0,2).toUpperCase() : 'U'}</div>
                            <div>
                              <div className="font-mono font-medium">{tx.student_id}</div>
                              <div className="text-[10px] text-gray-500">{studentInfo?.name || 'Unknown'}</div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-600 dark:text-tabler-muted">
                            <span className="font-mono text-[10px] mr-2 text-gray-400">{tx.transaction_id}</span>
                            {tx.status === 'Pending' ? `Requested: ${item?.name || tx.item_id}` : 
                             tx.status === 'Returned' ? `Returned: ${item?.name || tx.item_id}` : 
                             tx.status === 'Declined' ? `Declined: ${item?.name || tx.item_id}` : 
                             `Borrowed: ${item?.name || tx.item_id}`}
                          </td>
                          <td className="px-5 py-3 text-right text-gray-500 dark:text-tabler-muted font-mono text-xs">{tx.request_date}</td>
                        </tr>
                      )
                    })}
                    {paginatedTxs.length === 0 && <tr><td colSpan="3" className="px-5 py-6 text-center text-gray-500">No activity matches search.</td></tr>}
                  </tbody>
                </table>
              </div>
              <Pagination page={txPage} setPage={setTxPage} total={filteredTxs.length} perPage={8} />
            </div>

          </div>
        </div>
      )}

      {/* Book Database Tab */}
      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm flex flex-col overflow-hidden animate-in fade-in">
          <div className="p-4 border-b border-gray-200 dark:border-tabler-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-tabler-body/30">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-tabler-muted" />
                <input type="text" placeholder="Search database..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setInvPage(1); }} className="w-full sm:w-64 pl-9 pr-3 py-2 sm:py-1.5 bg-white dark:bg-tabler-body border border-gray-300 dark:border-tabler-border rounded text-sm outline-none focus:border-tabler-primary" />
              </div>
            </div>
            <button onClick={() => { setEditingItem(null); setItemForm({name:'', inventory_code:'', category:(genres[0]?.name || 'Uncategorized'), status:'Available', image: '', description: ''}); setIsItemModalOpen(true); }} className="w-full sm:w-auto px-4 py-2 sm:py-1.5 bg-tabler-primary text-white rounded text-sm font-medium hover:bg-[#1d5fb3] flex items-center justify-center gap-1.5"><Plus className="w-4 h-4" /> Add Book</button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-tabler-body/50 border-b border-gray-200 dark:border-tabler-border">
                <tr><th className="px-5 py-3 font-semibold text-gray-500 dark:text-tabler-muted text-[10px] uppercase">Book Subject</th><th className="px-5 py-3 font-semibold text-gray-500 dark:text-tabler-muted text-[10px] uppercase">Category</th><th className="px-5 py-3 font-semibold text-gray-500 dark:text-tabler-muted text-[10px] uppercase">Status</th><th className="px-5 py-3 text-right"></th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-tabler-border">
                {paginatedInventory.map((item, index) => (
                  <tr key={item.id || `inv-${index}`} className="hover:bg-gray-50 dark:hover:bg-tabler-border/30 transition-colors">
                    <td className="px-5 py-3 flex items-center gap-4"><img src={item.image || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded object-cover border dark:border-tabler-border" /><div><div className="font-medium">{item.name || 'Unnamed Item'}</div><div className="text-[10px] text-gray-500 font-mono mt-0.5">{item.inventory_code || 'N/A'}</div></div></td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{item.category || 'Uncategorized'}</td>
                    <td className="px-5 py-3"><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${item.status === 'Available' ? 'bg-tabler-success' : item.status === 'Borrowed' ? 'bg-tabler-warning' : 'bg-tabler-danger'}`}></span><span className="text-xs">{item.status || 'Unknown'}</span></div></td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center bg-white dark:bg-tabler-body border dark:border-tabler-border rounded overflow-hidden">
                        <button onClick={() => { setEditingItem(item); setItemForm(item); setIsItemModalOpen(true); }} className="px-3 py-1.5 text-gray-500 hover:text-tabler-primary border-r dark:border-tabler-border"><Edit className="w-3.5 h-3.5"/></button>
                        <button onClick={() => requestConfirm('Delete Book', `Permanently delete "${item.name}" from the system?`, () => deleteInventoryItem(item.id))} className="px-3 py-1.5 text-gray-500 hover:text-tabler-danger"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedInventory.length === 0 && <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-500">No books found in inventory.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={invPage} setPage={setInvPage} total={filteredInventory.length} perPage={8} />
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 border-b border-gray-200 dark:border-tabler-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-tabler-body/30">
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-tabler-muted" />
              <input type="text" placeholder="Search users by name or email..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setUserPage(1); }} className="w-full sm:w-72 pl-9 pr-3 py-2 sm:py-1.5 bg-white dark:bg-tabler-body border border-gray-300 dark:border-tabler-border rounded text-sm outline-none focus:border-tabler-primary" />
            </div>
            <button onClick={() => { setUserForm({name:'', idNumber:'', email:'', password:'', role:'student'}); setIsUserModalOpen(true); }} className="w-full sm:w-auto px-4 py-2 sm:py-1.5 bg-tabler-primary text-white rounded text-sm font-medium hover:bg-[#1d5fb3] flex items-center justify-center gap-1.5"><UserPlus className="w-4 h-4" /> Add User</button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-tabler-body/50 border-b border-gray-200 dark:border-tabler-border">
                <tr>
                  <th className="px-5 py-3 font-semibold text-gray-500 dark:text-tabler-muted text-[10px] uppercase tracking-wider">User Identity</th>
                  <th className="px-5 py-3 font-semibold text-gray-500 dark:text-tabler-muted text-[10px] uppercase tracking-wider">Access Role</th>
                  <th className="px-5 py-3 font-semibold text-gray-500 dark:text-tabler-muted text-[10px] uppercase tracking-wider">SAO Permissions</th>
                  <th className="px-5 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-tabler-border">
                {paginatedUsers.map((u, index) => {
                  const isSelf = u.uid === user?.uid;
                  return (
                  <tr key={u.uid || `usr-${index}`} className="hover:bg-gray-50 dark:hover:bg-tabler-border/30 transition-colors">
                    <td className="px-5 py-3 flex items-center gap-4">
                      <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name || 'User'}&background=random&color=fff`} className="w-10 h-10 rounded-full object-cover border dark:border-tabler-border" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{u.name || 'Unknown User'} {isSelf && <span className="text-tabler-primary text-xs ml-1">(You)</span>}</div>
                        <div className="text-[10px] text-gray-500 dark:text-tabler-muted font-mono mt-0.5 uppercase">{u.email}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <select 
                        value={u.role || 'student'} 
                        onChange={(e) => {
                          const val = e.target.value;
                          requestConfirm('Modify Role', `Change ${u.name}'s access level to ${val.toUpperCase()}?`, () => updateUserRole(u.uid, val));
                        }}
                        disabled={isSelf} 
                        className={`text-xs font-bold uppercase px-2 py-1 rounded border outline-none cursor-pointer transition-colors ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' :
                          u.role === 'sao' ? 'bg-tabler-success/10 text-tabler-success border-tabler-success/20' : 
                          'bg-tabler-primary/10 text-tabler-primary border-tabler-primary/20'
                        } ${isSelf ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <option value="student">Student</option>
                        <option value="sao">SAO Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      {(u.role === 'sao' || u.role === 'admin') ? (
                        <div className={`flex items-center gap-4 text-xs font-bold text-gray-600 dark:text-gray-300 ${isSelf ? 'opacity-70' : ''}`}>
                          <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={u.permissions?.create || false} onChange={() => togglePermission(u, 'create')} disabled={u.role === 'admin' || isSelf} className="accent-tabler-primary cursor-pointer disabled:cursor-not-allowed" /> Create</label>
                          <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={u.permissions?.read || false} onChange={() => togglePermission(u, 'read')} disabled={u.role === 'admin' || isSelf} className="accent-tabler-primary cursor-pointer disabled:cursor-not-allowed" /> Read</label>
                          <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={u.permissions?.update || false} onChange={() => togglePermission(u, 'update')} disabled={u.role === 'admin' || isSelf} className="accent-tabler-primary cursor-pointer disabled:cursor-not-allowed" /> Update</label>
                          <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={u.permissions?.delete || false} onChange={() => togglePermission(u, 'delete')} disabled={u.role === 'admin' || isSelf} className="accent-tabler-primary cursor-pointer disabled:cursor-not-allowed" /> Delete</label>
                        </div>
                      ) : <span className="text-xs text-gray-400 italic">Student accounts are read-only.</span>}
                    </td>
                    <td className="px-5 py-3 text-right">{u.role === 'admin' && <ShieldAlert className="w-4 h-4 text-purple-500 ml-auto" />}</td>
                  </tr>
                )})}
                {paginatedUsers.length === 0 && <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-500">No valid users found.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={userPage} setPage={setUserPage} total={filteredUsers.length} perPage={8} />
        </div>
      )}

      {/* Genres Tab */}
      {activeTab === 'genres' && (
        <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm overflow-hidden animate-in fade-in duration-300 max-w-2xl">
          <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-tabler-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-tabler-body/30">
            <div>
               <h3 className="font-semibold text-sm">Book Categories (Genres)</h3>
               <p className="text-xs text-gray-500 dark:text-tabler-muted mt-1">Add or remove genres used in the inventory and discover tabs.</p>
            </div>
            <form onSubmit={handleGenreSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <input type="text" placeholder="New Genre Name..." required value={newGenre} onChange={(e) => setNewGenre(e.target.value)} className="w-full sm:flex-1 px-3 py-2 sm:py-1.5 bg-white dark:bg-tabler-body border border-gray-300 dark:border-tabler-border rounded text-sm outline-none focus:border-tabler-primary" />
              <button type="submit" className="w-full sm:w-auto px-4 py-2 sm:py-1.5 bg-tabler-primary text-white rounded text-sm font-medium hover:bg-[#1d5fb3] shadow-sm whitespace-nowrap">Add Genre</button>
            </form>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-tabler-border max-h-[500px] overflow-y-auto">
            {genres.map(g => (
              <li key={g.id} className="px-5 py-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-tabler-border/30 transition-colors">
                <span className="text-sm font-medium">{g.name}</span>
                <button onClick={() => requestConfirm('Delete Genre', `Are you sure you want to remove "${g.name}" from the system?`, () => deleteGenre(g.id))} className="p-1.5 text-gray-400 hover:text-tabler-danger hover:bg-red-50 dark:hover:bg-tabler-danger/10 rounded"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
            {genres.length === 0 && <li className="px-5 py-6 text-center text-sm text-gray-500">No genres found. Add one above.</li>}
          </ul>
        </div>
      )}

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-tabler-body/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-tabler-border flex justify-between items-center bg-gray-50 dark:bg-tabler-body/50">
              <h3 className="font-semibold text-sm">{editingItem ? 'Edit Book Data' : 'Provision New Book'}</h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleItemSubmit}>
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Book Name</label>
                  <input required type="text" value={itemForm.name} onChange={(e) => setItemForm({...itemForm, name: e.target.value})} className="w-full px-3 py-2 border rounded text-sm outline-none dark:bg-tabler-body dark:border-tabler-border" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">System Code</label>
                  <input required type="text" value={itemForm.inventory_code} onChange={(e) => setItemForm({...itemForm, inventory_code: e.target.value})} className="w-full px-3 py-2 border rounded text-sm uppercase outline-none font-mono dark:bg-tabler-body dark:border-tabler-border" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Category (Genre)</label>
                  <select value={itemForm.category} onChange={(e) => setItemForm({...itemForm, category: e.target.value})} className="w-full px-3 py-2 border rounded text-sm outline-none dark:bg-tabler-body dark:border-tabler-border">
                    {genres.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                    {genres.length === 0 && <option value="Uncategorized">Uncategorized (Add via Genres Tab)</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Image URL</label>
                  <input required type="url" value={itemForm.image} onChange={(e) => setItemForm({...itemForm, image: e.target.value})} className="w-full px-3 py-2 border rounded text-sm outline-none dark:bg-tabler-body dark:border-tabler-border" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Description</label>
                  <textarea value={itemForm.description} onChange={(e) => setItemForm({...itemForm, description: e.target.value})} className="w-full px-3 py-2 border rounded text-sm outline-none h-20 resize-none dark:bg-tabler-body dark:border-tabler-border"></textarea>
                </div>
                {editingItem && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Status</label>
                    <select value={itemForm.status} onChange={(e) => setItemForm({...itemForm, status: e.target.value})} className="w-full px-3 py-2 border rounded text-sm outline-none dark:bg-tabler-body dark:border-tabler-border">
                      <option>Available</option><option>Borrowed</option><option>Maintenance</option><option>Damaged</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="px-4 sm:px-5 py-4 bg-gray-50 border-t flex flex-col sm:flex-row justify-end gap-3 dark:bg-tabler-body/50 dark:border-tabler-border">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="w-full sm:w-auto px-4 py-2 text-sm font-medium border rounded hover:bg-gray-100 dark:hover:bg-tabler-border">Cancel</button>
                <button type="submit" className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-tabler-primary rounded hover:bg-[#1d5fb3]">Save Book</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW: Admin User Creation Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-tabler-body/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-tabler-border flex justify-between items-center bg-gray-50 dark:bg-tabler-body/50">
              <h3 className="font-semibold text-sm">Provision New User</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUserSubmit}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Full Name</label>
                  <input required type="text" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} className="w-full px-3 py-2 border rounded text-sm outline-none dark:bg-tabler-body dark:border-tabler-border" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">ID Number</label>
                  <input required type="text" placeholder="e.g. BSIT-123" value={userForm.idNumber} onChange={(e) => setUserForm({...userForm, idNumber: e.target.value})} className="w-full px-3 py-2 border rounded text-sm uppercase outline-none font-mono dark:bg-tabler-body dark:border-tabler-border" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Email Address</label>
                  <input required type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} className="w-full px-3 py-2 border rounded text-sm outline-none dark:bg-tabler-body dark:border-tabler-border" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Temporary Password</label>
                  <input required type="text" minLength="6" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} className="w-full px-3 py-2 border rounded text-sm outline-none dark:bg-tabler-body dark:border-tabler-border" placeholder="Minimum 6 characters" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Account Role</label>
                  <select value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value})} className="w-full px-3 py-2 border rounded text-sm outline-none dark:bg-tabler-body dark:border-tabler-border">
                    <option value="student">Student User</option>
                    <option value="sao">SAO Staff</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
              </div>
              <div className="px-4 sm:px-5 py-4 bg-gray-50 border-t flex flex-col sm:flex-row justify-end gap-3 dark:bg-tabler-body/50 dark:border-tabler-border">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="w-full sm:w-auto px-4 py-2 text-sm font-medium border rounded hover:bg-gray-100 dark:hover:bg-tabler-border">Cancel</button>
                <button type="submit" className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-tabler-primary rounded hover:bg-[#1d5fb3]">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}