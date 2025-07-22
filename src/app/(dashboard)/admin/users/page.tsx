'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit, Trash2, User, Settings, HelpCircle, Info, Shield, Users, Key, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import QuickUserForm from '@/components/forms/QuickUserForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { UserListSkeleton } from '@/components/ui/skeleton-loaders';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
  isActive?: boolean;
  brandCount?: number;
  projectCount?: number;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // Modal state
  const [showUserForm, setShowUserForm] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  // Advanced search state
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState({
    name: '',
    email: '',
    role: 'ALL',
    status: 'ALL',
    lastLogin: 'ALL'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: New user
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleOpenUserForm();
      }
      // Ctrl/Cmd + F: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('input[role="searchbox"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      // Escape: Clear search
      if (e.key === 'Escape') {
        setSearchTerm('');
        const searchInput = document.querySelector('input[role="searchbox"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.blur();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please login again.');
          router.push('/login');
          return;
        }
        if (response.status === 403) {
          setError('Access denied. You don\'t have permission to view users.');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Open modal for add or edit
  const handleOpenUserForm = (user?: UserData) => {
    setEditUser(user || null);
    setShowUserForm(true);
  };

  // Delete user
  const handleDeleteUser = async (user: UserData) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: 'Success', description: 'User deleted successfully' });
        fetchUsers();
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to delete user' });
      }
    } catch (error) {
      console.error('Delete user error:', error);
      toast({ title: 'Error', description: 'Failed to delete user' });
    }
  };

  // Add or update user in the list
  const handleUserSaved = (user: UserData, isEdit: boolean) => {
    if (isEdit) {
      setUsers(prev => prev.map(u => u.id === user.id ? user : u));
      toast({ title: 'Success', description: 'User updated successfully' });
    } else {
      setUsers(prev => [user, ...prev]);
      toast({ title: 'Success', description: 'User created successfully' });
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'destructive';
      case 'ADMIN': return 'default';
      case 'MANAGER': return 'secondary';
      case 'WORKER': return 'outline';
      case 'CLIENT': return 'secondary';
      default: return 'outline';
    }
  };

  // Advanced search function
  const performAdvancedSearch = (criteria: typeof searchCriteria) => {
    return users.filter(user => {
      const nameMatch = !criteria.name || user.name.toLowerCase().includes(criteria.name.toLowerCase());
      const emailMatch = !criteria.email || user.email.toLowerCase().includes(criteria.email.toLowerCase());
      const roleMatch = criteria.role === 'ALL' || user.role === criteria.role;
      const statusMatch = criteria.status === 'ALL' || 
        (criteria.status === 'ACTIVE' && user.isActive) ||
        (criteria.status === 'INACTIVE' && !user.isActive);
      const lastLoginMatch = criteria.lastLogin === 'ALL' || 
        (criteria.lastLogin === 'RECENT' && user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
        (criteria.lastLogin === 'OLD' && (!user.lastLogin || new Date(user.lastLogin) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
      
      return nameMatch && emailMatch && roleMatch && statusMatch && lastLoginMatch;
    });
  };

  // Enhanced filter: search by name, email, role, isActive, brandCount, projectCount
  const filteredUsers = showAdvancedSearch 
    ? performAdvancedSearch(searchCriteria)
    : users.filter(user => {
        const q = searchTerm.toLowerCase();
        const matches =
          user.name.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          user.role.toLowerCase().includes(q) ||
          (user.isActive ? 'active' : 'inactive').includes(q) ||
          (user.brandCount !== undefined && user.brandCount.toString().includes(q)) ||
          (user.projectCount !== undefined && user.projectCount.toString().includes(q));
        return (roleFilter === 'ALL' || user.role === roleFilter) && matches;
      });

  // Add to search history
  const addToSearchHistory = (search: string) => {
    if (search.trim() && !searchHistory.includes(search.trim())) {
      setSearchHistory(prev => [search.trim(), ...prev.slice(0, 4)]);
    }
  };

  // Quick filter functions
  const applyQuickFilter = (filter: string) => {
    switch (filter) {
      case 'active':
        setSearchCriteria(prev => ({ ...prev, status: 'ACTIVE' }));
        setShowAdvancedSearch(true);
        break;
      case 'inactive':
        setSearchCriteria(prev => ({ ...prev, status: 'INACTIVE' }));
        setShowAdvancedSearch(true);
        break;
      case 'recent':
        setSearchCriteria(prev => ({ ...prev, lastLogin: 'RECENT' }));
        setShowAdvancedSearch(true);
        break;
      case 'admins':
        setSearchCriteria(prev => ({ ...prev, role: 'ADMIN' }));
        setShowAdvancedSearch(true);
        break;
      case 'clear':
        setSearchCriteria({
          name: '',
          email: '',
          role: 'ALL',
          status: 'ALL',
          lastLogin: 'ALL'
        });
        setShowAdvancedSearch(false);
        setSearchTerm('');
        setRoleFilter('ALL');
        break;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  // Add a helper for formatting lastLogin
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management 👫</h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-sm">
                    <div className="space-y-2">
                      <p className="font-semibold">User Management Guide</p>
                      <ul className="text-sm space-y-1">
                        <li>• <strong>Create users</strong> with different roles</li>
                        <li>• <strong>Assign permissions</strong> to brands and projects</li>
                        <li>• <strong>Track activities</strong> and manage notes</li>
                        <li>• <strong>Invite users</strong> via email</li>
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-2">Manage users, roles, and permissions for your organization.</p>
            <div className="text-xs text-gray-500 space-x-4">
              <span>⌘N: New User</span>
              <span>⌘F: Search</span>
              <span>ESC: Clear Search</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label="User management help"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-sm">
                  <div className="space-y-2">
                    <p className="font-semibold">Quick Actions</p>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <Plus className="w-3 h-3" />
                        <span>Create new user</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Search className="w-3 h-3" />
                        <span>Search users</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        <span>Manage permissions</span>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              onClick={() => handleOpenUserForm()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg w-full sm:w-auto"
              aria-label="Create new user"
              title="Create new user (⌘N)"
            >
              <Plus className="mr-2 h-4 w-4" /> New User
            </Button>
          </div>
        </div>
        {/* User Form Modal (Add/Edit) */}
        <QuickUserForm
          open={showUserForm}
          onOpenChange={setShowUserForm}
          onUserCreated={(user) => handleUserSaved(user, !!editUser)}
          editUser={editUser}
        />
        {/* Search Bar + Role Filter */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Mobile: Stack vertically */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground" role="status" aria-live="polite">
                  {filteredUsers.length} of {users.length} users
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="space-y-1">
                            <p className="font-semibold">User Count</p>
                            <p className="text-sm">Shows filtered results vs total users</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-full sm:w-40 h-10 sm:h-9" aria-label="Filter users by role">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Roles</SelectItem>
                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="WORKER">Worker</SelectItem>
                        <SelectItem value="CLIENT">Client</SelectItem>
                      </SelectContent>
                    </Select>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Users className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-sm">
                          <div className="space-y-2">
                            <p className="font-semibold">User Roles</p>
                            <div className="text-sm space-y-1">
                              <div><strong>Super Admin:</strong> Full system access</div>
                              <div><strong>Admin:</strong> Brand management</div>
                              <div><strong>Manager:</strong> Project management</div>
                              <div><strong>Worker:</strong> Task execution</div>
                              <div><strong>Client:</strong> View-only access</div>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" aria-hidden="true" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (e.target.value.trim()) {
                        addToSearchHistory(e.target.value);
                      }
                    }}
                    className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    aria-label="Search users by name, email, or role"
                    role="searchbox"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    aria-label="Toggle advanced search"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyQuickFilter('active')}
            className="text-xs h-8"
          >
            <User className="mr-1 h-3 w-3" />
            Active Users
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyQuickFilter('inactive')}
            className="text-xs h-8"
          >
            <User className="mr-1 h-3 w-3" />
            Inactive Users
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyQuickFilter('recent')}
            className="text-xs h-8"
          >
            <Clock className="mr-1 h-3 w-3" />
            Recent Login
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyQuickFilter('admins')}
            className="text-xs h-8"
          >
            <Shield className="mr-1 h-3 w-3" />
            Admins
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyQuickFilter('clear')}
            className="text-xs h-8 text-red-600 hover:text-red-700"
          >
            <X className="mr-1 h-3 w-3" />
            Clear Filters
          </Button>
        </div>

        {/* Advanced Search Panel */}
        {showAdvancedSearch && (
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Advanced Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <Input
                    placeholder="Search by name..."
                    value={searchCriteria.name}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, name: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input
                    placeholder="Search by email..."
                    value={searchCriteria.email}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, email: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Role</label>
                  <Select value={searchCriteria.role} onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Roles</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="WORKER">Worker</SelectItem>
                      <SelectItem value="CLIENT">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={searchCriteria.status} onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Last Login</label>
                  <Select value={searchCriteria.lastLogin} onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, lastLogin: value }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Time</SelectItem>
                      <SelectItem value="RECENT">Recent (7 days)</SelectItem>
                      <SelectItem value="OLD">Old (30+ days)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Users List */}
        <div className="space-y-4">
          {loading ? (
            <UserListSkeleton />
          ) : error ? (
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 text-red-500 mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Users</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button 
                    onClick={fetchUsers}
                    variant="outline"
                    className="mr-2"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : filteredUsers.length === 0 ? (
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No users found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? 'No users match your search criteria.' : 'Get started by creating your first user.'}
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => handleOpenUserForm()}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg w-full sm:w-auto"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Create User
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:space-y-0">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  {/* Mobile: List View */}
                  <div className="sm:hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 truncate text-sm">{user.name}</h3>
                            <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs px-2 py-1 ml-2 flex-shrink-0">
                              {user.role.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 truncate mb-1">{user.email}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className={`inline-block w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                            <span>•</span>
                            <span>B: {user.brandCount ?? 0}</span>
                            <span>•</span>
                            <span>P: {user.projectCount ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                                         <CardContent className="pt-0">
                       <div className="flex gap-2">
                         <TooltipProvider>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => router.push(`/admin/users/${user.id}`)}
                                 className="flex-1 text-xs h-8"
                                 aria-label={`Manage permissions for ${user.name}`}
                               >
                                 <Settings className="mr-1 h-3 w-3" />
                                 Perm
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent side="top">
                               <div className="space-y-1">
                                 <p className="font-semibold">Manage Permissions</p>
                                 <p className="text-sm">Assign brand and project access</p>
                               </div>
                             </TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                         <TooltipProvider>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleOpenUserForm(user)}
                                 className="flex-1 text-xs h-8"
                                 aria-label={`Edit user ${user.name}`}
                               >
                                 <Edit className="mr-1 h-3 w-3" />
                                 Edit
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent side="top">
                               <div className="space-y-1">
                                 <p className="font-semibold">Edit User</p>
                                 <p className="text-sm">Modify user details and role</p>
                               </div>
                             </TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <TooltipProvider>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     className="flex-1 text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                     aria-label={`Delete user ${user.name}`}
                                   >
                                     <Trash2 className="mr-1 h-3 w-3" />
                                     Del
                                   </Button>
                                 </TooltipTrigger>
                                 <TooltipContent side="top">
                                   <div className="space-y-1">
                                     <p className="font-semibold">Delete User</p>
                                     <p className="text-sm">Remove user from system</p>
                                   </div>
                                 </TooltipContent>
                               </Tooltip>
                             </TooltipProvider>
                           </AlertDialogTrigger>
                          <AlertDialogContent className="border-0 shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </div>

                  {/* Desktop: Card View */}
                  <div className="hidden sm:block">
                    <CardHeader className="pb-3">
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-12 h-12 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                              <p className="text-sm text-gray-600 truncate">{user.email}</p>
                            </div>
                            <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs px-2 py-1 ml-2 flex-shrink-0">
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </div>
                          <div className="flex flex-wrap gap-2 items-center text-xs">
                            <span className="flex items-center gap-1">
                              <span className={`inline-block w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                              <span className={user.isActive ? 'text-green-700' : 'text-gray-500'}>{user.isActive ? 'Active' : 'Inactive'}</span>
                            </span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-500">Login: {formatDateTime(user.lastLogin)}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-500">Brands: {user.brandCount ?? 0}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-500">Projects: {user.projectCount ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                        <Button
                                variant="outline"
                          size="sm"
                                onClick={() => router.push(`/admin/users/${user.id}`)}
                                className="flex-1"
                                aria-label={`Manage permissions for ${user.name}`}
                        >
                                <Settings className="mr-2 h-4 w-4" />
                          Permissions
                        </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <div className="space-y-1">
                                <p className="font-semibold">Manage Permissions</p>
                                <p className="text-sm">Assign brand and project access levels</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                        <Button
                                variant="outline"
                          size="sm"
                                onClick={() => handleOpenUserForm(user)}
                                className="flex-1"
                                aria-label={`Edit user ${user.name}`}
                        >
                                <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <div className="space-y-1">
                                <p className="font-semibold">Edit User</p>
                                <p className="text-sm">Modify user details, role, and status</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              aria-label={`Delete user ${user.name}`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-0 shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                    </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-6 flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </main>
    </div>
  );
} 