import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Package, ShieldCheck, RefreshCcw, Users, Edit, Trash2, Database, Search, X, LayoutDashboard, ShieldAlert, Tags } from 'lucide-react';

const Pagination = ({ page, setPage, total, perPage = 8 }) => {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-between items-center px-6 py-4 bg-gray-50 dark:bg-tabler-body/50 border-t border-gray-200 dark:border-tabler-border mt-auto">
      <span className="text-xs text-gray-500 dark:text-tabler-muted font-medium">Showing {(page-1)*perPage + 1} to {Math.min(page*perPage, total)} of {total}</span>
      <div className="flex gap-2">
        <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 dark:border-tabler-border rounded text-xs font-bold disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-tabler-body transition-colors">Prev</button>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 border border-gray-200 dark:border-tabler-border rounded text-xs font-bold disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-tabler-body transition-colors">Next</button>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { user, inventory = [], usersList = [], transactions = [], genres = [], addInventoryItem, updateInventoryItem, deleteInventoryItem, updateUserRole, updateUserPermissions, addGenre, deleteGenre, requestConfirm } = useApp();
  
  const [activeTab, setActiveTab] = useState('overview'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [txSearchQuery, setTxSearchQuery] = useState('');
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', inventory_code: '', category: 'Computer Science', status: 'Available', image: '', description: '' });
  const [newGenre, setNewGenre] = useState('');

  const [invPage, setInvPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [txPage, setTxPage] = useState(1);

  const validInventory = inventory.filter(item => item !== null && item !== undefined);
  const validUsers = usersList.filter(u => u !== null && u !== undefined);

  const stats = {
    total: validInventory.length,
    available: validInventory.filter(i => i.status === 'Available').length,
    borrowed: validInventory.filter(i => i.status === 'Borrowed').length,
    users: validUsers.length
  };

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
    const itemName = item?.name?.toLowerCase() || '';
    return tx.transaction_id.toLowerCase().includes(q) || tx.student_id.toLowerCase().includes(q) || itemName.includes(q);
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

  const handleGenreSubmit = (e) => {
    e.preventDefault();
    if(newGenre.trim()){ 
      // CONFIRMATION WRAPPER
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

      <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm flex overflow-x-auto">
        <button onClick={() => {setActiveTab('overview'); setTxPage(1);}} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-tabler-primary text-tabler-primary bg-gray-50 dark:bg-tabler-body/50' : 'border-transparent text-gray-500 dark:text-tabler-muted hover:text-gray-900 dark:hover:text-white'}`}><LayoutDashboard className="w-4 h-4" /> Analytics Dashboard</button>
        <button onClick={() => {setActiveTab('inventory'); setInvPage(1);}} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'inventory' ? 'border-tabler-primary text-tabler-primary bg-gray-50 dark:bg-tabler-body/50' : 'border-transparent text-gray-500 dark:text-tabler-muted hover:text-gray-900 dark:hover:text-white'}`}><Database className="w-4 h-4" /> Book Database</button>
        <button onClick={() => {setActiveTab('users'); setUserPage(1);}} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users' ? 'border-tabler-primary text-tabler-primary bg-gray-50 dark:bg-tabler-body/50' : 'border-transparent text-gray-500 dark:text-tabler-muted hover:text-gray-900 dark:hover:text-white'}`}><Users className="w-4 h-4" /> User Management</button>
        <button onClick={() => setActiveTab('genres')} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'genres' ? 'border-tabler-primary text-tabler-primary bg-gray-50 dark:bg-tabler-body/50' : 'border-transparent text-gray-500 dark:text-tabler-muted hover:text-gray-900 dark:hover:text-white'}`}><Tags className="w-4 h-4" /> Genres</button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'stat-books', label: 'Total Books', val: stats.total, color: 'text-tabler-success', icon: Package, fill: 'bg-tabler-primary' },
              { id: 'stat-avail', label: 'Available', val: stats.available, color: 'text-tabler-success', icon: ShieldCheck, fill: 'bg-tabler-success' },
              { id: 'stat-borrowed', label: 'Borrowed', val: stats.borrowed, color: 'text-tabler-warning', icon: RefreshCcw, fill: 'bg-tabler-warning' },
              { id: 'stat-users', label: 'System Users', val: stats.users, color: 'text-tabler-success', icon: Users, fill: 'bg-purple-500' }
            ].map((stat) => (
              <div key={stat.id} className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg p-5 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-md text-white shadow-sm ${stat.fill}`}><stat.icon className="w-5 h-5" /></div>
                    <div><div className="text-[10px] font-bold text-gray-500 dark:text-tabler-muted uppercase tracking-wider mb-0.5">{stat.label}</div><div className="text-2xl font-bold leading-none">{stat.val}</div></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-tabler-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-tabler-body/30">
              <h3 className="font-semibold text-sm">System Activity Log</h3>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-tabler-muted" />
                <input type="text" placeholder="Search logs (Txn ID, Book, User)..." value={txSearchQuery} onChange={(e) => {setTxSearchQuery(e.target.value); setTxPage(1);}} className="w-72 pl-9 pr-3 py-1.5 bg-white dark:bg-tabler-body border border-gray-300 dark:border-tabler-border rounded text-sm outline-none focus:border-tabler-primary transition-colors" />
              </div>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-tabler-body/50 text-[10px] text-gray-500 dark:text-tabler-muted uppercase tracking-wider border-b dark:border-tabler-border">
                  <tr><th className="px-5 py-3 font-medium">User ID</th><th className="px-5 py-3 font-medium">Action Event</th><th className="px-5 py-3 font-medium text-right">Date</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-tabler-border">
                  {paginatedTxs.map(tx => {
                    const item = inventory.find(i => i?.id === tx.item_id);
                    return (
                      <tr key={tx.transaction_id} className="hover:bg-gray-50 dark:hover:bg-tabler-border/30 transition-colors">
                        <td className="px-5 py-3 flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-tabler-primary/10 text-tabler-primary flex items-center justify-center text-[10px] font-bold">{tx.student_id ? tx.student_id.substring(0,2).toUpperCase() : 'U'}</div>
                          <span className="font-mono font-medium">{tx.student_id}</span>
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
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm flex flex-col overflow-hidden animate-in fade-in">
          <div className="p-4 border-b border-gray-200 dark:border-tabler-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-tabler-body/30">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Database className="w-5 h-5 text-gray-400 dark:text-tabler-muted" />
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-tabler-muted" />
                <input type="text" placeholder="Search database..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setInvPage(1); }} className="w-64 pl-9 pr-3 py-1.5 bg-white dark:bg-tabler-body border border-gray-300 dark:border-tabler-border rounded text-sm outline-none focus:border-tabler-primary" />
              </div>
            </div>
            <button onClick={() => { setEditingItem(null); setItemForm({name:'', inventory_code:'', category:(genres[0]?.name || 'Uncategorized'), status:'Available', image: '', description: ''}); setIsItemModalOpen(true); }} className="px-4 py-1.5 bg-tabler-primary text-white rounded text-sm font-medium hover:bg-[#1d5fb3] flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add Book</button>
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

      {activeTab === 'users' && (
        <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 border-b border-gray-200 dark:border-tabler-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-tabler-body/30">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Users className="w-5 h-5 text-gray-400 dark:text-tabler-muted" />
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-tabler-muted" />
                <input type="text" placeholder="Search users by name or email..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setUserPage(1); }} className="w-72 pl-9 pr-3 py-1.5 bg-white dark:bg-tabler-body border border-gray-300 dark:border-tabler-border rounded text-sm outline-none focus:border-tabler-primary" />
              </div>
            </div>
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

      {activeTab === 'genres' && (
        <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-sm overflow-hidden animate-in fade-in duration-300 max-w-2xl">
          <div className="p-5 border-b border-gray-200 dark:border-tabler-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-tabler-body/30">
            <div>
               <h3 className="font-semibold text-sm">Book Categories (Genres)</h3>
               <p className="text-xs text-gray-500 dark:text-tabler-muted mt-1">Add or remove genres used in the inventory and discover tabs.</p>
            </div>
            <form onSubmit={handleGenreSubmit} className="flex items-center gap-2 w-full sm:w-auto">
              <input type="text" placeholder="New Genre Name..." required value={newGenre} onChange={(e) => setNewGenre(e.target.value)} className="flex-1 px-3 py-1.5 bg-white dark:bg-tabler-body border border-gray-300 dark:border-tabler-border rounded text-sm outline-none focus:border-tabler-primary" />
              <button type="submit" className="px-4 py-1.5 bg-tabler-primary text-white rounded text-sm font-medium hover:bg-[#1d5fb3] shadow-sm whitespace-nowrap">Add Genre</button>
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

      {isItemModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-tabler-body/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-tabler-border flex justify-between items-center bg-gray-50 dark:bg-tabler-body/50">
              <h3 className="font-semibold text-sm">{editingItem ? 'Edit Book Data' : 'Provision New Book'}</h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleItemSubmit}>
              <div className="p-5 space-y-4">
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
              <div className="px-5 py-4 bg-gray-50 border-t flex justify-end gap-3 dark:bg-tabler-body/50 dark:border-tabler-border">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 text-sm font-medium border rounded hover:bg-gray-100 dark:hover:bg-tabler-border">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-tabler-primary rounded hover:bg-[#1d5fb3]">Save Book</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}