'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Plus, CheckCircle, Clock, AlertCircle, Loader2, User, Calendar, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface TimeEntry {
  id: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  notes?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  estimatedHours?: number;
  dueDate?: string;
  project: {
    id: string;
    name: string;
    brand: {
      id: string;
      name: string;
    };
  };
  assignedUser?: {
    id: string;
    name: string;
    email: string;
  };
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
  timeEntries: TimeEntry[];
  createdAt: string;
  updatedAt: string;
  _count: {
    timeEntries: number;
  };
}

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);

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

  // Load task data
  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch task');
        }

        const data = await response.json();
        
        if (data.success) {
          setTask(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch task');
        }
      } catch (error) {
        console.error('Error fetching task:', error);
        toast.error('Failed to fetch task');
        router.push('/tasks');
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTask();
    }
  }, [taskId, router]);

  // Check if user has permission to view tasks
  const canViewTasks = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'WORKER';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateTotalTime = () => {
    if (!task) return 0;
    return task.timeEntries.reduce((total, entry) => {
      return total + (entry.durationMinutes || 0);
    }, 0);
  };

  if (!canViewTasks) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                <p className="text-muted-foreground">
                  You don't have permission to view tasks.
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
                <h3 className="text-lg font-semibold mb-2">Loading Task</h3>
                <p className="text-muted-foreground">
                  Please wait while we load the task details...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Task Not Found</h3>
                <p className="text-muted-foreground">
                  The task you're looking for doesn't exist.
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
                onClick={() => router.push('/tasks')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Tasks</span>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>
              <p className="text-gray-600">
                Task details and time tracking
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push(`/tasks/${taskId}/edit`)}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Task
              </Button>
              <Button 
                onClick={() => router.push(`/time-entries/new?taskId=${taskId}`)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Time Entry
              </Button>
            </div>
          </div>

          {/* Task Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span>Task Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Project:</span>
                  <p className="font-medium">{task.project.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Brand:</span>
                  <p className="font-medium">{task.project.brand.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Created by:</span>
                  <p className="font-medium">{task.createdByUser.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Created:</span>
                  <p className="font-medium">{formatDate(task.createdAt)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <User className="h-5 w-5 text-green-600" />
                  <span>Assignment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <div className="mt-1">{getStatusBadge(task.status)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Assigned to:</span>
                  <p className="font-medium">
                    {task.assignedUser ? task.assignedUser.name : 'Unassigned'}
                  </p>
                </div>
                {task.estimatedHours && (
                  <div>
                    <span className="text-sm text-gray-600">Estimated:</span>
                    <p className="font-medium">{task.estimatedHours} hours</p>
                  </div>
                )}
                {task.dueDate && (
                  <div>
                    <span className="text-sm text-gray-600">Due:</span>
                    <p className="font-medium">{formatDate(task.dueDate)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Timer className="h-5 w-5 text-purple-600" />
                  <span>Time Tracking</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Total Time:</span>
                  <p className="font-medium text-2xl">{formatDuration(calculateTotalTime())}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Time Entries:</span>
                  <p className="font-medium">{task._count.timeEntries}</p>
                </div>
                {task.estimatedHours && (
                  <div>
                    <span className="text-sm text-gray-600">Progress:</span>
                    <p className="font-medium">
                      {Math.round((calculateTotalTime() / (task.estimatedHours * 60)) * 100)}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {task.description && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="time-entries" className="space-y-6">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="time-entries">Time Entries ({task.timeEntries.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="time-entries" className="space-y-4">
              {task.timeEntries.length === 0 ? (
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Timer className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No time entries yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Get started by adding your first time entry for this task.
                      </p>
                      <Button 
                        onClick={() => router.push(`/time-entries/new?taskId=${taskId}`)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Time Entry
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {task.timeEntries.map((entry) => (
                    <Card key={entry.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-gray-900">
                              {entry.user.name}
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                              {formatDateTime(entry.createdAt)}
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            {entry.durationMinutes && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {formatDuration(entry.durationMinutes)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Start:</span>
                            <span>{formatDateTime(entry.startTime)}</span>
                          </div>
                          {entry.endTime && (
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>End:</span>
                              <span>{formatDateTime(entry.endTime)}</span>
                            </div>
                          )}
                          {entry.notes && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Notes:</span>
                              <p className="mt-1">{entry.notes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
} 