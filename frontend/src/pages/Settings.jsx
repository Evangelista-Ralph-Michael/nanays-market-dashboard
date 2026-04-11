// src/pages/Settings.jsx
import { useState } from 'react';
import { User, Lock, Loader2 } from 'lucide-react';

export default function Settings() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  
  // State for Account Update Form
  const [accountData, setAccountData] = useState({
    full_name: user.full_name || '',
    username: user.username || '',
    business_name: user.business_name || ''
  });
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState({ type: '', text: '' });

  // State for Password Change Form
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    setIsUpdatingAccount(true);
    setAccountMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/update-account`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(accountData),
      });
      const result = await response.json();

      if (result.status === 'success') {
        setAccountMessage({ type: 'success', text: 'Account updated successfully!' });
        // Update local storage so the header changes instantly!
        const updatedUser = { ...user, ...accountData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event('storage')); // Force header to re-render
      } else {
        setAccountMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setAccountMessage({ type: 'error', text: 'Failed to connect to server.' });
    } finally {
      setIsUpdatingAccount(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(passwordData),
      });
      const result = await response.json();

      if (result.status === 'success') {
        setPasswordMessage({ type: 'success', text: result.message });
        setPasswordData({ current_password: '', new_password: '', confirm_new_password: '' }); // Clear form
      } else {
        setPasswordMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Failed to connect to server.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Update Section */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <User className="text-primaryBlue" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Profile Information</h2>
          </div>
          
          <form onSubmit={handleAccountUpdate} className="space-y-4">
            {accountMessage.text && (
              <div className={`p-3 rounded-lg text-sm font-medium ${accountMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {accountMessage.text}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Full Name</label>
              <input required value={accountData.full_name} onChange={(e) => setAccountData({...accountData, full_name: e.target.value})} className="w-full p-3 border rounded-xl outline-primaryBlue bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Username</label>
              <input required value={accountData.username} onChange={(e) => setAccountData({...accountData, username: e.target.value})} className="w-full p-3 border rounded-xl outline-primaryBlue bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Business Name</label>
              <input required value={accountData.business_name} onChange={(e) => setAccountData({...accountData, business_name: e.target.value})} className="w-full p-3 border rounded-xl outline-primaryBlue bg-gray-50" />
            </div>
            
            <button type="submit" disabled={isUpdatingAccount} className="w-full mt-4 bg-primaryBlue text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:bg-gray-400 flex justify-center items-center gap-2">
              {isUpdatingAccount ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Password Change Section */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <Lock className="text-orange-500" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
          </div>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordMessage.text && (
              <div className={`p-3 rounded-lg text-sm font-medium ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {passwordMessage.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Current Password</label>
              <input type="password" required value={passwordData.current_password} onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})} className="w-full p-3 border rounded-xl outline-orange-500 bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">New Password</label>
              <input type="password" required value={passwordData.new_password} onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})} className="w-full p-3 border rounded-xl outline-orange-500 bg-gray-50" placeholder="Min 8 chars, 1 Upper, 1 Lower, 1 Num" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Confirm New Password</label>
              <input type="password" required value={passwordData.confirm_new_password} onChange={(e) => setPasswordData({...passwordData, confirm_new_password: e.target.value})} className="w-full p-3 border rounded-xl outline-orange-500 bg-gray-50" />
            </div>
            
            <button type="submit" disabled={isUpdatingPassword} className="w-full mt-4 bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:bg-gray-400 flex justify-center items-center gap-2">
              {isUpdatingPassword ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}