'use client';

import { useState, useEffect } from 'react';
import { Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

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
}

export default function TimerPopup({ open, onOpenChange, onTimerStarted }: TimerPopupProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [timeInput, setTimeInput] = useState<string>('00:00');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // Load brands on mount
  useEffect(() => {
    fetchBrands();
  }, []);

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
    
    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours * 60) + minutes;
  };

  const handleSubmit = async () => {
    if (!selectedTask) {
      toast.error('Please select a task first');
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
            workDate: new Date().toISOString().split('T')[0],
            notes: '',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create time entry');
        }

        if (data.success) {
          toast.success('Time entry created successfully');
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
          toast.success('Timer started successfully');
          onOpenChange(false);
          resetForm();
          onTimerStarted();
        } else {
          throw new Error(data.error || 'Failed to start timer');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedBrand('');
    setSelectedProject('');
    setSelectedTask('');
    setTimeInput('00:00');
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
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select a brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project" className="text-sm font-medium text-gray-700">
              Project *
            </Label>
            <Select 
              value={selectedProject} 
              onValueChange={setSelectedProject}
              disabled={!selectedBrand}
            >
              <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder={selectedBrand ? "Select a project" : "Select brand first"} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Selection */}
          <div className="space-y-2">
            <Label htmlFor="task" className="text-sm font-medium text-gray-700">
              Task *
            </Label>
            <Select 
              value={selectedTask} 
              onValueChange={setSelectedTask}
              disabled={!selectedProject}
            >
              <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder={selectedProject ? "Select a task" : "Select project first"} />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Input */}
          <div className="space-y-2">
            <Label htmlFor="timeInput" className="text-lg font-bold text-gray-700">
              Time (HH:MM) *
            </Label>
            <Input
              id="timeInput"
              type="text"
              placeholder="00:00"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              className="h-16 text-xl font-semibold border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">
              {timeInput === '00:00' ? 'Leave as 00:00 to start timer from 0' : 'Enter time for manual entry'}
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
              disabled={!selectedTask || loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
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