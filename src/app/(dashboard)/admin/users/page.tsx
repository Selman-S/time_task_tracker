'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import QuickUserForm from '@/components/forms/QuickUserForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UserWithRole extends User {
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'WORKER' | 'CLIENT';
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false); // Popup state
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null); // Selected user
  const router = useRouter();

  // Brand permission management states
  const [brands, setBrands] = useState<any[]>([]); // All brands
  const [brandPermissions, setBrandPermissions] = useState<any[]>([]); // Permissions for selected user
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedPermissionLevel, setSelectedPermissionLevel] = useState('READ');
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandError, setBrandError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      
      // Check if user has admin privileges
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }

      fetchUsers();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [router]);

  // Fetch all brands when dialog opens
  useEffect(() => {
    if (permissionDialogOpen) {
      fetchBrands();
      fetchAllBrandPermissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionDialogOpen]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (error) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all brands
  const fetchBrands = async () => {
    setBrandLoading(true);
    setBrandError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/brands?page=1&limit=1000', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBrands(data.data.brands);
      } else {
        setBrandError(data.error || 'Failed to fetch brands');
      }
    } catch (e) {
      setBrandError('Failed to fetch brands');
    } finally {
      setBrandLoading(false);
    }
  };

  // Fetch all brand permissions for all brands, filter for selected user
  const fetchAllBrandPermissions = async () => {
    if (!selectedUser) return;
    setBrandPermissions([]);
    const token = localStorage.getItem('token');
    try {
      const perms: any[] = [];
      for (const brand of brands) {
        const res = await fetch(`http://localhost:5000/api/brands/${brand.id}/permissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          const userPerm = data.data.permissions.find((p: any) => p.user.id === selectedUser.id);
          if (userPerm) perms.push({ ...userPerm, brand });
        }
      }
      setBrandPermissions(perms);
    } catch (e) {
      // ignore for now
    }
  };

  // Add brand permission for user
  const handleAddBrandPermission = async () => {
    if (!selectedUser || !selectedBrandId || !selectedPermissionLevel) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/brands/${selectedBrandId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: selectedUser.id, permissionLevel: selectedPermissionLevel })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Brand permission added');
        fetchAllBrandPermissions();
      } else {
        toast.error(data.error || 'Failed to add permission');
      }
    } catch (e) {
      toast.error('Failed to add permission');
    }
  };

  // Remove brand permission for user
  const handleRemoveBrandPermission = async (brandId: string) => {
    if (!selectedUser) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/brands/${brandId}/permissions/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Brand permission removed');
        fetchAllBrandPermissions();
      } else {
        toast.error(data.error || 'Failed to remove permission');
      }
    } catch (e) {
      toast.error('Failed to remove permission');
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      const data = await response.json();
      if (data.success) {
        // Update local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole as any } : user
        ));
      } else {
        setError(data.error || 'Failed to update user role');
      }
    } catch (error) {
      setError('Failed to update user role');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      const data = await response.json();
      if (data.success) {
        // Remove user from local state
        setUsers(users.filter(user => user.id !== userId));
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (error) {
      setError('Failed to delete user');
    }
  };

  const handleUserCreated = (user: { id: string; name: string; email: string; role: string; createdAt: string }) => {
    // Ensure all required fields are present
    if (!user.id || !user.name || !user.email || !user.role) {
      console.error('Invalid user data received:', user);
      return;
    }

    const newUser: UserWithRole = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'WORKER' | 'CLIENT',
      createdAt: user.createdAt,
    };
    setUsers(prev => [newUser, ...prev]);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      SUPER_ADMIN: { color: 'bg-red-100 text-red-800', icon: '👑', label: 'Super Admin' },
      ADMIN: { color: 'bg-blue-100 text-blue-800', icon: '⚡', label: 'Admin' },
      MANAGER: { color: 'bg-green-100 text-green-800', icon: '📊', label: 'Manager' },
      WORKER: { color: 'bg-gray-100 text-gray-800', icon: '👨‍💻', label: 'Worker' },
      CLIENT: { color: 'bg-purple-100 text-purple-800', icon: '👤', label: 'Client' }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.WORKER;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  // Helper: filter brands user does not already have permission for
  const getAvailableBrandsForUser = () => {
    const permittedBrandIds = new Set(brandPermissions.map((perm) => perm.brand.id));
    return brands.filter((brand) => !permittedBrandIds.has(brand.id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                User Management 👥
              </h1>
              <p className="text-gray-600">
                Manage user roles and permissions for your organization.
              </p>
            </div>
            <Button
              onClick={() => setShowUserForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              New User
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Users Grid */}
        <div className="grid gap-6">
          {users.map((user) => (
            <Card key={user.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => { setSelectedUser(user); setPermissionDialogOpen(true); }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      {getRoleBadge(user.role)}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="WORKER">Worker</SelectItem>
                          <SelectItem value="CLIENT">Client</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {currentUser?.id !== user.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">Users will appear here once they register.</p>
            </CardContent>
          </Card>
        )}

        {/* Permission Management Popup */}
        <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
          <DialogContent className="max-w-lg p-0">
            {/* Visually hidden DialogTitle for accessibility */}
            <DialogTitle className="sr-only">Permission Management</DialogTitle>
            {selectedUser && (
              <Card className="shadow-none border-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Permission Management</CardTitle>
                    <CardDescription>Manage brand and project permissions for this user.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                  <div>
                    <div className="font-semibold mb-1">{selectedUser.name} <span className="text-gray-500 font-normal">({selectedUser.email})</span></div>
                  </div>
                  {/* Brand Permission Management Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Brand Permissions</h4>
                      <span className="text-xs text-gray-400">Assign or remove brand access</span>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select Brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableBrandsForUser().map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedPermissionLevel} onValueChange={setSelectedPermissionLevel}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Permission Level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="READ">Read</SelectItem>
                          <SelectItem value="WRITE">Write</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAddBrandPermission} disabled={!selectedBrandId || !selectedPermissionLevel || getAvailableBrandsForUser().length === 0}>
                        Add
                      </Button>
                    </div>
                    {getAvailableBrandsForUser().length === 0 && (
                      <div className="text-gray-400 text-sm mb-2">User already has permission for all brands.</div>
                    )}
                    {brandLoading && <div className="text-gray-500">Loading brands...</div>}
                    {brandError && <div className="text-red-500">{brandError}</div>}
                    <div className="mt-4">
                      <h5 className="font-medium mb-1">Current Brand Permissions</h5>
                      {brandPermissions.length === 0 && <div className="text-gray-400 text-sm">No brand permissions.</div>}
                      <ul className="space-y-1">
                        {brandPermissions.map((perm) => (
                          <li key={perm.id} className="flex items-center gap-2">
                            <span className="font-medium">{perm.brand.name}</span>
                            <span className="text-xs bg-gray-100 rounded px-2 py-0.5">{perm.permissionLevel}</span>
                            <Button size="sm" variant="outline" className="text-red-500 ml-2" onClick={() => handleRemoveBrandPermission(perm.brand.id)}>
                              Remove
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {/* Project permission management will be added next */}
                </CardContent>
                <CardFooter className="flex justify-end pt-2">
                  <Button variant="secondary" onClick={() => setPermissionDialogOpen(false)}>Close</Button>
                </CardFooter>
              </Card>
            )}
          </DialogContent>
        </Dialog>
        {/* Quick User Form */}
        <QuickUserForm
          open={showUserForm}
          onOpenChange={setShowUserForm}
          onUserCreated={handleUserCreated}
        />
      </main>
    </div>
  );
} 