'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, FolderOpen, ShieldCheck, Trash2, Plus, Calendar, Users, Info, Clock, CheckCircle, PlusCircle, StickyNote, Edit, X, User } from 'lucide-react';
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
import UserOverview from '@/components/users/UserOverview';
import Permissions from '@/components/users/Permissions';
import UserActivities from '@/components/users/UserActivities';
import UserNotes from '@/components/users/UserNotes';
import { User as UserType, BrandPermission, ProjectPermission, Brand, Project, UserNote, Activity, UserDetails } from '@/types/user';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CardSkeleton } from '@/components/ui/skeleton-loaders';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  // Main data state
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Activities state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Notes state
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Add brand permission state
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedBrandPermissionLevel, setSelectedBrandPermissionLevel] = useState('');
  const [addingBrandPermission, setAddingBrandPermission] = useState(false);

  // Add project permission state
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProjectPermissionLevel, setSelectedProjectPermissionLevel] = useState('');
  const [addingProjectPermission, setAddingProjectPermission] = useState(false);

  // Permission update states
  const [updatingPermissions, setUpdatingPermissions] = useState<Set<string>>(new Set());
  const [removingPermissions, setRemovingPermissions] = useState<Set<string>>(new Set());

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch user details on component mount
  useEffect(() => {
    fetchUserDetails();
    fetchUserActivities();
    fetchUserNotes();
  }, [userId]);

  // Fetch complete user details with single API call
  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please login again.');
          router.push('/login');
          return;
        }
        if (response.status === 403) {
          setError('Access denied. You don\'t have permission to view this user.');
          return;
        }
        if (response.status === 404) {
          setError('User not found. The user may have been deleted or you may not have permission to view them.');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setUserDetails(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user activities
  const fetchUserActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/activities`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setActivities(data.data.activities);
      } else {
        console.error('Failed to fetch activities');
        toast({
          title: "Error",
          description: "Failed to load user activities",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to load user activities",
        variant: "destructive",
      });
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Fetch user notes
  const fetchUserNotes = async () => {
    try {
      setNotesLoading(true);
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/notes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotes(data.data.notes);
      } else {
        console.error('Failed to fetch notes');
        toast({
          title: "Error",
          description: "Failed to load user notes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Error",
        description: "Failed to load user notes",
        variant: "destructive",
      });
    } finally {
      setNotesLoading(false);
    }
  };

  // Add new note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      setAddingNote(true);
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ note: newNote })
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotes([data.data.note, ...notes]);
        setNewNote('');
        toast({
          title: "Success",
          description: "Note added successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to add note",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    } finally {
      setAddingNote(false);
    }
  };

  // Update note
  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteText.trim()) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ note: editingNoteText })
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotes(notes.map(note => 
          note.id === noteId ? data.data.note : note
        ));
        setEditingNoteId(null);
        setEditingNoteText('');
        toast({
          title: "Success",
          description: "Note updated successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to update note",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotes(notes.filter(note => note.id !== noteId));
        toast({
          title: "Success",
          description: "Note deleted successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete note",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  // Start editing note
  const startEditingNote = (note: UserNote) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.note);
  };

  // Cancel editing note
  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  // Helper: Get permission badge variant
  const getPermissionBadgeVariant = (level: string) => {
    switch (level.toLowerCase()) {
      case 'read':
        return 'secondary';
      case 'write':
        return 'default';
      case 'admin':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Helper: Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'destructive';
      case 'ADMIN':
        return 'default';
      case 'MANAGER':
        return 'secondary';
      case 'WORKER':
        return 'outline';
      case 'CLIENT':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Helper: Check if user has brand permission
  const userHasBrandPermission = (brandId: string) => {
    return brandPermissions.some(perm => perm && perm.brand && perm.brand.id === brandId);
  };

  // Helper: Check if user has project permission
  const userHasProjectPermission = (projectId: string) => {
    return projectPermissions.some(perm => perm && perm.project && perm.project.id === projectId);
  };

  // Add brand permission
  const handleAddBrandPermission = async () => {
    if (!selectedBrandId || !selectedBrandPermissionLevel) return;

    try {
      setAddingBrandPermission(true);
      const response = await fetch(`http://localhost:5000/api/brands/${selectedBrandId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          permissionLevel: selectedBrandPermissionLevel.toUpperCase()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserDetails(prev => prev ? {
          ...prev,
          brandPermissions: [...prev.brandPermissions, data.data.permission]
        } : null);
        
        setSelectedBrandId('');
        setSelectedBrandPermissionLevel('');
        
        toast({
          title: "Success",
          description: "Brand permission added successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to add brand permission",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding brand permission:', error);
      toast({
        title: "Error",
        description: "Failed to add brand permission",
        variant: "destructive",
      });
    } finally {
      setAddingBrandPermission(false);
    }
  };

  // Remove brand permission
  const handleRemoveBrandPermission = async (brandId: string) => {
    try {
      setRemovingPermissions(prev => new Set([...prev, `brand-${brandId}`]));
      const response = await fetch(`http://localhost:5000/api/brands/${brandId}/permissions/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setUserDetails(prev => prev ? {
          ...prev,
          brandPermissions: prev.brandPermissions.filter(perm => perm.brand.id !== brandId)
        } : null);
        
        toast({
          title: "Success",
          description: "Brand permission removed successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to remove brand permission",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error removing brand permission:', error);
      toast({
        title: "Error",
        description: "Failed to remove brand permission",
        variant: "destructive",
      });
    } finally {
      setRemovingPermissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(`brand-${brandId}`);
        return newSet;
      });
    }
  };

  // Add project permission
  const handleAddProjectPermission = async () => {
    if (!selectedProjectId || !selectedProjectPermissionLevel) return;

    try {
      setAddingProjectPermission(true);
      const response = await fetch(`http://localhost:5000/api/projects/${selectedProjectId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          permissionLevel: selectedProjectPermissionLevel.toUpperCase()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserDetails(prev => prev ? {
          ...prev,
          projectPermissions: [...prev.projectPermissions, data.data.permission]
        } : null);
        
        setSelectedProjectId('');
        setSelectedProjectPermissionLevel('');
        
        toast({
          title: "Success",
          description: "Project permission added successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to add project permission",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding project permission:', error);
      toast({
        title: "Error",
        description: "Failed to add project permission",
        variant: "destructive",
      });
    } finally {
      setAddingProjectPermission(false);
    }
  };

  // Remove project permission
  const handleRemoveProjectPermission = async (projectId: string) => {
    try {
      setRemovingPermissions(prev => new Set([...prev, `project-${projectId}`]));
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/permissions/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setUserDetails(prev => prev ? {
          ...prev,
          projectPermissions: prev.projectPermissions.filter(perm => perm.project.id !== projectId)
        } : null);
        
        toast({
          title: "Success",
          description: "Project permission removed successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to remove project permission",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error removing project permission:', error);
      toast({
        title: "Error",
        description: "Failed to remove project permission",
        variant: "destructive",
      });
    } finally {
      setRemovingPermissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(`project-${projectId}`);
        return newSet;
      });
    }
  };

  // Update brand permission level
  const handleUpdateBrandPermissionLevel = async (brandId: string, newLevel: string) => {
    try {
      setUpdatingPermissions(prev => new Set([...prev, `brand-${brandId}`]));
      const response = await fetch(`http://localhost:5000/api/brands/${brandId}/permissions/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          permissionLevel: newLevel.toUpperCase()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserDetails(prev => prev ? {
          ...prev,
          brandPermissions: prev.brandPermissions.map(perm => 
            perm.brand.id === brandId ? data.data.permission : perm
          )
        } : null);
        
        toast({
          title: "Success",
          description: "Brand permission level updated successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to update brand permission level",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating brand permission level:', error);
      toast({
        title: "Error",
        description: "Failed to update brand permission level",
        variant: "destructive",
      });
    } finally {
      setUpdatingPermissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(`brand-${brandId}`);
        return newSet;
      });
    }
  };

  // Update project permission level
  const handleUpdateProjectPermissionLevel = async (projectId: string, newLevel: string) => {
    try {
      setUpdatingPermissions(prev => new Set([...prev, `project-${projectId}`]));
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/permissions/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          permissionLevel: newLevel.toUpperCase()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserDetails(prev => prev ? {
          ...prev,
          projectPermissions: prev.projectPermissions.map(perm => 
            perm.project.id === projectId ? data.data.permission : perm
          )
        } : null);
        
        toast({
          title: "Success",
          description: "Project permission level updated successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to update project permission level",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating project permission level:', error);
      toast({
        title: "Error",
        description: "Failed to update project permission level",
        variant: "destructive",
      });
    } finally {
      setUpdatingPermissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(`project-${projectId}`);
        return newSet;
      });
    }
  };

  // Helper: Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'time_entry':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'task_assigned':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'task_created':
        return <PlusCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityBadgeVariant = (type: string) => {
    switch (type) {
      case 'time_entry':
        return 'default';
      case 'task_assigned':
        return 'secondary';
      case 'task_created':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
            
            {/* Tabs Skeleton */}
            <Skeleton className="h-12 w-full" />
            
            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
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
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 text-red-500 mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-red-600">
                    {error ? 'Error Loading User' : 'User Not Found'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {error || 'The user you\'re looking for doesn\'t exist or has been removed.'}
                  </p>
                  <div className="space-x-2">
                    {error && (
                      <Button 
                        onClick={() => {
                          setError('');
                          fetchUserDetails();
                        }}
                        variant="outline"
                        className="mr-2"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry
                      </Button>
                    )}
                    <Button onClick={() => router.push('/admin/users')} variant="outline">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Users
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                  <AvatarFallback className="text-xl sm:text-2xl font-bold bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-2xl sm:text-3xl text-gray-900 mb-2 break-words">{user.name}</CardTitle>
                  <CardDescription className="text-base sm:text-lg text-gray-600 mb-3 break-words">{user.email}</CardDescription>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <Badge variant={getRoleBadgeVariant(user.role)} className="text-sm px-3 py-1 w-fit">
                      {user.role.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      Joined {formatDate(user.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-left lg:text-right">
                <div className="flex flex-col sm:flex-row lg:flex-col gap-4 text-sm text-gray-600">
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="bg-white/80 backdrop-blur-sm border-0 shadow-lg w-full grid grid-cols-4 gap-1 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs px-2 py-2 h-auto">
            <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs px-2 py-2 h-auto">
            <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Permissions</span>
            <span className="sm:hidden">Perms</span>
          </TabsTrigger>
          <TabsTrigger value="activities" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs px-2 py-2 h-auto">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Activities</span>
            <span className="sm:hidden">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs px-2 py-2 h-auto">
            <StickyNote className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Notes</span>
            <span className="sm:hidden">Notes</span>
          </TabsTrigger>
        </TabsList>

                    {/* Overview Tab */}
          <TabsContent value="overview">
            <UserOverview
              userDetails={userDetails}
              activities={activities}
              getRoleBadgeVariant={getRoleBadgeVariant}
              formatDate={formatDate}
              getActivityIcon={getActivityIcon}
              getActivityBadgeVariant={getActivityBadgeVariant}
              onTabChange={setActiveTab}
            />
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions">
            <Permissions
              userDetails={userDetails}
              brandPermissions={brandPermissions}
              projectPermissions={projectPermissions}
              availableBrands={availableBrands}
              availableProjects={availableProjects}
              selectedBrandId={selectedBrandId}
              setSelectedBrandId={setSelectedBrandId}
              selectedBrandPermissionLevel={selectedBrandPermissionLevel}
              setSelectedBrandPermissionLevel={setSelectedBrandPermissionLevel}
              selectedProjectId={selectedProjectId}
              setSelectedProjectId={setSelectedProjectId}
              selectedProjectPermissionLevel={selectedProjectPermissionLevel}
              setSelectedProjectPermissionLevel={setSelectedProjectPermissionLevel}
              addingBrandPermission={addingBrandPermission}
              addingProjectPermission={addingProjectPermission}
              userHasBrandPermission={userHasBrandPermission}
              userHasProjectPermission={userHasProjectPermission}
              handleAddBrandPermission={handleAddBrandPermission}
              handleRemoveBrandPermission={handleRemoveBrandPermission}
              handleUpdateBrandPermissionLevel={handleUpdateBrandPermissionLevel}
              handleAddProjectPermission={handleAddProjectPermission}
              handleRemoveProjectPermission={handleRemoveProjectPermission}
              handleUpdateProjectPermissionLevel={handleUpdateProjectPermissionLevel}
              getPermissionBadgeVariant={getPermissionBadgeVariant}
            />
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities">
            <UserActivities
              activities={activities}
              formatDate={formatDate}
              getActivityIcon={getActivityIcon}
              getActivityBadgeVariant={getActivityBadgeVariant}
            />
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <UserNotes
              notes={notes}
              newNote={newNote}
              setNewNote={setNewNote}
              editingNote={editingNoteId ? notes.find(n => n.id === editingNoteId) || null : null}
              setEditingNote={(note) => setEditingNoteId(note?.id || null)}
              editingNoteText={editingNoteText}
              setEditingNoteText={setEditingNoteText}
              handleAddNote={handleAddNote}
              handleUpdateNote={handleUpdateNote}
              handleDeleteNote={handleDeleteNote}
              startEditingNote={startEditingNote}
              cancelEditingNote={cancelEditingNote}
              formatDate={formatDate}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
} 