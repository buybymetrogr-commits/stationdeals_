import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Shield, Mail, Calendar, Edit, Trash2, UserPlus, Search, Filter } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  role?: string;
  business_count?: number;
  offers_count?: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user to check if admin
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError('Πρέπει να συνδεθείτε για να δείτε τους χρήστες');
        return;
      }

      const currentUser = session.user;
      if (!currentUser) {
        setError('Πρέπει να συνδεθείτε για να δείτε τους χρήστες');
        return;
      }

      // Check if current user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .single();

      if (roleData?.role !== 'admin') {
        setError('Δεν έχετε δικαίωμα πρόσβασης στη διαχείριση χρηστών');
        return;
      }

      // Try to fetch users via Edge Function first, fallback to limited data if not available
      let authUsers: any = { users: [] };
      
      try {
        // Try using Edge Function for user management
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-users`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          authUsers = await response.json();
        } else {
          throw new Error('Edge function not available');
        }
      } catch (edgeFunctionError) {
        console.error('Edge function failed:', edgeFunctionError);
        throw new Error('Δεν είναι δυνατή η φόρτωση των χρηστών. Το Edge Function δεν είναι διαθέσιμο.');
      }

      // Get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Get business counts for each user
      const { data: businessCounts, error: businessError } = await supabase
        .from('businesses')
        .select('owner_id')
        .eq('active', true);

      if (businessError) throw businessError;

      // Get offers counts for each user
      const { data: offersCounts, error: offersError } = await supabase
        .from('offers')
        .select('business_id, businesses!inner(owner_id)')
        .eq('is_active', true);

      if (offersError) throw offersError;

      // Combine data
      const usersWithData = authUsers.users.map((user: any) => {
        const userRole = userRoles?.find((r: any) => r.user_id === user.id);
        const businessCount = businessCounts?.filter((b: any) => b.owner_id === user.id).length || 0;
        const offersCount = offersCounts?.filter((o: any) => o.businesses.owner_id === user.id).length || 0;

        return {
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          email_confirmed_at: user.email_confirmed_at,
          role: userRole?.role || 'business',
          business_count: businessCount,
          offers_count: offersCount
        };
      });

      setUsers(usersWithData);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'An unknown error occurred while fetching user data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setError(null);

      // Update or insert user role
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole
        });

      if (error) throw error;

      // Refresh users list
      await fetchUsers();
      setShowRoleModal(false);
      setSelectedUser(null);
      setNewRole('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον χρήστη; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.')) {
      return;
    }

    try {
      setError(null);

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Πρέπει να συνδεθείτε για να διαγράψετε χρήστες');
        return;
      }

      // Delete user via Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete user');
      }

      // Refresh users list
      await fetchUsers();
      
      // Show success message
      alert('Ο χρήστης διαγράφηκε με επιτυχία!');
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Ποτέ';
    return new Date(dateString).toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'business':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Διαχειριστής';
      case 'business':
        return 'Επιχείρηση';
      default:
        return 'Άγνωστος';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Διαχείριση Χρηστών</h2>
        <div className="text-sm text-gray-600">
          Σύνολο: {users.length} χρήστες
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Αναζήτηση email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none"
            >
              <option value="">Όλοι οι ρόλοι</option>
              <option value="admin">Διαχειριστές</option>
              <option value="business">Επιχειρήσεις</option>
            </select>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            Αποτελέσματα: {filteredUsers.length}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Χρήστης
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ρόλος
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Επιχειρήσεις
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Προσφορές
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Τελευταία σύνδεση
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Εγγραφή
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ενέργειες
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User size={20} className="text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">
                          {user.email_confirmed_at ? (
                            <span className="text-green-600">✓ Επιβεβαιωμένο</span>
                          ) : (
                            <span className="text-orange-600">⚠ Μη επιβεβαιωμένο</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRoleColor(user.role || 'business')}`}>
                      <Shield size={12} className="mr-1" />
                      {getRoleLabel(user.role || 'business')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.business_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.offers_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.last_sign_in_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRole(user.role || 'business');
                          setShowRoleModal(true);
                        }}
                        className="p-2 text-indigo-600 hover:bg-gray-100 rounded"
                        title="Αλλαγή ρόλου"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-red-600 hover:bg-gray-100 rounded"
                        title="Διαγραφή χρήστη"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Δεν βρέθηκαν χρήστες</p>
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Αλλαγή Ρόλου Χρήστη
              </h3>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Χρήστης: <span className="font-medium">{selectedUser.email}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Τρέχων ρόλος: <span className="font-medium">{getRoleLabel(selectedUser.role || 'business')}</span>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Νέος Ρόλος
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="business">Επιχείρηση</option>
                  <option value="admin">Διαχειριστής</option>
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Προσοχή:</strong> Η αλλαγή ρόλου θα επηρεάσει τα δικαιώματα πρόσβασης του χρήστη.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                  setNewRole('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Ακύρωση
              </button>
              <button
                onClick={() => handleRoleChange(selectedUser.id, newRole)}
                className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
                Αποθήκευση
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;