'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FolderOpen, CheckCircle, Clock, Users, Calendar, TrendingUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
  timeEntries: {
    id: string;
    durationMinutes: number;
    workDate: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  _count: {
    timeEntries: number;
  };
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
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
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    completionPercentage: number;
    totalTimeHours: number;
  };
  _count: {
    tasks: number;
  };
}

interface ProjectsData {
  projects: Project[];
}

export default function ClientBrandProjectsPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.brandId as string;
  
  const [user, setUser] = useState<any>(null);
  const [projectsData, setProjectsData] = useState<ProjectsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUser(user);
        
        // Check if user is CLIENT
        if (user.role !== 'CLIENT') {
          toast.error('Access denied. This page is for clients only.');
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  // Fetch projects data
  const fetchProjectsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/brands/${brandId}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects data');
      }

      const data = await response.json();
      
      if (data.success) {
        setProjectsData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch projects data');
      }
    } catch (error) {
      console.error('Error fetching projects data:', error);
      toast.error('Failed to load projects data');
      router.push('/client');
    } finally {
      setLoading(false);
    }
  };

  // Load projects data when user changes
  useEffect(() => {
    if (user?.role === 'CLIENT' && brandId) {
      fetchProjectsData();
    }
  }, [user, brandId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'DONE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO': return <Clock className="w-4 h-4" />;
      case 'IN_PROGRESS': return <TrendingUp className="w-4 h-4" />;
      case 'DONE': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-4 animate-pulse"></div>
              <h3 className="text-lg font-semibold mb-2">Loading Projects...</h3>
              <p className="text-muted-foreground">
                Please wait while we load the project data.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!projectsData || projectsData.projects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.push('/client')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="text-2xl font-bold text-gray-900">Brand Projects</h2>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
                <p className="text-muted-foreground mb-4">
                  There are no projects available for this brand yet.
                </p>
                <Button onClick={() => router.push('/client')} variant="outline">
                  Go Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const brandName = projectsData.projects[0]?.brand?.name || 'Brand';
  const totalStats = projectsData.projects.reduce(
    (acc, project) => ({
      totalTasks: acc.totalTasks + project.stats.totalTasks,
      completedTasks: acc.completedTasks + project.stats.completedTasks,
      inProgressTasks: acc.inProgressTasks + project.stats.inProgressTasks,
      totalTimeHours: acc.totalTimeHours + project.stats.totalTimeHours,
    }),
    { totalTasks: 0, completedTasks: 0, inProgressTasks: 0, totalTimeHours: 0 }
  );

  const overallCompletionPercentage = totalStats.totalTasks > 0 
    ? Math.round((totalStats.completedTasks / totalStats.totalTasks) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.push('/client')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{brandName} Projects</h2>
            <p className="text-gray-600">{projectsData.projects.length} active projects</p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/client/brands/${brandId}/reports`)}
          variant="outline"
        >
          View Reports
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{projectsData.projects.length}</p>
                <p className="text-sm text-blue-700">Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{overallCompletionPercentage}%</p>
                <p className="text-sm text-green-700">Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{totalStats.totalTasks}</p>
                <p className="text-sm text-purple-700">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{totalStats.totalTimeHours}h</p>
                <p className="text-sm text-orange-700">Time Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <div className="grid gap-6">
        {projectsData.projects.map((project) => (
          <Card key={project.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-white" />
                    </div>
                    <span>{project.name}</span>
                  </CardTitle>
                  {project.description && (
                    <CardDescription className="mt-2">
                      {project.description}
                    </CardDescription>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>Created by {project.createdByUser.name}</span>
                    <span>•</span>
                    <span>{formatDate(project.createdAt)}</span>
                  </div>
                </div>
                <Button
                  onClick={() => router.push(`/client/projects/${project.id}`)}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Project Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{project.stats.completionPercentage}%</div>
                  <div className="text-xs text-blue-700">Complete</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{project.stats.completedTasks}</div>
                  <div className="text-xs text-green-700">Done</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">{project.stats.inProgressTasks}</div>
                  <div className="text-xs text-yellow-700">In Progress</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{project.stats.totalTimeHours}h</div>
                  <div className="text-xs text-orange-700">Time Spent</div>
                </div>
              </div>

              {/* Recent Tasks */}
              {project.tasks.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Recent Tasks ({project.tasks.length})
                  </h4>
                  <div className="space-y-2">
                    {project.tasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <Badge className={`${getStatusColor(task.status)} flex items-center space-x-1`}>
                            {getStatusIcon(task.status)}
                            <span>{task.status.replace('_', ' ')}</span>
                          </Badge>
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{task.title}</h5>
                            {task.assignedUser && (
                              <p className="text-sm text-gray-500">
                                Assigned to {task.assignedUser.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {task.timeEntries.length > 0 && (
                            <div className="text-center">
                              <div className="font-medium text-orange-600">
                                {Math.round(task.timeEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0) / 60 * 10) / 10}h
                              </div>
                              <div className="text-xs">Time</div>
                            </div>
                          )}
                          {task.dueDate && (
                            <div className="text-center">
                              <div className="font-medium text-red-600">
                                {formatDate(task.dueDate)}
                              </div>
                              <div className="text-xs">Due</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {project.tasks.length > 5 && (
                    <div className="mt-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/client/projects/${project.id}`)}
                      >
                        View All {project.tasks.length} Tasks
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 