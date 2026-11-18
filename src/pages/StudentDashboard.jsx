import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PackageSearch, List, History, X, Search, Star, Bookmark, Calendar } from 'lucide-react';

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

export default function StudentDashboard() {
  const { inventory, genres, transactions, addTransaction, updateTransaction, user, showToast, requestConfirm } = useApp();
  const [activeTab, setActiveTab] = useState('available');
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [returnDate, setReturnDate] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [txSearchQuery, setTxSearchQuery] = useState(''); 
  const [activeCategory, setActiveCategory] = useState('All');

  const [booksPage, setBooksPage] = useState(1);
  const [activePage, setActivePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => { setBooksPage(1); setActivePage(1); setHistoryPage(1); }, [searchQuery, txSearchQuery, activeCategory, activeTab]);

  const categories = ['All', ...genres.map(g => g.name)];

  const topBooks = (() => {
    const borrowCounts = {};
    transactions.forEach(tx => {
      if (tx.status === 'Borrowed' || tx.status === 'Returned') {
        borrowCounts[tx.item_id] = (borrowCounts[tx.item_id] || 0) + 1;
      }
    });
    const sortedIds = Object.keys(borrowCounts).sort((a,b) => borrowCounts[b] - borrowCounts[a]);
    let top = sortedIds.map(id => inventory.find(i => i.id === id && i.status === 'Available')).filter(Boolean).slice(0, 8);
    if (top.length < 4) {
      const fill = inventory.filter(i => i.status === 'Available' && !top.includes(i));
      top = [...top, ...fill].slice(0, 8);
    }
    return top;
  })();

  const filteredItems = inventory.filter(item => {
    if (item.status !== 'Available') return false;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const myTransactions = transactions.filter(tx => tx.student_id === user?.id);
  
  const filterTx = (tx) => {
    if (!txSearchQuery) return true;
    const q = txSearchQuery.toLowerCase();
    const item = inventory.find(i => i.id === tx.item_id);
    const itemName = item?.name?.toLowerCase() || '';
    return tx.transaction_id.toLowerCase().includes(q) || itemName.includes(q) || tx.status.toLowerCase().includes(q);
  };

  const activeBorrowings = myTransactions.filter(tx => ['Pending', 'Borrowed'].includes(tx.status)).filter(filterTx);
  const borrowingHistory = myTransactions.filter(tx => ['Returned', 'Cancelled', 'Declined'].includes(tx.status)).filter(filterTx);

  const paginatedBooks = filteredItems.slice((booksPage - 1) * 8, booksPage * 8);
  const paginatedActive = activeBorrowings.slice((activePage - 1) * 8, activePage * 8);
  const paginatedHistory = borrowingHistory.slice((historyPage - 1) * 8, historyPage * 8);

  const handleCreateRequest = async () => {
    if (!termsAccepted) return;
    if (!returnDate) return showToast('You must select an expected return date.', 'warning');
    
    const checkItem = inventory.find(i => i.id === selectedItem.id);
    if (checkItem.status !== 'Available') {
      showToast('This asset is no longer available.', 'error');
      setSelectedItem(null);
      return;
    }

    const newTxId = `TXN-${Math.floor(Math.random() * 100000)}`;
    const todayStr = new Date().toISOString().split('T')[0];
    
    const newTx = { 
      transaction_id: newTxId, student_id: user.id, department: user.department || 'BSIT', 
      item_id: selectedItem.id, status: 'Pending', request_date: todayStr, expected_return_date: returnDate, processed_by: null 
    };
    
    try {
      await addTransaction(newTx);
      showToast('Borrow request submitted! Proceed to the SAO desk to claim.');
      setSelectedItem(null); setTermsAccepted(false); setReturnDate(''); setActiveTab('active');
    } catch (error) { showToast('Database error processing transaction.', 'error'); }
  };

  const handleCancelRequest = (txId) => {
    requestConfirm('Cancel Request', 'Are you sure you want to withdraw this borrow request?', async () => {
      try { await updateTransaction(txId, { status: 'Cancelled' }); showToast('Request cancelled.'); } 
      catch (error) { showToast('Error cancelling request.', 'error'); }
    });
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 font-sans bg-gray-50 dark:bg-tabler-body text-gray-900 dark:text-gray-100 min-h-screen">
      <style>{`@keyframes scrollCarousel { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-carousel { animation: scrollCarousel 40s linear infinite; }`}</style>
      
      <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-2xl overflow-hidden shadow-sm relative pt-6 sm:pt-8 pb-8 sm:pb-10">
        <div className="px-5 sm:px-8 flex items-center gap-2 mb-5 sm:mb-6">
          <Bookmark className="w-5 h-5 text-tabler-primary fill-current" />
          <h2 className="text-gray-900 dark:text-white text-lg sm:text-xl font-bold tracking-tight">Highly Requested Assets</h2>
        </div>
        <div className="flex overflow-hidden group">
          <div className="flex space-x-4 sm:space-x-6 px-4 animate-carousel group-hover:[animation-play-state:paused] w-max">
            {[...topBooks, ...topBooks, ...topBooks].map((book, idx) => (
              <div key={`${book.id}-${idx}`} onClick={() => setSelectedItem(book)} className="w-32 h-48 sm:w-36 sm:h-56 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer relative group/poster border border-gray-200 dark:border-tabler-border hover:border-tabler-primary/50 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                <img src={book.image} alt={book.name} className="w-full h-full object-cover transition-transform duration-500 group-hover/poster:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover/poster:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <div className="text-white text-xs font-bold leading-tight mb-1">{book.name}</div>
                  <div className="flex items-center gap-1 text-tabler-warning text-[10px] font-bold"><Star className="w-3 h-3 fill-current" /> {book.rating || 5.0}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm overflow-hidden flex flex-col">
        {/* Responsive 3-Column Mobile App Bar / Desktop Horizontal Tabs */}
        <div className="grid grid-cols-3 sm:flex border-b border-gray-200 dark:border-tabler-border bg-gray-50 dark:bg-tabler-body/50">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-3 sm:py-4 text-[11px] sm:text-sm font-medium border-b-2 transition-colors ${activeTab === 'available' ? 'border-tabler-primary text-tabler-primary bg-white dark:bg-tabler-card font-semibold' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <PackageSearch className="w-4 h-4" />
            <span className="sm:hidden">Discover</span>
            <span className="hidden sm:inline">Discover Assets</span>
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-3 sm:py-4 text-[11px] sm:text-sm font-medium border-b-2 transition-colors ${activeTab === 'active' ? 'border-tabler-primary text-tabler-primary bg-white dark:bg-tabler-card font-semibold' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <List className="w-4 h-4" />
            <span className="sm:hidden">Active</span>
            <span className="hidden sm:inline">Active Requests</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-3 sm:py-4 text-[11px] sm:text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-tabler-primary text-tabler-primary bg-white dark:bg-tabler-card font-semibold' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <History className="w-4 h-4" />
            <span className="sm:hidden">History</span>
            <span className="hidden sm:inline">Borrowing History</span>
          </button>
        </div>

        {activeTab === 'available' && (
          <div className="p-4 sm:p-6 flex flex-col flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex flex-nowrap overflow-x-auto scrollbar-hide w-full sm:w-auto gap-2 pb-1 sm:pb-0">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all border ${activeCategory === cat ? 'bg-tabler-primary border-tabler-primary text-white shadow-sm' : 'bg-white dark:bg-tabler-body border-gray-200 dark:border-tabler-border text-gray-600 dark:text-gray-300 hover:border-gray-300 hover:text-gray-900 dark:hover:text-white'}`}>{cat}</button>
                ))}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-tabler-muted" />
                <input type="text" placeholder="Search available assets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 sm:py-1.5 bg-white dark:bg-tabler-body border border-gray-200 dark:border-tabler-border rounded-lg text-sm outline-none focus:border-tabler-primary" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
              {paginatedBooks.map(item => (
                <div key={item.id} className="bg-white dark:bg-tabler-body border border-gray-200 dark:border-tabler-border rounded-xl shadow-sm hover:shadow-md flex flex-col group overflow-hidden hover:-translate-y-1 hover:border-tabler-primary/50 transition-all duration-300 cursor-pointer" onClick={() => setSelectedItem(item)}>
                  <div className="h-48 relative overflow-hidden bg-gray-100 dark:bg-tabler-card">
                    <img src={item.image || 'https://via.placeholder.com/150'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={item.name} />
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <div className="px-2.5 py-1 bg-white/95 dark:bg-tabler-card/90 backdrop-blur rounded text-[10px] font-black text-tabler-success uppercase tracking-wider shadow-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-tabler-success animate-pulse"></span> Available</div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5 flex-1 flex flex-col">
                    <div className="text-[10px] text-tabler-primary uppercase tracking-widest font-bold bg-tabler-primary/10 w-max px-2 py-0.5 rounded mb-2">{item.category}</div>
                    <div className="text-base font-bold leading-tight">{item.name}</div>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && <div className="col-span-full text-center py-10 text-gray-500">No matching assets found.</div>}
            </div>
            <Pagination page={booksPage} setPage={setBooksPage} total={filteredItems.length} perPage={8} />
          </div>
        )}

        {(activeTab === 'active' || activeTab === 'history') && (
          <div className="flex flex-col flex-1">
            <div className="p-4 border-b border-gray-200 dark:border-tabler-border bg-gray-50 dark:bg-tabler-body/30">
              <div className="relative w-full sm:max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-tabler-muted" />
                <input type="text" placeholder="Search by Asset Name or Txn ID..." value={txSearchQuery} onChange={(e) => setTxSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 sm:py-1.5 bg-white dark:bg-tabler-body border border-gray-200 dark:border-tabler-border rounded text-sm outline-none focus:border-tabler-primary" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-tabler-body/50 border-b border-gray-200 dark:border-tabler-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Asset Information</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Txn ID</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Date Tracker</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Status</th>
                    {activeTab === 'active' && <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-tabler-border">
                  {(activeTab === 'active' ? paginatedActive : paginatedHistory).map(tx => {
                    const item = inventory.find(i => i.id === tx.item_id);
                    return (
                      <tr key={tx.transaction_id} className="hover:bg-gray-50 dark:hover:bg-tabler-border/30 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-4">
                          <img src={item?.image || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded object-cover border border-gray-200 shadow-sm" />
                          <div>
                            <div className="font-medium text-base">{item?.name || 'Unknown Asset'}</div>
                            <div className="text-gray-500 text-[10px] uppercase tracking-wider mt-0.5">{item?.category} • {item?.inventory_code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{tx.transaction_id}</td>
                        <td className="px-6 py-4">
                          <div className="text-gray-600 dark:text-gray-300">{tx.request_date}</div>
                          {tx.expected_return_date && <div className="text-[10px] text-tabler-primary font-bold mt-1">DUE: {tx.expected_return_date}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            tx.status === 'Pending' ? 'bg-tabler-warning/10 text-tabler-warning border-tabler-warning/20' : 
                            tx.status === 'Borrowed' ? 'bg-tabler-primary/10 text-tabler-primary border-tabler-primary/20' : 
                            tx.status === 'Returned' ? 'bg-tabler-success/10 text-tabler-success border-tabler-success/20' : 
                            tx.status === 'Declined' ? 'bg-red-100 text-red-700 dark:bg-tabler-danger/20 dark:text-tabler-danger border-red-200 dark:border-tabler-danger/30' : 
                            'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-700'
                          }`}>{tx.status}</span>
                        </td>
                        {activeTab === 'active' && (
                          <td className="px-6 py-4 text-right">
                            {tx.status === 'Pending' && <button onClick={() => handleCancelRequest(tx.transaction_id)} className="px-4 py-2 border border-red-200 dark:border-tabler-danger/30 rounded text-xs font-medium text-red-600 dark:text-tabler-danger hover:bg-red-50 dark:hover:bg-tabler-danger hover:text-red-700 dark:hover:text-white transition-colors shadow-sm">Cancel Request</button>}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {(activeTab === 'active' ? activeBorrowings : borrowingHistory).length === 0 && <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-tabler-muted">No records match search.</td></tr>}
                </tbody>
              </table>
            </div>
            {activeTab === 'active' 
              ? <Pagination page={activePage} setPage={setActivePage} total={activeBorrowings.length} perPage={8} />
              : <Pagination page={historyPage} setPage={setHistoryPage} total={borrowingHistory.length} perPage={8} />
            }
          </div>
        )}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-gray-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex flex-col md:flex-row w-full max-w-4xl bg-white dark:bg-tabler-card rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-tabler-border">
            <div className="md:w-2/5 relative h-48 sm:h-64 md:h-auto bg-gray-100 dark:bg-[#182433]">
              <img src={selectedItem.image || 'https://via.placeholder.com/150'} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur text-white px-2 py-1 rounded text-xs font-mono">{selectedItem.inventory_code}</div>
            </div>
            <div className="md:w-3/5 p-4 sm:p-6 md:p-8 flex flex-col max-h-[60vh] md:max-h-none overflow-y-auto">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-1 text-tabler-warning text-sm font-bold mb-1"><Star className="w-4 h-4 fill-current" /> {selectedItem.rating || 5.0} <span className="text-gray-500 font-normal text-xs ml-1">({selectedItem.reviews || 0} Reviews)</span></div>
                  <h3 className="font-bold text-xl sm:text-2xl md:text-3xl leading-tight text-gray-900 dark:text-white">{selectedItem.name}</h3>
                </div>
                <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-tabler-body rounded-full p-1.5 transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex flex-wrap gap-2 mt-2 mb-6">
                <span className="px-2.5 py-1 bg-tabler-primary/10 text-tabler-primary text-[10px] font-bold rounded uppercase tracking-wider border border-tabler-primary/20">{selectedItem.category}</span>
              </div>

              <div className="bg-gray-50 dark:bg-tabler-body p-4 rounded-lg border border-gray-200 dark:border-tabler-border mb-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Custodian's Note</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">"{selectedItem.description || 'No additional details provided.'}"</p>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Expected Return Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input type="date" required min={minDate} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded text-sm outline-none dark:bg-tabler-body dark:border-tabler-border" />
                </div>
              </div>
              
              <label className="flex items-start gap-3 cursor-pointer group p-4 border border-gray-200 dark:border-tabler-border rounded-lg bg-gray-50 dark:bg-tabler-body/50 transition-colors mb-5 mt-auto">
                <input type="checkbox" className="mt-0.5 rounded border-gray-300 w-4 h-4 cursor-pointer text-tabler-primary" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                <span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed block">
                  I accept full responsibility for this asset. <strong className="text-tabler-warning">Note:</strong> Requesting this item does not reserve it physically. Assets are distributed on a first-come, first-served basis at the SAO desk.
                </span>
              </label>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-tabler-border">
                <button onClick={() => setSelectedItem(null)} className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-tabler-card border rounded hover:bg-gray-50 dark:hover:bg-tabler-border/50">Cancel</button>
                <button onClick={handleCreateRequest} disabled={!termsAccepted} className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-white bg-tabler-primary rounded hover:bg-[#1d5fb3] disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2"><Bookmark className="w-4 h-4" /> Borrow Request</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}