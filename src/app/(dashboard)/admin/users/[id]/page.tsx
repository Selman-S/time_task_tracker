'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, FolderOpen, ShieldCheck, Trash2, Plus, User, Calendar, Users, Info, Clock, CheckCircle, PlusCircle, StickyNote, Edit, X } from 'lucide-react';
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

interface UserNote {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  admin: {
    id: string;
    name: string;
    email: string;
  };
}

interface Activity {
  id: string;
  type: 'time_entry' | 'task_assigned' | 'task_created';
  title: string;
  description: string;
  timestamp: string;
  data: any;
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
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserDetails(data.data);
      } else if (response.status === 404) {
        setError('User not found');
      } else {
        setError('Failed to load user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Failed to load user details');
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
    return brandPermissions.some(perm => perm.brand.id === brandId);
  };

  // Helper: Check if user has project permission
  const userHasProjectPermission = (projectId: string) => {
    return projectPermissions.some(perm => perm.project.id === projectId);
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
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
        <Tabs defaultValue="brands" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border-0 shadow-lg w-full grid grid-cols-4 gap-1 p-1">
            <TabsTrigger value="brands" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs px-2 py-2 h-auto">
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Brand Permissions</span>
              <span className="sm:hidden">Brands</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs px-2 py-2 h-auto">
              <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Project Permissions</span>
              <span className="sm:hidden">Projects</span>
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
                    <div className="flex flex-col sm:grid sm:grid-cols-1 md:grid-cols-3 gap-4 items-start sm:items-center">
                      {/* Brand Dropdown */}
                      <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                        <SelectTrigger className="h-10">
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
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select value={selectedBrandPermissionLevel} onValueChange={setSelectedBrandPermissionLevel}>
                          <SelectTrigger className="h-10 flex-1 sm:flex-none">
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
                              READ: View only access.<br></br>
                              WRITE: Create and edit access.<br></br>
                              ADMIN: Full management access (add/remove users, change permissions).
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {/* Add Button */}
                      <Button 
                        onClick={handleAddBrandPermission}
                        disabled={!selectedBrandId || userHasBrandPermission(selectedBrandId) || addingBrandPermission || !selectedBrandPermissionLevel}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 w-full sm:w-auto h-10"
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
                    <div className="overflow-x-auto">
                      <div className="min-w-[350px] divide-y divide-gray-200 bg-white rounded-md border border-gray-200">
                        {brandPermissions.map((perm) => (
                          <div key={perm.id} className="flex items-center px-4 py-2 hover:bg-slate-50 transition-all">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{perm.brand.name}</div>
                              {perm.brand.description && (
                                <div className="text-xs text-gray-500">{perm.brand.description}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Select 
                                value={perm.permissionLevel.toLowerCase()} 
                                onValueChange={level => handleUpdateBrandPermissionLevel(perm.brand.id, level)}
                                disabled={updatingPermissions.has(`brand-${perm.brand.id}`)}
                              >
                                <SelectTrigger className="w-24 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="read">Read</SelectItem>
                                  <SelectItem value="write">Write</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              {updatingPermissions.has(`brand-${perm.brand.id}`) && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    disabled={removingPermissions.has(`brand-${perm.brand.id}`)}
                                  >
                                    {removingPermissions.has(`brand-${perm.brand.id}`) ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
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
                        ))}
                      </div>
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
                    <div className="flex flex-col sm:grid sm:grid-cols-1 md:grid-cols-3 gap-4 items-start sm:items-center">
                      {/* Project Dropdown */}
                      <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="h-10">
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
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select value={selectedProjectPermissionLevel} onValueChange={setSelectedProjectPermissionLevel}>
                          <SelectTrigger className="h-10 flex-1 sm:flex-none">
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
                              READ: View only access.<br></br>
                              WRITE: Create and edit access.<br></br>
                              ADMIN: Full management access (add/remove users, change permissions).
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {/* Add Button */}
                      <Button 
                        onClick={handleAddProjectPermission}
                        disabled={!selectedProjectId || userHasProjectPermission(selectedProjectId) || addingProjectPermission || !selectedProjectPermissionLevel}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 w-full sm:w-auto h-10"
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
                    <div className="overflow-x-auto">
                      <div className="min-w-[350px] divide-y divide-gray-200 bg-white rounded-md border border-gray-200">
                        {projectPermissions.map((perm) => (
                          <div key={perm.id} className="flex items-center px-4 py-2 hover:bg-slate-50 transition-all">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{perm.project.name}</div>
                              <div className="text-xs text-gray-500">Brand: {perm.project.brand.name}</div>
                              {perm.project.description && (
                                <div className="text-xs text-gray-400">{perm.project.description}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Select 
                                value={perm.permissionLevel.toLowerCase()} 
                                onValueChange={level => handleUpdateProjectPermissionLevel(perm.project.id, level)}
                                disabled={updatingPermissions.has(`project-${perm.project.id}`)}
                              >
                                <SelectTrigger className="w-24 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="read">Read</SelectItem>
                                  <SelectItem value="write">Write</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              {updatingPermissions.has(`project-${perm.project.id}`) && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    disabled={removingPermissions.has(`project-${perm.project.id}`)}
                                  >
                                    {removingPermissions.has(`project-${perm.project.id}`) ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
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
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Recent Activities
                    </CardTitle>
                    <CardDescription>
                      View user's recent activities and work history
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={fetchUserActivities}
                    disabled={activitiesLoading}
                    variant="outline"
                    size="sm"
                  >
                    {activitiesLoading ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading activities...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No recent activities found</p>
                    <Button 
                      onClick={fetchUserActivities}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Load Activities
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-lg border border-slate-200 hover:bg-slate-100/50 transition-all">
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{activity.title}</h4>
                            <Badge variant={getActivityBadgeVariant(activity.type)} className="text-xs">
                              {activity.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <StickyNote className="w-5 h-5 text-blue-600" />
                      Admin Notes
                    </CardTitle>
                    <CardDescription>
                      Add and manage notes about this user
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={fetchUserNotes}
                    disabled={notesLoading}
                    variant="outline"
                    size="sm"
                  >
                    {notesLoading ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Note Form */}
                <Card className="bg-slate-50/50 border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="w-5 h-5 text-green-600" />
                      Add New Note
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Enter your note about this user..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                        disabled={addingNote}
                      />
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleAddNote}
                          disabled={!newNote.trim() || addingNote}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                        >
                          {addingNote ? 'Adding...' : 'Add Note'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Existing Notes */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Existing Notes</h4>
                  {notesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading notes...</p>
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="text-center py-8">
                      <StickyNote className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No notes yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notes.map((note) => (
                        <div key={note.id} className="bg-slate-50/50 rounded-lg border border-slate-200 p-4">
                          {editingNoteId === note.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={editingNoteText}
                                onChange={(e) => setEditingNoteText(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows={3}
                              />
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>By: {note.admin.name}</span>
                                  <span>•</span>
                                  <span>{formatDate(note.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    onClick={() => handleUpdateNote(note.id)}
                                    disabled={!editingNoteText.trim()}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Save
                                  </Button>
                                  <Button 
                                    onClick={cancelEditingNote}
                                    variant="outline"
                                    size="sm"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="text-gray-900 whitespace-pre-wrap">{note.note}</p>
                                </div>
                                <div className="flex items-center gap-1 ml-4">
                                  <Button
                                    onClick={() => startEditingNote(note)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="border-0 shadow-2xl">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Note</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this note? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteNote(note.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>By: {note.admin.name}</span>
                                <span>•</span>
                                <span>{formatDate(note.createdAt)}</span>
                                {note.updatedAt !== note.createdAt && (
                                  <>
                                    <span>•</span>
                                    <span>Edited {formatDate(note.updatedAt)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
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