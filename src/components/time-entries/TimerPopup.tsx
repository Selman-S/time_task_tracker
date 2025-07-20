'use client';

import { useState, useEffect } from 'react';
import { Play, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { showTimerStartedToast, showTimeEntryCreatedToast, showTimeEntryErrorToast } from '@/lib/toast';
import { canCreateBrand, canCreateProject, canCreateTask, getUserRole } from '@/lib/permissions';
import QuickBrandForm from '@/components/forms/QuickBrandForm';
import QuickProjectForm from '@/components/forms/QuickProjectForm';
import QuickTaskForm from '@/components/forms/QuickTaskForm';

interface Brand {
  id: string;
  name: string;
  description?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  brandId: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  project: {
    id: string;
    name: string;
    brand: {
      id: string;
      name: string;
    };
  };
}

interface TimerPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTimerStarted: () => void;
  selectedWorkDate?: string; // Add prop for work date from clicked time entry
}

export default function TimerPopup({ open, onOpenChange, onTimerStarted, selectedWorkDate }: TimerPopupProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [timeInput, setTimeInput] = useState<string>('00:00');
  const [workDate, setWorkDate] = useState<string>(selectedWorkDate || new Date().toISOString().split('T')[0]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Quick creation states
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  
  // Get user role for permission checking
  const userRole = getUserRole();

  // Show work date input when time is not 00:00
  const showWorkDate = timeInput !== '00:00' && timeInput !== '';

  // Update work date when selectedWorkDate prop changes
  useEffect(() => {
    if (selectedWorkDate) {
      setWorkDate(selectedWorkDate);
    }
  }, [selectedWorkDate]);

  // Load brands on mount
  useEffect(() => {
    fetchBrands();
  }, []);

  // Handle brand selection
  const handleBrandChange = (value: string) => {
    if (value === 'new-brand') {
      setShowBrandForm(true);
      setSelectedBrand('');
    } else {
      setSelectedBrand(value);
      setShowBrandForm(false);
    }
  };

  // Handle project selection
  const handleProjectChange = (value: string) => {
    if (value === 'new-project') {
      setShowProjectForm(true);
      setSelectedProject('');
    } else {
      setSelectedProject(value);
      setShowProjectForm(false);
    }
  };

  // Handle task selection
  const handleTaskChange = (value: string) => {
    if (value === 'new-task') {
      setShowTaskForm(true);
      setSelectedTask('');
    } else {
      setSelectedTask(value);
      setShowTaskForm(false);
    }
  };

  // Load projects when brand changes
  useEffect(() => {
    if (selectedBrand) {
      fetchProjects();
    } else {
      setProjects([]);
    }
    setSelectedProject('');
    setSelectedTask('');
  }, [selectedBrand]);

  // Load tasks when project changes
  useEffect(() => {
    if (selectedProject) {
      fetchTasks();
    } else {
      setTasks([]);
    }
    setSelectedTask('');
  }, [selectedProject]);

  const fetchBrands = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/brands?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBrands(data.data.brands);
        }
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects?brandId=${selectedBrand}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProjects(data.data.projects);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks?projectId=${selectedProject}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTasks(data.data.tasks);
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const parseTimeInput = (timeString: string): number => {
    if (!timeString || timeString === '00:00') return 0;
    
    // Handle various formats: "1:30", "01:30", "130", "1:3", etc.
    let hours = 0;
    let minutes = 0;
    
    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      hours = parseInt(parts[0]) || 0;
      minutes = parseInt(parts[1]) || 0;
    } else {
      // Handle format like "130" (1 hour 30 minutes)
      const totalMinutes = parseInt(timeString);
      if (!isNaN(totalMinutes)) {
        hours = Math.floor(totalMinutes / 100);
        minutes = totalMinutes % 100;
      }
    }
    
    return (hours * 60) + minutes;
  };

  const handleTimeInputChange = (value: string) => {
    // Only allow digits and colon
    const cleanedValue = value.replace(/[^0-9:]/g, '');
    
    // Ensure only one colon
    const colonCount = (cleanedValue.match(/:/g) || []).length;
    if (colonCount > 1) {
      return;
    }
    
    // Limit length to 5 characters (HH:MM)
    if (cleanedValue.length > 5) {
      return;
    }
    
    setTimeInput(cleanedValue);
    
    // If time is entered (not 00:00), set work date
    if (cleanedValue !== '00:00' && cleanedValue !== '') {
      // Use selectedWorkDate if available, otherwise use today's date
      const defaultDate = selectedWorkDate || new Date().toISOString().split('T')[0];
      setWorkDate(defaultDate);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTask) {
      showTimeEntryErrorToast('Please select a task first');
      return;
    }

    const durationMinutes = parseTimeInput(timeInput);

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (durationMinutes > 0) {
        // Manual entry
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-entries`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskId: selectedTask,
            durationMinutes: durationMinutes,
            workDate: workDate,
            notes: '',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create time entry');
        }

        if (data.success) {
          showTimeEntryCreatedToast();
          onOpenChange(false);
          resetForm();
          onTimerStarted();
        } else {
          throw new Error(data.error || 'Failed to create time entry');
        }
      } else {
        // Start timer
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-entries/start`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskId: selectedTask,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to start timer');
        }

        if (data.success) {
          showTimerStartedToast();
          onOpenChange(false);
          resetForm();
          onTimerStarted();
        } else {
          throw new Error(data.error || 'Failed to start timer');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      showTimeEntryErrorToast(error instanceof Error ? error.message : 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedBrand('');
    setSelectedProject('');
    setSelectedTask('');
    setTimeInput('00:00');
    setWorkDate(new Date().toISOString().split('T')[0]);
    setShowBrandForm(false);
    setShowProjectForm(false);
    setShowTaskForm(false);
  };

  // Quick creation handlers
  const handleBrandCreated = (brand: { id: string; name: string; description?: string }) => {
    setBrands(prev => [brand, ...prev]);
    setSelectedBrand(brand.id);
    setShowBrandForm(false);
  };

  const handleProjectCreated = (project: { id: string; name: string; description?: string; brandId: string }) => {
    setProjects(prev => [project, ...prev]);
    setSelectedProject(project.id);
    setShowProjectForm(false);
  };

  const handleTaskCreated = (task: { id: string; title: string; description?: string; projectId: string }) => {
    // Create a Task object that matches the interface
    const newTask: Task = {
      id: task.id,
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      project: {
        id: task.projectId,
        name: projects.find(p => p.id === task.projectId)?.name || '',
        brand: {
          id: selectedBrand,
          name: brands.find(b => b.id === selectedBrand)?.name || '',
        },
      },
    };
    setTasks(prev => [newTask, ...prev]);
    setSelectedTask(task.id);
    setShowTaskForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Play className="h-5 w-5 text-green-600" />
            <span>Start Timer / Add Time</span>
          </DialogTitle>
          <DialogDescription>
            Select brand, project, and task to start tracking time or add manual entry
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Brand Selection */}
          <div className="space-y-2">
            <Label htmlFor="brand" className="text-sm font-medium text-gray-700">
              Brand *
            </Label>
            <Select value={selectedBrand} onValueChange={handleBrandChange}>
              <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select a brand" />
              </SelectTrigger>
              <SelectContent>
                {canCreateBrand(userRole) && (
                  <SelectItem value="new-brand" className="font-semibold text-blue-600">
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>New Brand</span>
                    </div>
                  </SelectItem>
                )}
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Brand Form */}
          {showBrandForm && (
            <QuickBrandForm
              onBrandCreated={handleBrandCreated}
              onCancel={() => {
                setShowBrandForm(false);
                setSelectedBrand('');
              }}
            />
          )}

          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project" className="text-sm font-medium text-gray-700">
              Project *
            </Label>
            <Select 
              value={selectedProject} 
              onValueChange={handleProjectChange}
              disabled={!selectedBrand}
            >
              <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder={selectedBrand ? "Select a project" : "Select brand first"} />
              </SelectTrigger>
              <SelectContent>
                {canCreateProject(userRole) && selectedBrand && (
                  <SelectItem value="new-project" className="font-semibold text-blue-600">
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>New Project</span>
                    </div>
                  </SelectItem>
                )}
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Project Form */}
          {showProjectForm && selectedBrand && (
            <QuickProjectForm
              brandId={selectedBrand}
              brandName={brands.find(b => b.id === selectedBrand)?.name || ''}
              onProjectCreated={handleProjectCreated}
              onCancel={() => {
                setShowProjectForm(false);
                setSelectedProject('');
              }}
            />
          )}

          {/* Task Selection */}
          <div className="space-y-2">
            <Label htmlFor="task" className="text-sm font-medium text-gray-700">
              Task *
            </Label>
            <Select 
              value={selectedTask} 
              onValueChange={handleTaskChange}
              disabled={!selectedProject}
            >
              <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder={selectedProject ? "Select a task" : "Select project first"} />
              </SelectTrigger>
              <SelectContent>
                {canCreateTask(userRole) && selectedProject && (
                  <SelectItem value="new-task" className="font-semibold text-blue-600">
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>New Task</span>
                    </div>
                  </SelectItem>
                )}
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Task Form */}
          {showTaskForm && selectedProject && (
            <QuickTaskForm
              projectId={selectedProject}
              projectName={projects.find(p => p.id === selectedProject)?.name || ''}
              brandName={brands.find(b => b.id === selectedBrand)?.name || ''}
              onTaskCreated={handleTaskCreated}
              onCancel={() => {
                setShowTaskForm(false);
                setSelectedTask('');
              }}
            />
          )}

          {/* Time Input */}
          <div className="space-y-2">
            <Label htmlFor="timeInput" className="text-lg font-bold text-gray-700">
              Time (HH:MM) *
            </Label>
            <Input
              id="timeInput"
              type="text"
              inputMode="numeric"
              placeholder="00:00"
              value={timeInput}
              onChange={(e) => handleTimeInputChange(e.target.value)}
              className="h-16 text-xl font-semibold border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">
              {timeInput === '00:00' ? 'Leave as 00:00 to start timer from 0' : 'Enter time for manual entry'}
            </p>
          </div>

          {/* Work Date Input - Only show when time is entered */}
          {showWorkDate && (
            <div className="space-y-2">
              <Label htmlFor="workDate" className="text-lg font-bold text-gray-700">
                Work Date *
              </Label>
              <Input
                id="workDate"
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="h-16 text-xl font-semibold border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                Select the date for this time entry
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
              disabled={!selectedTask || loading || showBrandForm || showProjectForm || showTaskForm}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : showBrandForm || showProjectForm || showTaskForm ? (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Complete Form First
                </>
              ) : timeInput === '00:00' ? (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Timer
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Add Time Entry
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 