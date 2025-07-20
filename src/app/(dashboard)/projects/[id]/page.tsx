'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Plus, Users, FolderOpen, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import ProjectPermissionManager from '@/components/projects/ProjectPermissionManager';
import QuickTaskForm from '@/components/forms/QuickTaskForm';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  estimatedHours?: number;
  dueDate?: string;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
  };
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    timeEntries: number;
  };
}

interface Permission {
  id: string;
  permissionLevel: 'READ' | 'WRITE' | 'ADMIN';
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  brand: {
    id: string;
    name: string;
    description?: string;
  };
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
  tasks: Task[];
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
  _count: {
    tasks: number;
    permissions: number;
  };
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);

  // Load user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }

      const data = await response.json();
      
      if (data.success) {
        setProject(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch project');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to fetch project');
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  // Load project data
  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId, router]);

  // Check if user has permission to view projects
  const canViewProjects = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'WORKER';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TODO':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">To Do</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'DONE':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Done</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPermissionBadge = (level: string) => {
    switch (level) {
      case 'READ':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Read</Badge>;
      case 'WRITE':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Write</Badge>;
      case 'ADMIN':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Admin</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (!canViewProjects) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                <p className="text-muted-foreground">
                  You don't have permission to view projects.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
                <h3 className="text-lg font-semibold mb-2">Loading Project</h3>
                <p className="text-muted-foreground">
                  Please wait while we load the project details...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Project Not Found</h3>
                <p className="text-muted-foreground">
                  The project you're looking for doesn't exist.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/projects')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Projects</span>
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-medium text-gray-900">{user?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-gray-600">
                Project details and management
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push(`/projects/${projectId}/edit`)}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </Button>
              <QuickTaskForm
                projectId={projectId}
                projectName={project.name}
                brandId={project.brand.id}
                brandName={project.brand.name}
                onTaskCreated={fetchProject}
              />
            </div>
          </div>

          {/* Project Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                  <span>Project Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Brand:</span>
                  <p className="font-medium">{project.brand.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Created by:</span>
                  <p className="font-medium">{project.createdByUser.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Created:</span>
                  <p className="font-medium">{formatDate(project.createdAt)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Last updated:</span>
                  <p className="font-medium">{formatDate(project.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Tasks Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Total Tasks:</span>
                  <p className="font-medium text-2xl">{project._count.tasks}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Completed:</span>
                  <p className="font-medium">
                    {project.tasks.filter(t => t.status === 'DONE').length}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">In Progress:</span>
                  <p className="font-medium">
                    {project.tasks.filter(t => t.status === 'IN_PROGRESS').length}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">To Do:</span>
                  <p className="font-medium">
                    {project.tasks.filter(t => t.status === 'TODO').length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span>Team Access</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Team Members:</span>
                  <p className="font-medium text-2xl">{project._count.permissions}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Admins:</span>
                  <p className="font-medium">
                    {project.permissions.filter(p => p.permissionLevel === 'ADMIN').length}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Writers:</span>
                  <p className="font-medium">
                    {project.permissions.filter(p => p.permissionLevel === 'WRITE').length}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Readers:</span>
                  <p className="font-medium">
                    {project.permissions.filter(p => p.permissionLevel === 'READ').length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {project.description && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="tasks" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tasks">Tasks ({project.tasks.length})</TabsTrigger>
              <TabsTrigger value="permissions">Permissions ({project.permissions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-4">
              {project.tasks.length === 0 ? (
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Get started by creating your first task for this project.
                      </p>
                      <QuickTaskForm
                        projectId={projectId}
                        projectName={project.name}
                        brandId={project.brand.id}
                        brandName={project.brand.name}
                        onTaskCreated={fetchProject}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {project.tasks.map((task) => (
                    <Card key={task.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-gray-900 line-clamp-2">{task.title}</CardTitle>
                            <CardDescription className="text-gray-600">
                              Created by {task.createdByUser?.name || 'Unknown'}
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(task.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {task.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{task._count.timeEntries} time entries</span>
                            {task.estimatedHours && (
                              <span>{task.estimatedHours}h estimated</span>
                            )}
                          </div>
                          {task.assignedUser && (
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>Assigned to: {task.assignedUser?.name || 'Unknown'}</span>
                            </div>
                          )}
                          {task.dueDate && (
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>Due: {formatDate(task.dueDate)}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-end space-x-2 pt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/tasks/${task.id}`)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/tasks/${task.id}/edit`)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <ProjectPermissionManager
                projectId={projectId}
                projectName={project.name}
                brandName={project.brand.name}
                permissions={project.permissions}
                onPermissionsUpdated={fetchProject}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
} 