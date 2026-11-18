import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Check, ArrowRightLeft, X, LayoutDashboard, ClipboardCheck, ArrowUpRight, Ban, History, Database, Search, Plus, Edit, Trash2, Tags, AlertCircle, Clock, ChevronDown } from 'lucide-react';

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

export default function SaoDashboard() {
  const { transactions, updateTransaction, inventory, usersList, addInventoryItem, updateInventoryItem, deleteInventoryItem, genres, addGenre, deleteGenre, showToast, user, requestConfirm } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTx, setApproveTx] = useState(null);

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnTx, setReturnTx] = useState(null);
  const [returnAction, setReturnAction] = useState('Returned');
  const [returnCondition, setReturnCondition] = useState('Available');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [txSearchQuery, setTxSearchQuery] = useState('');
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', inventory_code: '', category: 'Computer Science', status: 'Available', image: '', description: '' });
  const [newGenre, setNewGenre] = useState('');

  const [appPage, setAppPage] = useState(1);
  const [retPage, setRetPage] = useState(1);
  const [histPage, setHistPage] = useState(1);
  const [invPage, setInvPage] = useState(1);

  const canRead = user?.permissions?.read;
  const canCreate = user?.permissions?.create;
  const canUpdate = user?.permissions?.update;
  const canDelete = user?.permissions?.delete;

  const filterTx = (tx) => {
    if (!txSearchQuery) return true;
    const q = txSearchQuery.toLowerCase();
    const item = inventory.find(i => i.id === tx.item_id);
    const student = usersList.find(u => u.id === tx.student_id);
    const itemName = item?.name?.toLowerCase() || '';
    const studentName = student?.name?.toLowerCase() || '';
    return tx.transaction_id.toLowerCase().includes(q) || 
           tx.student_id.toLowerCase().includes(q) || 
           itemName.includes(q) || 
           studentName.includes(q);
  };

  const pendingRequests = transactions.filter(tx => tx.status === 'Pending').filter(filterTx);
  const activeBorrowings = transactions.filter(tx => tx.status === 'Borrowed').filter(filterTx);
  const transactionHistory = transactions.filter(tx => ['Returned', 'Declined', 'Cancelled'].includes(tx.status)).filter(filterTx);

  const saoTabs = [
    { id: 'dashboard', label: 'SAO Dashboard', icon: LayoutDashboard, onClick: () => setActiveTab('dashboard') },
    { id: 'approvals', label: 'Approvals', icon: ClipboardCheck, badge: pendingRequests.length, onClick: () => { setActiveTab('approvals'); setAppPage(1); setTxSearchQuery(''); } },
    { id: 'returns', label: 'Active Borrowings', icon: ArrowUpRight, onClick: () => { setActiveTab('returns'); setRetPage(1); setTxSearchQuery(''); } },
    { id: 'history', label: 'SAO History', icon: History, onClick: () => { setActiveTab('history'); setHistPage(1); setTxSearchQuery(''); } },
    ...(canRead ? [{ id: 'inventory', label: 'Asset Inventory', icon: Database, onClick: () => { setActiveTab('inventory'); setInvPage(1); } }] : []),
    ...(canUpdate ? [{ id: 'genres', label: 'Categories', icon: Tags, onClick: () => setActiveTab('genres') }] : [])
  ];
  const currentTabObj = saoTabs.find(t => t.id === activeTab) || saoTabs[0];

  const validInventory = inventory.filter(item => item !== null && item !== undefined);
  const filteredInventory = validInventory.filter(item => {
    if (!item) return false;
    const itemName = typeof item.name === 'string' ? item.name : '';
    const itemCode = typeof item.inventory_code === 'string' ? item.inventory_code : '';
    const query = typeof searchQuery === 'string' ? searchQuery.toLowerCase() : '';
    if (query && itemName === '' && itemCode === '') return false;
    return itemName.toLowerCase().includes(query) || itemCode.toLowerCase().includes(query);
  });

  const paginatedPending = pendingRequests.slice((appPage - 1) * 8, appPage * 8);
  const paginatedActive = activeBorrowings.slice((retPage - 1) * 8, retPage * 8);
  const paginatedHistory = transactionHistory.slice((histPage - 1) * 8, histPage * 8);
  const paginatedInventory = filteredInventory.slice((invPage - 1) * 8, invPage * 8);

  const todayStr = new Date().toISOString().split('T')[0];
  const saoStats = {
    pendingCount: transactions.filter(tx => tx.status === 'Pending').length,
    activeCount: transactions.filter(tx => tx.status === 'Borrowed').length,
    todayRequests: transactions.filter(tx => tx.request_date === todayStr).length,
    attentionItems: validInventory.filter(i => i.status === 'Damaged' || i.status === 'Maintenance').length
  };

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

  const last7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayName = i === 0 ? "Today" : shortDays[d.getDay()];
      
      const dayTxs = transactions.filter(tx => tx.request_date === dateStr);
      days.push({
        dateStr,
        dayName,
        borrowed: dayTxs.filter(tx => tx.status === 'Pending' || tx.status === 'Borrowed').length,
        returned: dayTxs.filter(tx => ['Returned', 'Declined', 'Cancelled'].includes(tx.status)).length,
      });
    }
    return days;
  }, [transactions]);

  const maxDeskTraffic = Math.max(...last7Days.map(d => Math.max(d.borrowed, d.returned)), 5);
  const liveQueue = [...pendingRequests, ...activeBorrowings].slice(0, 5);

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (editingItem && editingItem.id) {
      if (canUpdate) await updateInventoryItem({ ...editingItem, ...itemForm });
      else showToast('You lack update permissions.', 'error');
    } else {
      if (canCreate) await addInventoryItem({ id: `item_${Date.now()}`, rating: 5.0, reviews: 0, ...itemForm });
      else showToast('You lack create permissions.', 'error');
    }
    setIsItemModalOpen(false);
  };

  const handleGenreSubmit = (e) => {
    e.preventDefault();
    if(newGenre.trim()){ 
      requestConfirm('Add Category', `Are you sure you want to add "${newGenre.trim()}" as a new category?`, async () => {
        await addGenre(newGenre.trim()); 
        setNewGenre('');
      });
    }
  };

  const openApproveModal = (tx) => { setApproveTx(tx); setApproveModalOpen(true); };
  const handleApprove = async () => {
    try {
      await updateTransaction(approveTx.transaction_id, { status: 'Borrowed', processed_by: user.uid });
      const itemToUpdate = inventory.find(i => i.id === approveTx.item_id);
      if (itemToUpdate) await updateInventoryItem({ ...itemToUpdate, status: 'Borrowed' });
      showToast('Transaction approved.'); setApproveModalOpen(false);
    } catch (error) { showToast('Sync failed.', 'error'); }
  };

  const handleDecline = (txId) => {
    requestConfirm('Decline Request', 'Are you sure you want to reject this borrowing request?', async () => {
      try { await updateTransaction(txId, { status: 'Declined', processed_by: user.uid }); showToast('Declined.', 'warning'); } 
      catch (error) { showToast('Sync failed.', 'error'); }
    });
  };

  const openReturnModal = (tx) => { 
    setReturnTx(tx); 
    setReturnAction('Returned');
    setReturnCondition('Available');
    setReturnModalOpen(true); 
  };
  
  const handleProcessReturn = async () => {
    try {
      await updateTransaction(returnTx.transaction_id, { status: returnAction, processed_by: user.uid });
      const itemToUpdate = inventory.find(i => i.id === returnTx.item_id);
      if (itemToUpdate) await updateInventoryItem({ ...itemToUpdate, status: returnCondition });
      
      showToast(`Transaction marked as ${returnAction}. Asset logged as ${returnCondition}.`); 
      setReturnModalOpen(false);
    } catch (error) { 
      showToast('Sync failed.', 'error'); 
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-gray-900 dark:text-gray-100 min-h-screen">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">SAO Operations Desk</h2>
          <p className="text-sm text-gray-500 dark:text-tabler-muted mt-1">Review requests, process physical returns, and manage system assets.</p>
        </div>
      </div>

      {/* Responsive Navigation: Dropdown on Mobile, Tab Bar on Desktop */}
      <div className="relative md:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm text-sm font-semibold text-gray-900 dark:text-white"
        >
          <span className="flex items-center gap-2.5 text-tabler-primary">
            <currentTabObj.icon className="w-4 h-4" />
            {currentTabObj.label}
            {currentTabObj.badge !== undefined && (
              <span className="bg-tabler-warning/10 text-tabler-warning px-2 py-0.5 rounded-full text-[10px] font-bold">{currentTabObj.badge}</span>
            )}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${mobileMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-xl z-40 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {saoTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { tab.onClick(); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-tabler-primary/10 text-tabler-primary font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-tabler-body'}`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </span>
                    {tab.badge !== undefined && (
                      <span className="bg-tabler-warning/10 text-tabler-warning px-2 py-0.5 rounded-full text-[10px] font-bold">{tab.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
      
      <div className="hidden md:flex bg-white dark:bg-tabler-card border rounded-lg shadow-sm overflow-x-auto scrollbar-hide border-gray-200 dark:border-tabler-border">
        {saoTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className={`whitespace-nowrap flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${isActive ? 'border-tabler-primary text-tabler-primary bg-gray-50 dark:bg-tabler-body/50' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
              {tab.badge !== undefined && (
                <span className="bg-tabler-warning/10 text-tabler-warning px-1.5 rounded-full text-[10px] ml-1">{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {['approvals', 'returns', 'history'].includes(activeTab) && (
        <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg p-4 shadow-sm">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-tabler-muted" />
            <input type="text" placeholder="Search by Student Name, ID, or Asset..." value={txSearchQuery} onChange={(e) => {setTxSearchQuery(e.target.value); setAppPage(1); setRetPage(1); setHistPage(1);}} className="w-full pl-9 pr-3 py-2 sm:py-1.5 bg-white dark:bg-tabler-body border border-gray-300 dark:border-tabler-border rounded text-sm outline-none focus:border-tabler-primary transition-colors" />
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'sao-stat-1', label: 'Pending Approvals', val: saoStats.pendingCount, color: 'text-tabler-warning', icon: ClipboardCheck, fill: 'bg-tabler-warning' },
              { id: 'sao-stat-2', label: 'Active Borrowed', val: saoStats.activeCount, color: 'text-tabler-primary', icon: ArrowUpRight, fill: 'bg-tabler-primary' },
              { id: 'sao-stat-3', label: "Today's Requests", val: saoStats.todayRequests, color: 'text-tabler-success', icon: Plus, fill: 'bg-[#2fb344]' },
              { id: 'sao-stat-4', label: 'Needs Attention', val: saoStats.attentionItems, color: 'text-tabler-danger', icon: AlertCircle, fill: 'bg-[#d63939]' }
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
            
            <div className="lg:col-span-2 bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-tabler-border flex justify-between items-center bg-gray-50 dark:bg-tabler-body/30">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-tabler-primary" />
                  <h3 className="font-semibold text-sm">Live Desk Queue</h3>
                </div>
                <button onClick={() => setActiveTab('approvals')} className="text-xs text-tabler-primary font-medium hover:underline">View All</button>
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <tbody className="divide-y dark:divide-tabler-border">
                    {liveQueue.map(tx => {
                      const item = inventory.find(i => i.id === tx.item_id);
                      const student = usersList.find(u => u.id === tx.student_id);
                      return (
                        <tr key={tx.transaction_id} className="hover:bg-gray-50 dark:hover:bg-tabler-border/30">
                          <td className="px-5 py-3">
                             <div className="text-gray-900 dark:text-gray-100 text-sm font-medium">{student?.name || 'Unknown User'}</div>
                             <div className="text-gray-500 dark:text-gray-400 text-[10px] font-mono mt-0.5">{tx.student_id}</div>
                          </td>
                          <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                             <div className="flex items-center gap-2">
                               <span className={`w-2 h-2 rounded-full ${tx.status === 'Pending' ? 'bg-tabler-warning' : 'bg-tabler-primary'}`}></span>
                               <span className="font-medium">{item?.name || 'Unknown Asset'}</span>
                             </div>
                          </td>
                          <td className="px-5 py-3 text-right">
                            {tx.status === 'Pending' ? (
                              <button onClick={() => openApproveModal(tx)} className="px-3 py-1.5 bg-tabler-success text-white rounded text-xs shadow-sm hover:bg-green-600 transition-colors">Approve</button>
                            ) : (
                              <button onClick={() => openReturnModal(tx)} className="px-3 py-1.5 bg-gray-100 text-gray-700 dark:bg-tabler-border dark:text-gray-200 border dark:border-gray-700 rounded text-xs shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Process Return</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {liveQueue.length === 0 && <tr><td colSpan="3" className="px-5 py-8 text-center text-gray-500">No active items in the queue.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-sm">7-Day Desk Volume</h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-tabler-muted mb-4 justify-center">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-tabler-primary"></div> Requests</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-tabler-success"></div> Returns</span>
              </div>
              
              <div className="relative h-48 w-full flex items-end justify-between pt-2 border-b border-gray-200 dark:border-tabler-border pb-2 mt-auto">
                {[25, 50, 75, 100].map(pct => (
                  <div key={pct} className="absolute w-full flex items-center z-0 pointer-events-none" style={{ bottom: `${pct}%` }}>
                    <div className="flex-1 border-b border-gray-100 dark:border-gray-800 border-dashed"></div>
                  </div>
                ))}

                {last7Days.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 group z-10 w-full relative">
                    <div className="absolute bottom-full mb-2 bg-[#182433] text-white px-3 py-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none flex flex-col gap-1.5 min-w-[120px]">
                      <span className="font-bold border-b border-gray-700 pb-1 w-full text-center text-[10px] uppercase tracking-wider text-gray-400">{day.dayName}</span>
                      <span className="flex items-center justify-between text-xs font-medium"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-tabler-primary"></div> Requests</div> <span>{day.borrowed}</span></span>
                      <span className="flex items-center justify-between text-xs font-medium"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-tabler-success"></div> Returns</div> <span>{day.returned}</span></span>
                    </div>

                    <div className="flex gap-1 h-40 items-end w-full justify-center relative cursor-crosshair">
                       <div className="w-2 sm:w-3 bg-tabler-primary rounded-t-sm transition-all duration-500 hover:opacity-80" style={{height: `${(day.borrowed / Math.max(maxDeskTraffic, 1)) * 100}%`}}></div>
                       <div className="w-2 sm:w-3 bg-tabler-success rounded-t-sm transition-all duration-500 hover:opacity-80" style={{height: `${(day.returned / Math.max(maxDeskTraffic, 1)) * 100}%`}}></div>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{day.dayName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-6">
            <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm p-6 flex flex-col relative">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-semibold text-sm">Asset Distribution (Physical Inventory)</h3>
                <span className="text-[10px] font-bold tracking-widest uppercase bg-gray-100 dark:bg-tabler-body/50 px-2 py-1 rounded text-gray-500">{invStats.total} Assets Total</span>
              </div>

              <div className="w-full h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex mb-8 shadow-inner">
                <div style={{width: `${invStats.avail.pct}%`}} className="h-full bg-[#2fb344] transition-all duration-1000"></div>
                <div style={{width: `${invStats.borrowed.pct}%`}} className="h-full bg-[#206bc4] transition-all duration-1000 border-l border-white/20"></div>
                <div style={{width: `${invStats.pending.pct}%`}} className="h-full bg-[#f59f00] transition-all duration-1000 border-l border-white/20"></div>
                <div style={{width: `${invStats.issues.pct}%`}} className="h-full bg-[#d63939] transition-all duration-1000 border-l border-white/20"></div>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-nowrap gap-3 sm:gap-4 justify-between flex-1 mt-2">
                {[
                  { label: 'Available (On Shelf)', stat: invStats.avail },
                  { label: 'Borrowed (In Field)', stat: invStats.borrowed },
                  { label: 'Pending (Reserved)', stat: invStats.pending },
                  { label: 'Attention (Damaged)', stat: invStats.issues }
                ].map(item => (
                  <div key={item.label} className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-tabler-body/50 rounded-lg flex-1 border border-transparent hover:border-gray-200 dark:hover:border-tabler-border transition-colors">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${item.stat.color} shadow-sm`}></div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{item.stat.count}</span>
                      <span className="text-gray-400 dark:text-gray-500 text-[11px] font-mono font-bold mt-1">{Math.round(item.stat.pct)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="bg-white border rounded-lg shadow-sm flex flex-col min-h-[400px] dark:bg-tabler-card dark:border-tabler-border">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b bg-gray-50 dark:bg-tabler-body/50 dark:border-tabler-border">
                <tr><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Asset Name</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Student Identity</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y dark:divide-tabler-border">
                {paginatedPending.map(tx => {
                  const item = inventory.find(i => i.id === tx.item_id);
                  const student = usersList.find(u => u.id === tx.student_id);
                  return (
                    <tr key={tx.transaction_id} className="hover:bg-gray-50 dark:hover:bg-tabler-border/30">
                      <td className="px-5 py-3 flex items-center gap-3"><img src={item?.image || 'https://via.placeholder.com/150'} className="w-8 h-8 rounded object-cover" /><div><div className="font-medium">{item?.name || 'Unknown'}</div><div className="text-[10px] text-gray-500">{tx.transaction_id}</div></div></td>
                      <td className="px-5 py-3">
                         <div className="text-gray-900 dark:text-gray-100 text-sm font-medium">{student?.name || 'Unknown User'}</div>
                         <div className="text-gray-500 dark:text-gray-400 text-[10px] font-mono mt-0.5">{tx.student_id}</div>
                         <div className="text-[10px] text-tabler-primary font-bold mt-1">Expected Return: {tx.expected_return_date || 'N/A'}</div>
                      </td>
                      <td className="px-5 py-3 text-right flex items-center justify-end gap-2">
                        <button onClick={() => handleDecline(tx.transaction_id)} className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-tabler-danger/20 dark:text-tabler-danger rounded text-xs flex items-center gap-1.5 shadow-sm"><Ban className="w-3 h-3" /> Decline</button>
                        <button onClick={() => openApproveModal(tx)} className="px-3 py-1.5 bg-tabler-success text-white hover:bg-green-600 rounded text-xs flex items-center gap-1.5 shadow-sm"><Check className="w-3 h-3" /> Approve</button>
                      </td>
                    </tr>
                  );
                })}
                {paginatedPending.length === 0 && <tr><td colSpan="3" className="px-5 py-8 text-center text-gray-500">No pending approvals match search.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={appPage} setPage={setAppPage} total={pendingRequests.length} />
        </div>
      )}

      {activeTab === 'returns' && (
        <div className="bg-white border rounded-lg shadow-sm flex flex-col min-h-[400px] dark:bg-tabler-card dark:border-tabler-border">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b bg-gray-50 dark:bg-tabler-body/50 dark:border-tabler-border">
                <tr><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Asset Name</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Student Identity</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y dark:divide-tabler-border">
                {paginatedActive.map(tx => {
                  const item = inventory.find(i => i.id === tx.item_id);
                  const student = usersList.find(u => u.id === tx.student_id);
                  return (
                    <tr key={tx.transaction_id} className="hover:bg-gray-50 dark:hover:bg-tabler-border/30">
                      <td className="px-5 py-3 flex items-center gap-4"><img src={item?.image || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded object-cover" /><div><div className="font-medium">{item?.name || 'Unknown'}</div><div className="text-[10px] text-gray-500">{tx.transaction_id}</div></div></td>
                      <td className="px-5 py-3">
                        <div className="text-gray-900 dark:text-gray-100 text-sm font-medium">{student?.name || 'Unknown User'}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-[10px] font-mono mt-0.5">{tx.student_id}</div>
                        <div className="text-[10px] text-tabler-primary font-bold mt-1">Due: {tx.expected_return_date || 'N/A'}</div>
                      </td>
                      <td className="px-5 py-3 text-right"><button onClick={() => openReturnModal(tx)} className="px-3 py-1.5 bg-tabler-primary/10 text-tabler-primary border border-tabler-primary/20 rounded text-xs flex items-center gap-1.5 ml-auto transition-colors hover:bg-tabler-primary hover:text-white"><ArrowRightLeft className="w-3 h-3" /> Process Update</button></td>
                    </tr>
                  );
                })}
                {paginatedActive.length === 0 && <tr><td colSpan="3" className="px-5 py-8 text-center text-gray-500">No active assets in the field match search.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={retPage} setPage={setRetPage} total={activeBorrowings.length} />
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white border rounded-lg shadow-sm flex flex-col min-h-[400px] dark:bg-tabler-card dark:border-tabler-border">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b bg-gray-50 dark:bg-tabler-body/50 dark:border-tabler-border">
                <tr><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Asset Name</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Student Details</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Date</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Status</th></tr>
              </thead>
              <tbody className="divide-y dark:divide-tabler-border">
                {paginatedHistory.map(tx => {
                  const item = inventory.find(i => i.id === tx.item_id);
                  const student = usersList.find(u => u.id === tx.student_id);
                  return (
                    <tr key={tx.transaction_id} className="hover:bg-gray-50 dark:hover:bg-tabler-border/30">
                      <td className="px-5 py-3 flex items-center gap-4"><img src={item?.image || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded object-cover" /><div><div className="font-medium">{item?.name || 'Unknown'}</div><div className="text-[10px] text-gray-500 font-mono">{tx.transaction_id}</div></div></td>
                      <td className="px-5 py-3">
                        <div className="text-gray-900 dark:text-gray-100 text-sm font-medium">{student?.name || 'Unknown User'}</div>
                        <div className="font-mono text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">{tx.student_id}</div>
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs">{tx.request_date}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          tx.status === 'Returned' ? 'bg-tabler-success/10 text-tabler-success border border-tabler-success/20' : 
                          tx.status === 'Declined' ? 'bg-red-100 text-red-700 dark:bg-tabler-danger/20 dark:text-tabler-danger border border-red-200 dark:border-tabler-danger/30' : 
                          'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-700'
                        }`}>{tx.status}</span>
                      </td>
                    </tr>
                  );
                })}
                {paginatedHistory.length === 0 && <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-500">No transaction history match search.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={histPage} setPage={setHistPage} total={transactionHistory.length} />
        </div>
      )}

      {canRead && activeTab === 'inventory' && (
        <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm flex flex-col min-h-[400px] overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 border-b border-gray-200 dark:border-tabler-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-tabler-body/30">
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-tabler-muted" />
              <input type="text" placeholder="Search database..." value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); setInvPage(1);}} className="w-full sm:w-64 pl-9 pr-3 py-2 sm:py-1.5 bg-white dark:bg-tabler-body border border-gray-300 dark:border-tabler-border rounded text-sm outline-none focus:border-tabler-primary transition-colors" />
            </div>
            {canCreate && (
              <button onClick={() => { setEditingItem(null); setItemForm({name:'', inventory_code:'', category:(genres[0]?.name || 'Uncategorized'), status:'Available', image: '', description: ''}); setIsItemModalOpen(true); }} className="w-full sm:w-auto px-4 py-2 sm:py-1.5 bg-tabler-primary text-white rounded text-sm font-medium hover:bg-[#1d5fb3] flex items-center justify-center gap-1.5 shadow-sm">
                <Plus className="w-4 h-4" /> Add Asset
              </button>
            )}
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-tabler-body/50 border-b border-gray-200 dark:border-tabler-border">
                <tr><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Asset Name</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Category</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Status</th><th className="px-5 py-3 text-right"></th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-tabler-border">
                {paginatedInventory.map((item, index) => (
                  <tr key={item.id || `inv-${index}`} className="hover:bg-gray-50 dark:hover:bg-tabler-border/30 transition-colors">
                    <td className="px-5 py-3 flex items-center gap-4"><img src={item.image || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded object-cover border" /><div><div className="font-medium">{item.name || 'Unnamed'}</div><div className="text-[10px] text-gray-500 font-mono mt-0.5">{item.inventory_code || 'N/A'}</div></div></td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{item.category}</td>
                    <td className="px-5 py-3"><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${item.status === 'Available' ? 'bg-tabler-success' : item.status === 'Borrowed' ? 'bg-tabler-warning' : 'bg-tabler-danger'}`}></span><span className="text-xs">{item.status}</span></div></td>
                    <td className="px-5 py-3 text-right">
                      {(canUpdate || canDelete) && (
                        <div className="inline-flex items-center border rounded overflow-hidden dark:border-tabler-border">
                          {canUpdate && <button onClick={() => { setEditingItem(item); setItemForm(item); setIsItemModalOpen(true); }} className="px-3 py-1.5 border-r hover:text-tabler-primary dark:border-tabler-border"><Edit className="w-3.5 h-3.5"/></button>}
                          {canDelete && <button onClick={() => requestConfirm('Delete Asset', `Permanently delete "${item.name}" from the system?`, () => deleteInventoryItem(item.id))} className="px-3 py-1.5 hover:text-tabler-danger"><Trash2 className="w-3.5 h-3.5"/></button>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {paginatedInventory.length === 0 && <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-500">No assets match search.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={invPage} setPage={setInvPage} total={filteredInventory.length} />
        </div>
      )}

      {canUpdate && activeTab === 'genres' && (
        <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm overflow-hidden animate-in fade-in duration-300 max-w-2xl">
          <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-tabler-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-tabler-body/30">
            <div>
               <h3 className="font-semibold text-sm">Asset Categories</h3>
               <p className="text-xs text-gray-500 dark:text-tabler-muted mt-1">Add or remove categories used in the inventory and discover tabs.</p>
            </div>
            <form onSubmit={handleGenreSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <input type="text" placeholder="New Category Name..." required value={newGenre} onChange={(e) => setNewGenre(e.target.value)} className="w-full sm:flex-1 px-3 py-2 sm:py-1.5 bg-white dark:bg-tabler-body border border-gray-300 dark:border-tabler-border rounded text-sm outline-none focus:border-tabler-primary" />
              <button type="submit" className="w-full sm:w-auto px-4 py-2 sm:py-1.5 bg-tabler-primary text-white rounded text-sm font-medium hover:bg-[#1d5fb3] shadow-sm whitespace-nowrap">Add Category</button>
            </form>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-tabler-border max-h-[500px] overflow-y-auto">
            {genres.map(g => (
              <li key={g.id} className="px-5 py-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-tabler-border/30 transition-colors">
                <span className="text-sm font-medium">{g.name}</span>
                <button onClick={() => requestConfirm('Delete Category', `Are you sure you want to remove "${g.name}" from the system?`, () => deleteGenre(g.id))} className="p-1.5 text-gray-400 hover:text-tabler-danger hover:bg-red-50 dark:hover:bg-tabler-danger/10 rounded"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
            {genres.length === 0 && <li className="px-5 py-6 text-center text-sm text-gray-500">No categories found. Add one above.</li>}
          </ul>
        </div>
      )}

      {/* Action Modals */}
      {approveModalOpen && approveTx && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border rounded-lg shadow-2xl max-w-sm w-full dark:bg-tabler-card dark:border-tabler-border">
            <div className="p-5">
              <p className="text-sm mb-4">Confirm borrowing request for Student ID: <span className="font-mono text-tabler-primary font-bold">{approveTx.student_id}</span></p>
              <div className="flex flex-col sm:flex-row justify-end gap-3"><button onClick={() => setApproveModalOpen(false)} className="w-full sm:w-auto px-4 py-2 border rounded">Cancel</button><button onClick={handleApprove} className="w-full sm:w-auto px-4 py-2 text-white bg-tabler-success rounded">Accept Request</button></div>
            </div>
          </div>
        </div>
      )}

      {returnModalOpen && returnTx && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="p-5">
              <div className="mb-4 pb-4 border-b border-gray-100 dark:border-tabler-border">
                 <h3 className="font-bold text-lg text-gray-900 dark:text-white">Process Transaction</h3>
                 <p className="text-xs text-gray-500 dark:text-tabler-muted mt-1">Txn ID: <span className="font-mono">{returnTx.transaction_id}</span></p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-tabler-muted mb-1.5 uppercase tracking-wide">Transaction Status</label>
                  <select value={returnAction} onChange={(e) => setReturnAction(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-tabler-border rounded text-sm outline-none dark:bg-tabler-body font-medium text-gray-700 dark:text-gray-200 focus:border-tabler-primary transition-colors">
                    <option value="Returned">Returned (Close Transaction)</option>
                    <option value="Borrowed">Keep Borrowed (Active)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-tabler-muted mb-1.5 uppercase tracking-wide">Physical Item Condition</label>
                  <select value={returnCondition} onChange={(e) => setReturnCondition(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-tabler-border rounded text-sm outline-none dark:bg-tabler-body font-medium text-gray-700 dark:text-gray-200 focus:border-tabler-primary transition-colors">
                    <option value="Available">Good / Available</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button onClick={() => setReturnModalOpen(false)} className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-tabler-border rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-tabler-border/50 transition-colors text-gray-700 dark:text-gray-300">Cancel</button>
                <button onClick={handleProcessReturn} className="w-full sm:w-auto px-4 py-2 text-white bg-tabler-primary hover:bg-[#1d5fb3] rounded text-sm font-bold transition-colors shadow-sm">Confirm Update</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isItemModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-tabler-body/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-tabler-border flex justify-between items-center bg-gray-50 dark:bg-tabler-body/50">
              <h3 className="font-semibold text-sm">{editingItem ? 'Edit Asset Data' : 'Provision New Asset'}</h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleItemSubmit}>
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Asset Name</label>
                  <input required type="text" value={itemForm.name} onChange={(e) => setItemForm({...itemForm, name: e.target.value})} className="w-full px-3 py-2 border rounded text-sm outline-none dark:bg-tabler-body dark:border-tabler-border" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">System Code</label>
                  <input required type="text" value={itemForm.inventory_code} onChange={(e) => setItemForm({...itemForm, inventory_code: e.target.value})} className="w-full px-3 py-2 border rounded text-sm uppercase outline-none font-mono dark:bg-tabler-body dark:border-tabler-border" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Category</label>
                  <select value={itemForm.category} onChange={(e) => setItemForm({...itemForm, category: e.target.value})} className="w-full px-3 py-2 border rounded text-sm outline-none dark:bg-tabler-body dark:border-tabler-border">
                    {genres.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                    {genres.length === 0 && <option value="Uncategorized">Uncategorized (Add via Categories Tab)</option>}
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
                <button type="submit" className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-tabler-primary rounded hover:bg-[#1d5fb3]">Save Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}