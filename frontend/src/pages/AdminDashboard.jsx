// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, Loader2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
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

  const handleDeleteUser = async (targetUserId, businessName) => {
    // You can even make the confirm dialog a beautiful toast!
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span className="font-bold text-gray-800">Delete "{businessName}"?</span>
        <span className="text-sm text-gray-500">This cannot be undone.</span>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              executeDelete(targetUserId); // Your actual fetch delete logic
            }} 
            className="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm"
          >
            Yes, Delete
          </button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-gray-200 px-3 py-1 rounded font-bold text-sm">Cancel</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-[80vh]"><Loader2 className="animate-spin text-primaryBlue w-12 h-12" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <ShieldAlert className="text-red-500 w-16 h-16" />
        <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto px-2 sm:px-0">
      <div className="flex items-center gap-3">
        <ShieldAlert className="text-red-500" size={32} />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Control Panel</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <Users className="text-primaryBlue" size={20} />
          <h2 className="text-lg font-bold text-gray-800">Registered Businesses</h2>
          <span className="ml-auto bg-blue-50 text-blue-600 py-1 px-3 rounded-full text-sm font-bold">
            Total: {users.length}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="py-4 px-6 text-sm font-semibold text-gray-500">Business Name</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-500">Owner</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-500">Email</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-500">Joined</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-gray-800">{u.business_name}</div>
                    <div className="text-xs text-gray-500">@{u.username}</div>
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-700">
                    {u.full_name}
                    {u.role === 'admin' && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded border border-red-200">Admin</span>}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">{u.email}</td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {u.id !== currentUser.id ? (
                      <button 
                        onClick={() => handleDeleteUser(u.id, u.business_name)} 
                        className="p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors flex items-center justify-end gap-1 ml-auto"
                        title="Delete User"
                      >
                        <Trash2 size={18} /> <span className="text-xs font-bold sm:hidden">Delete</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-gray-400 italic">You</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}