'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  brand: {
    id: string;
    name: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CreateTaskData {
  title: string;
  description?: string;
  projectId: string;
  assignedUserId?: string;
  estimatedHours?: number;
  dueDate?: string;
}

export default function CreateTaskPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    description: '',
    projectId: '',
    assignedUserId: '',
    estimatedHours: undefined,
    dueDate: '',
  });
  const [errors, setErrors] = useState<Partial<CreateTaskData>>({});

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

  // Load projects and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch projects
        const projectsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          if (projectsData.success) {
            setProjects(projectsData.data.projects);
          }
        }

        // Fetch users (only if user has permission)
        if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
          const usersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            if (usersData.success) {
              setUsers(usersData.data.users);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Check if user has permission to create tasks
  const canCreateTasks = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateTaskData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Task title must be less than 200 characters';
    }

    if (!formData.projectId) {
      newErrors.projectId = 'Please select a project';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (formData.estimatedHours !== undefined && formData.estimatedHours < 0) {
      newErrors.estimatedHours = 'Estimated hours must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          projectId: formData.projectId,
          assignedUserId: formData.assignedUserId || undefined,
          estimatedHours: formData.estimatedHours || undefined,
          dueDate: formData.dueDate && formData.dueDate.trim() ? formData.dueDate : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      if (data.success) {
        toast.success('Task created successfully');
        router.push('/tasks');
      } else {
        throw new Error(data.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateTaskData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!canCreateTasks) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                <p className="text-muted-foreground">
                  You don't have permission to create tasks.
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
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Task</h1>
              <p className="text-gray-600">
                Add a new task to your project
              </p>
            </div>
          </div>

          {/* Form Card */}
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-900">
                <CheckCircle className="h-6 w-6 text-blue-600" />
                <span>Task Information</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Enter the details for your new task. This will help track progress and assign work to team members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Task Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Task Title *
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Enter task title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Project Selection */}
                <div className="space-y-2">
                  <Label htmlFor="projectId" className="text-sm font-medium text-gray-700">
                    Project *
                  </Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => handleInputChange('projectId', value)}
                  >
                    <SelectTrigger className={`h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.projectId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} ({project.brand.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.projectId && (
                    <p className="text-sm text-red-600">{errors.projectId}</p>
                  )}
                </div>

                {/* Assigned User */}
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                  <div className="space-y-2">
                    <Label htmlFor="assignedUserId" className="text-sm font-medium text-gray-700">
                      Assign To
                    </Label>
                                         <Select
                       value={formData.assignedUserId || 'unassigned'}
                       onValueChange={(value) => handleInputChange('assignedUserId', value === 'unassigned' ? undefined : value)}
                     >
                      <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select a user (optional)" />
                      </SelectTrigger>
                                           <SelectContent>
                       <SelectItem value="unassigned">Unassigned</SelectItem>
                       {users.map((user) => (
                         <SelectItem key={user.id} value={user.id}>
                           {user.name} ({user.email})
                         </SelectItem>
                       ))}
                     </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Estimated Hours */}
                <div className="space-y-2">
                  <Label htmlFor="estimatedHours" className="text-sm font-medium text-gray-700">
                    Estimated Hours
                  </Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Enter estimated hours"
                    value={formData.estimatedHours || ''}
                    onChange={(e) => handleInputChange('estimatedHours', e.target.value ? Number(e.target.value) : undefined)}
                    className={`h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.estimatedHours ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  {errors.estimatedHours && (
                    <p className="text-sm text-red-600">{errors.estimatedHours}</p>
                  )}
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700">
                    Due Date
                  </Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Enter task description (optional)"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Provide a detailed description of the task and its requirements.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/tasks')}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </div>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create Task
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 