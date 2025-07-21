'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FolderOpen, CheckCircle, Clock, Users, Calendar, TrendingUp, User, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  estimatedHours?: number;
  dueDate?: string;
  assignedUser?: TeamMember;
  timeSpent: number;
  lastActivity: string;
}

interface ProjectProgress {
  project: {
    id: string;
    name: string;
    description?: string;
    brand: {
      id: string;
      name: string;
    };
    createdAt: string;
  };
  progress: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    completionPercentage: number;
  };
  timeMetrics: {
    totalTimeHours: number;
    totalTimeMinutes: number;
    dailyTimeData: {
      date: string;
      hours: number;
    }[];
  };
  teamMembers: TeamMember[];
  tasks: Task[];
}

export default function ClientProjectProgressPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  
  const [user, setUser] = useState<any>(null);
  const [projectData, setProjectData] = useState<ProjectProgress | null>(null);
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

  // Fetch project progress data
  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/projects/${projectId}/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project data');
      }

      const data = await response.json();
      
      if (data.success) {
        setProjectData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch project data');
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error('Failed to load project data');
      router.push('/client');
    } finally {
      setLoading(false);
    }
  };

  // Load project data when user changes
  useEffect(() => {
    if (user?.role === 'CLIENT' && projectId) {
      fetchProjectData();
    }
  }, [user, projectId]);

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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-4 animate-pulse"></div>
              <h3 className="text-lg font-semibold mb-2">Loading Project...</h3>
              <p className="text-muted-foreground">
                Please wait while we load the project progress data.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!projectData) {
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
          <h2 className="text-2xl font-bold text-gray-900">Project Progress</h2>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Project Not Found</h3>
                <p className="text-muted-foreground mb-4">
                  The requested project could not be found or you don't have access to it.
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
            <h2 className="text-2xl font-bold text-gray-900">{projectData.project.name}</h2>
            <p className="text-gray-600">
              {projectData.project.brand.name} • Created {formatDate(projectData.project.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Project Description */}
      {projectData.project.description && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <p className="text-gray-700">{projectData.project.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{projectData.progress.completionPercentage}%</p>
                <p className="text-sm text-green-700">Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{projectData.progress.completedTasks}</p>
                <p className="text-sm text-blue-700">Done</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{projectData.timeMetrics.totalTimeHours}h</p>
                <p className="text-sm text-orange-700">Time Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{projectData.teamMembers.length}</p>
                <p className="text-sm text-purple-700">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Progress Breakdown */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Task Progress Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold text-gray-600 mb-2">{projectData.progress.todoTasks}</div>
              <div className="text-sm text-gray-700 mb-2">To Do</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full" 
                  style={{ width: `${(projectData.progress.todoTasks / projectData.progress.totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-4xl font-bold text-blue-600 mb-2">{projectData.progress.inProgressTasks}</div>
              <div className="text-sm text-blue-700 mb-2">In Progress</div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(projectData.progress.inProgressTasks / projectData.progress.totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-4xl font-bold text-green-600 mb-2">{projectData.progress.completedTasks}</div>
              <div className="text-sm text-green-700 mb-2">Completed</div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(projectData.progress.completedTasks / projectData.progress.totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for detailed view */}
      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">Tasks ({projectData.tasks.length})</TabsTrigger>
          <TabsTrigger value="team">Team ({projectData.teamMembers.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <div className="space-y-4">
            {projectData.tasks.map((task) => (
              <Card key={task.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge className={`${getStatusColor(task.status)} flex items-center space-x-1`}>
                          {getStatusIcon(task.status)}
                          <span>{task.status.replace('_', ' ')}</span>
                        </Badge>
                        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      </div>
                      {task.description && (
                        <p className="text-gray-600 mb-3">{task.description}</p>
                      )}
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        {task.assignedUser && (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>Assigned to {task.assignedUser.name}</span>
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>Due {formatDate(task.dueDate)}</span>
                          </div>
                        )}
                        {task.estimatedHours && (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>Estimated {task.estimatedHours}h</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">{Math.round(task.timeSpent * 10) / 10}h</div>
                      <div className="text-sm text-gray-500">Time Spent</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Last activity: {formatDateTime(task.lastActivity)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectData.teamMembers.map((member) => {
              const memberTasks = projectData.tasks.filter(task => task.assignedUser?.id === member.id);
              const memberTimeSpent = memberTasks.reduce((sum, task) => sum + task.timeSpent, 0);
              const memberCompletedTasks = memberTasks.filter(task => task.status === 'DONE').length;

              return (
                <Card key={member.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tasks Assigned</span>
                        <span className="font-semibold">{memberTasks.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tasks Completed</span>
                        <span className="font-semibold text-green-600">{memberCompletedTasks}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Time Spent</span>
                        <span className="font-semibold text-orange-600">{Math.round(memberTimeSpent * 10) / 10}h</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Daily Time Tracking</CardTitle>
              <CardDescription>Time spent on this project over recent days</CardDescription>
            </CardHeader>
            <CardContent>
              {projectData.timeMetrics.dailyTimeData.length > 0 ? (
                <div className="space-y-3">
                  {projectData.timeMetrics.dailyTimeData
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 14) // Show last 14 days
                    .map((dayData) => (
                      <div key={dayData.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{formatDate(dayData.date)}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-600 h-2 rounded-full" 
                              style={{ 
                                width: `${Math.min((dayData.hours / 8) * 100, 100)}%` // Normalize to 8 hours as full bar
                              }}
                            ></div>
                          </div>
                          <span className="font-semibold text-orange-600 w-12 text-right">
                            {dayData.hours}h
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Time Data Available</h3>
                  <p className="text-gray-600">No time entries have been recorded for this project yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 