'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, FolderOpen, ShieldCheck, Trash2, Plus, User, Calendar, Users, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface BrandPermission {
  id: string;
  permissionLevel: string;
  brand: {
    id: string;
    name: string;
    description?: string;
  };
}

interface ProjectPermission {
  id: string;
  permissionLevel: string;
  project: {
    id: string;
    name: string;
    description?: string;
    brand: {
      id: string;
      name: string;
    };
  };
}

interface Brand {
  id: string;
  name: string;
  description?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  brand: {
    id: string;
    name: string;
  };
}

interface UserDetails {
  user: User;
  brandPermissions: BrandPermission[];
  projectPermissions: ProjectPermission[];
  availableBrands: Brand[];
  availableProjects: Project[];
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  // Main data state
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add brand permission state
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedBrandPermissionLevel, setSelectedBrandPermissionLevel] = useState('');
  const [addingBrandPermission, setAddingBrandPermission] = useState(false);

  // Add project permission state
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProjectPermissionLevel, setSelectedProjectPermissionLevel] = useState('');
  const [addingProjectPermission, setAddingProjectPermission] = useState(false);

  // Fetch user details on component mount
  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  // Fetch complete user details with single API call
  const fetchUserDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setUserDetails(data.data);
      } else {
        setError(data.error || 'Failed to fetch user details');
      }
    } catch (err) {
      setError('Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  // Helper: Get permission badge variant
  const getPermissionBadgeVariant = (level: string) => {
    switch (level.toLowerCase()) {
      case 'read': return 'secondary';
      case 'write': return 'default';
      case 'admin': return 'destructive';
      default: return 'outline';
    }
  };

  // Helper: Get role badge variant
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

  // Helper: Check if user already has brand permission
  const userHasBrandPermission = (brandId: string) => {
    return userDetails?.brandPermissions.some(perm => perm.brand.id === brandId) || false;
  };

  // Helper: Check if user already has project permission
  const userHasProjectPermission = (projectId: string) => {
    return userDetails?.projectPermissions.some(perm => perm.project.id === projectId) || false;
  };

  // Add brand permission
  const handleAddBrandPermission = async () => {
    if (!selectedBrandId || userHasBrandPermission(selectedBrandId)) {
      toast({ title: 'Error', description: 'Please select a valid brand or user already has permission' });
      return;
    }

    setAddingBrandPermission(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/brands/${selectedBrandId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          permissionLevel: selectedBrandPermissionLevel.toUpperCase()
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Brand permission added successfully' });
        setSelectedBrandId('');
        setSelectedBrandPermissionLevel('read');
        fetchUserDetails(); // Refresh data
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to add brand permission' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add brand permission' });
    } finally {
      setAddingBrandPermission(false);
    }
  };

  // Remove brand permission
  const handleRemoveBrandPermission = async (brandId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/brands/${brandId}/permissions/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Brand permission removed successfully' });
        fetchUserDetails(); // Refresh data
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to remove brand permission' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to remove brand permission' });
    }
  };

  // Add project permission
  const handleAddProjectPermission = async () => {
    if (!selectedProjectId || userHasProjectPermission(selectedProjectId)) {
      toast({ title: 'Error', description: 'Please select a valid project or user already has permission' });
      return;
    }

    setAddingProjectPermission(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${selectedProjectId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          permissionLevel: selectedProjectPermissionLevel.toUpperCase()
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Project permission added successfully' });
        setSelectedProjectId('');
        setSelectedProjectPermissionLevel('read');
        fetchUserDetails(); // Refresh data
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to add project permission' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add project permission' });
    } finally {
      setAddingProjectPermission(false);
    }
  };

  // Remove project permission
  const handleRemoveProjectPermission = async (projectId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/permissions/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Project permission removed successfully' });
        fetchUserDetails(); // Refresh data
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to remove project permission' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to remove project permission' });
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading user details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !userDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-lg text-red-600 mb-4">{error || 'User not found'}</div>
              <Button onClick={() => router.push('/admin/users')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Users
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { user, brandPermissions, projectPermissions, availableBrands, availableProjects } = userDetails;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </div>

        {/* User Info Header */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-3xl text-gray-900 mb-2">{user.name}</CardTitle>
                  <CardDescription className="text-lg text-gray-600 mb-3">{user.email}</CardDescription>
                  <div className="flex items-center gap-3">
                    <Badge variant={getRoleBadgeVariant(user.role)} className="text-sm px-3 py-1">
                      {user.role.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      Joined {formatDate(user.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>{brandPermissions.length} brand permissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    <span>{projectPermissions.length} project permissions</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Permissions Tabs */}
        <Tabs defaultValue="brands" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <TabsTrigger value="brands" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Building2 className="w-4 h-4 mr-2" />
              Brand Permissions
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FolderOpen className="w-4 h-4 mr-2" />
              Project Permissions
            </TabsTrigger>
          </TabsList>

          {/* Brand Permissions Tab */}
          <TabsContent value="brands">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      Brand Permissions
                    </CardTitle>
                    <CardDescription>
                      Manage user access to different brands
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Brand Permission Form */}
                <Card className="bg-slate-50/50 border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="w-5 h-5 text-green-600" />
                      Add Brand Permission
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      {/* Brand Dropdown */}
                      <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableBrands
                            .filter(brand => !userHasBrandPermission(brand.id))
                            .map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {/* Permission Level Dropdown + Info Icon */}
                      <div className="flex items-center gap-2">
                        <Select value={selectedBrandPermissionLevel} onValueChange={setSelectedBrandPermissionLevel}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Permission Level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="read">Read</SelectItem>
                            <SelectItem value="write">Write</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}><Info className="w-4 h-4 text-blue-500 cursor-pointer" /></span>
                          </TooltipTrigger>
                          <TooltipContent sideOffset={8}>
                            <div className="text-xs whitespace-pre-line">
                              READ: View only access.\nWRITE: Create and edit access.\nADMIN: Full management access (add/remove users, change permissions).
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {/* Add Button */}
                      <Button 
                        onClick={handleAddBrandPermission}
                        disabled={!selectedBrandId || userHasBrandPermission(selectedBrandId) || addingBrandPermission || !selectedBrandPermissionLevel}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      >
                        {addingBrandPermission ? 'Adding...' : 'Add Permission'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Brand Permissions */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Current Brand Permissions</h4>
                  {brandPermissions.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No brand permissions assigned</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {brandPermissions.map((perm) => (
                        <Card key={perm.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{perm.brand.name}</h5>
                                {perm.brand.description && (
                                  <p className="text-sm text-gray-500 mt-1">{perm.brand.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant={getPermissionBadgeVariant(perm.permissionLevel)}>
                                  {perm.permissionLevel}
                                </Badge>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="border-0 shadow-2xl">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove Permission</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to remove {user.name}'s permission for "{perm.brand.name}"?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleRemoveBrandPermission(perm.brand.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Remove
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Project Permissions Tab */}
          <TabsContent value="projects">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-green-600" />
                      Project Permissions
                    </CardTitle>
                    <CardDescription>
                      Manage user access to specific projects
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Project Permission Form */}
                <Card className="bg-slate-50/50 border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="w-5 h-5 text-green-600" />
                      Add Project Permission
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      {/* Project Dropdown */}
                      <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Project" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProjects
                            .filter(project => !userHasProjectPermission(project.id))
                            .map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.brand.name} - {project.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {/* Permission Level Dropdown + Info Icon */}
                      <div className="flex items-center gap-2">
                        <Select value={selectedProjectPermissionLevel} onValueChange={setSelectedProjectPermissionLevel}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Permission Level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="read">Read</SelectItem>
                            <SelectItem value="write">Write</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}><Info className="w-4 h-4 text-blue-500 cursor-pointer" /></span>
                          </TooltipTrigger>
                          <TooltipContent sideOffset={8}>
                            <div className="text-xs whitespace-pre-line">
                              READ: View only access.\nWRITE: Create and edit access.\nADMIN: Full management access (add/remove users, change permissions).
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {/* Add Button */}
                      <Button 
                        onClick={handleAddProjectPermission}
                        disabled={!selectedProjectId || userHasProjectPermission(selectedProjectId) || addingProjectPermission || !selectedProjectPermissionLevel}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      >
                        {addingProjectPermission ? 'Adding...' : 'Add Permission'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Project Permissions */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Current Project Permissions</h4>
                  {projectPermissions.length === 0 ? (
                    <div className="text-center py-8">
                      <FolderOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No project permissions assigned</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {projectPermissions.map((perm) => (
                        <Card key={perm.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{perm.project.name}</h5>
                                <p className="text-sm text-gray-500 mt-1">
                                  Brand: {perm.project.brand.name}
                                </p>
                                {perm.project.description && (
                                  <p className="text-xs text-gray-400 mt-1">{perm.project.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant={getPermissionBadgeVariant(perm.permissionLevel)}>
                                  {perm.permissionLevel}
                                </Badge>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="border-0 shadow-2xl">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove Permission</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to remove {user.name}'s permission for "{perm.project.name}"?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleRemoveProjectPermission(perm.project.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Remove
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
} 