import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Check, ArrowRightLeft, X, Activity, ClipboardCheck, ArrowUpRight, Ban, History, Database, Search, Plus, Edit, Trash2, Tags } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('console'); 
  
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTx, setApproveTx] = useState(null);

  // UPGRADE: Two explicit states for processing returns
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
  
  // Hover State for new Synced Charts
  const [syncedHover, setSyncedHover] = useState(null);

  const canRead = user?.permissions?.read;
  const canCreate = user?.permissions?.create;
  const canUpdate = user?.permissions?.update;
  const canDelete = user?.permissions?.delete;

  // Global Search logic (Matches Txn ID, Student ID, Item Name, or Student Name)
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

  // UPGRADE: Precise 30-Day Data Generator for SAO Synced Charts
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
        requests: dayTxs.length,
        borrowed: dayTxs.filter(tx => tx.status === 'Borrowed').length,
        returned: dayTxs.filter(tx => ['Returned', 'Declined', 'Cancelled'].includes(tx.status)).length,
      });
    }
    return days;
  }, [transactions]);

  // Monotone Cubic Bezier Builder
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
  const maxReturned = Math.max(...last30Days.map(d => d.returned), 5);

  const requestsPath = buildSmoothPath(last30Days.map(d => d.requests), maxRequests);
  const borrowedPath = buildSmoothPath(last30Days.map(d => d.borrowed), maxRequests);

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
      requestConfirm('Add Genre', `Are you sure you want to add "${newGenre.trim()}" as a new category?`, async () => {
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
    setReturnAction('Returned'); // Default action
    setReturnCondition('Available'); // Default physical condition
    setReturnModalOpen(true); 
  };
  
  // UPGRADE: Processes both the Transaction state AND the Item physical state
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
          <p className="text-sm text-gray-500 dark:text-tabler-muted mt-1">Review requests, decline unauthorized borrowings, and process returns.</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-tabler-card border rounded-lg shadow-sm flex overflow-x-auto scrollbar-hide border-gray-200 dark:border-tabler-border">
        <button onClick={() => setActiveTab('console')} className={`whitespace-nowrap flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'console' ? 'border-tabler-primary text-tabler-primary bg-gray-50 dark:bg-tabler-body/50' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}><Activity className="w-4 h-4" /> Traffic Console</button>
        <button onClick={() => {setActiveTab('approvals'); setAppPage(1); setTxSearchQuery('');}} className={`whitespace-nowrap flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'approvals' ? 'border-tabler-primary text-tabler-primary bg-gray-50 dark:bg-tabler-body/50' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}><ClipboardCheck className="w-4 h-4" /> Approvals <span className="bg-tabler-warning/10 text-tabler-warning px-1.5 rounded-full text-[10px] ml-1">{pendingRequests.length}</span></button>
        <button onClick={() => {setActiveTab('returns'); setRetPage(1); setTxSearchQuery('');}} className={`whitespace-nowrap flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'returns' ? 'border-tabler-primary text-tabler-primary bg-gray-50 dark:bg-tabler-body/50' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}><ArrowUpRight className="w-4 h-4" /> Active Borrowings</button>
        <button onClick={() => {setActiveTab('history'); setHistPage(1); setTxSearchQuery('');}} className={`whitespace-nowrap flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-tabler-primary text-tabler-primary bg-gray-50 dark:bg-tabler-body/50' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}><History className="w-4 h-4" /> SAO History</button>
        {canRead && <button onClick={() => {setActiveTab('inventory'); setInvPage(1);}} className={`whitespace-nowrap flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'inventory' ? 'border-tabler-primary text-tabler-primary bg-gray-50 dark:bg-tabler-body/50' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}><Database className="w-4 h-4" /> Book Inventory</button>}
        {canUpdate && <button onClick={() => setActiveTab('genres')} className={`whitespace-nowrap flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'genres' ? 'border-tabler-primary text-tabler-primary bg-gray-50 dark:bg-tabler-body/50' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}><Tags className="w-4 h-4" /> Genres</button>}
      </div>

      {['approvals', 'returns', 'history'].includes(activeTab) && (
        <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg p-4 shadow-sm">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-tabler-muted" />
            <input type="text" placeholder="Search by Student Name, ID, or Book..." value={txSearchQuery} onChange={(e) => {setTxSearchQuery(e.target.value); setAppPage(1); setRetPage(1); setHistPage(1);}} className="w-full pl-9 pr-3 py-2 sm:py-1.5 bg-white dark:bg-tabler-body border border-gray-300 dark:border-tabler-border rounded text-sm outline-none focus:border-tabler-primary transition-colors" />
          </div>
        </div>
      )}

      {/* UPGRADE: SAO Detailed Synced Operations Charts */}
      {activeTab === 'console' && (
        <div className="bg-white border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm p-6 flex flex-col min-h-[400px] dark:bg-tabler-card relative">
          <div className="flex justify-between items-center mb-6 relative z-30">
            <h3 className="font-semibold text-sm">Synced Operations Hub</h3>
            <div className="text-xs text-gray-500 dark:text-tabler-muted font-medium bg-gray-50 dark:bg-tabler-body/50 px-3 py-1 rounded">
              Hover to synchronize views
            </div>
          </div>

          <div className="relative w-full flex flex-col gap-2">
            
            {/* GLOBAL HOVER OVERLAY */}
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

            {/* CHART 1: Requests & Borrowed (Dual Spline) */}
            <div className="relative h-40 w-full border-b border-gray-100 dark:border-tabler-border/50 pb-2 mb-4">
              <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                <defs>
                  <linearGradient id="gradReqSao" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#206bc4" stopOpacity="0.2"/><stop offset="100%" stopColor="#206bc4" stopOpacity="0"/></linearGradient>
                </defs>
                <path d={`${requestsPath} L1000,100 L0,100 Z`} fill="url(#gradReqSao)" className="transition-all duration-300" />
                
                {/* Total Requests Line */}
                <path d={requestsPath} fill="none" stroke="#206bc4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Approved Borrowed Line */}
                <path d={borrowedPath} fill="none" stroke="#2fb344" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,4" />
                
                {syncedHover && (
                  <>
                    <circle cx={(syncedHover.index / 29) * 1000} cy={95 - (syncedHover.requests / Math.max(maxRequests, 1)) * 85} r="4" fill="#206bc4" stroke="#fff" strokeWidth="2" />
                    <circle cx={(syncedHover.index / 29) * 1000} cy={95 - (syncedHover.borrowed / Math.max(maxRequests, 1)) * 85} r="4" fill="#2fb344" stroke="#fff" strokeWidth="2" />
                  </>
                )}
              </svg>
              
              {syncedHover && (
                <div className="absolute top-1 z-50 pointer-events-none transform -translate-x-1/2 bg-[#182433] text-white p-2 rounded shadow-lg flex flex-col min-w-[130px] transition-all duration-75" style={{ left: `calc(${(syncedHover.index / 29) * 100}%)` }}>
                  <span className="text-[10px] font-bold border-b border-gray-700 pb-1 mb-1 text-center text-gray-400 uppercase tracking-wider">{syncedHover.displayDate}</span>
                  <span className="text-xs flex justify-between items-center"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#206bc4]"></div> Total Requests</div> <span>{syncedHover.requests}</span></span>
                  <span className="text-xs flex justify-between items-center"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#2fb344]"></div> Active Borrowed</div> <span>{syncedHover.borrowed}</span></span>
                </div>
              )}
            </div>

            {/* CHART 2: Resolved / Returned (Bar) */}
            <div className="relative h-28 w-full border-b border-gray-100 dark:border-tabler-border/50 pb-2">
              <div className="absolute inset-0 flex items-end justify-between px-1">
                {last30Days.map((day, i) => (
                  <div key={`bar-${i}`} className="w-full flex justify-center h-full items-end">
                     <div 
                       className={`w-3/4 max-w-[14px] rounded-t-sm transition-all duration-300 ${syncedHover?.index === i ? 'bg-[#3da9fc]' : 'bg-[#3da9fc]/70 dark:bg-[#3da9fc]/40'}`}
                       style={{ height: `${(day.returned / Math.max(maxReturned, 1)) * 90}%` }}
                     ></div>
                  </div>
                ))}
              </div>

              {syncedHover && (
                <div className="absolute top-1 z-50 pointer-events-none transform -translate-x-1/2 bg-[#182433] text-white p-2 rounded shadow-lg flex flex-col min-w-[130px] transition-all duration-75" style={{ left: `calc(${(syncedHover.index / 29) * 100}%)` }}>
                  <span className="text-[10px] font-bold border-b border-gray-700 pb-1 mb-1 text-center text-gray-400 uppercase tracking-wider">{syncedHover.displayDate}</span>
                  <span className="text-xs flex justify-between items-center"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#3da9fc]"></div> Resolved / Ret</div> <span>{syncedHover.returned}</span></span>
                </div>
              )}
            </div>

            {/* X-Axis Date Row */}
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
      )}

      {activeTab === 'approvals' && (
        <div className="bg-white border rounded-lg shadow-sm flex flex-col min-h-[400px] dark:bg-tabler-card dark:border-tabler-border">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b bg-gray-50 dark:bg-tabler-body/50 dark:border-tabler-border">
                <tr><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Book Subject</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Student Identity</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase text-right">Action</th></tr>
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
                <tr><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Book Subject</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Student Identity</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase text-right">Action</th></tr>
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
                {paginatedActive.length === 0 && <tr><td colSpan="3" className="px-5 py-8 text-center text-gray-500">No active books in the field match search.</td></tr>}
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
                <tr><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Book Subject</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Student Details</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Date</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Status</th></tr>
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
                <Plus className="w-4 h-4" /> Add Book
              </button>
            )}
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-tabler-body/50 border-b border-gray-200 dark:border-tabler-border">
                <tr><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Book Subject</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Category</th><th className="px-5 py-3 text-gray-500 text-[10px] uppercase">Status</th><th className="px-5 py-3 text-right"></th></tr>
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
                          {canDelete && <button onClick={() => requestConfirm('Delete Book', `Permanently delete "${item.name}" from the system?`, () => deleteInventoryItem(item.id))} className="px-3 py-1.5 hover:text-tabler-danger"><Trash2 className="w-3.5 h-3.5"/></button>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {paginatedInventory.length === 0 && <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-500">No books match search.</td></tr>}
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

      {/* UPGRADE: Detailed Process Return Modal */}
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

      {/* Book Form Modal */}
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
    </div>
  );
}