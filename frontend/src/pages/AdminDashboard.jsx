// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, Loader2, Users, Search, Shield, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // NEW: Search state
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.status === 'success') {
        setUsers(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // NEW: The actual delete function that talks to your backend!
  const executeDelete = async (targetUserId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${targetUserId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        toast.success("Business and all associated data deleted.");
        fetchUsers(); // Refresh the list
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error("Failed to delete user.");
    }
  };

  const handleDeleteUser = (targetUserId, businessName) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span className="font-bold text-gray-800 dark:text-white">Delete "{businessName}"?</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">This will erase all their inventory and sales. This cannot be undone.</span>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              executeDelete(targetUserId); 
            }} 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
          >
            Yes, Delete
          </button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
            Cancel
          </button>
        </div>
      </div>
    ), { 
      duration: Infinity,
      style: { background: currentUser.theme === 'dark' ? '#1F2937' : '#fff', color: currentUser.theme === 'dark' ? '#fff' : '#000' }
    });
  };

  // NEW: Filter users based on search
  const filteredUsers = users.filter(u => 
    u.business_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // NEW: Calculate Metrics
  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const totalRegularUsers = users.length - totalAdmins;

  if (isLoading) {
    return <div className="flex items-center justify-center h-[80vh]"><Loader2 className="animate-spin text-primaryBlue w-12 h-12" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <ShieldAlert className="text-red-500 w-16 h-16" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto px-2 sm:px-0 pb-10">
      
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <ShieldAlert className="text-red-500" size={32} />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white transition-colors">Admin Control Panel</h1>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-colors">
          <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl text-primaryBlue"><Users size={28} /></div>
          <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Registered Users</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-colors">
          <div className="bg-purple-50 dark:bg-purple-500/10 p-4 rounded-xl text-purple-600 dark:text-purple-400"><Building2 size={28} /></div>
          <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Active Businesses</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalRegularUsers}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-colors">
          <div className="bg-red-50 dark:bg-red-500/10 p-4 rounded-xl text-red-500"><Shield size={28} /></div>
          <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">System Admins</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalAdmins}</h3>
          </div>
        </div>
      </div>

      {/* USERS TABLE SECTION */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        
        {/* Table Header & Search */}
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-2">
            <Users className="text-primaryBlue" size={20} />
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Registered Businesses</h2>
          </div>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email, or username..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl outline-primaryBlue bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white transition-colors text-sm"
            />
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 transition-colors">
              <tr>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Business Name</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owner</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500 dark:text-gray-400">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-800 dark:text-gray-200">{u.business_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">@{u.username}</div>
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-700 dark:text-gray-300">
                      {u.full_name}
                      {u.role === 'admin' && <span className="ml-2 text-[10px] uppercase font-bold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded border border-red-200 dark:border-red-500/30 tracking-wider">Admin</span>}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">{u.email}</td>
                    <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {u.id !== currentUser.id ? (
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.business_name)} 
                          className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-end gap-1 ml-auto"
                          title="Delete User"
                        >
                          <Trash2 size={18} /> <span className="text-xs font-bold sm:hidden">Delete</span>
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 italic pr-2">You</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}