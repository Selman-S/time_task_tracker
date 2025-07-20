'use client';

import { useState, useEffect } from 'react';
import { Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

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

interface CreateTimeEntryData {
  taskId: string;
  durationMinutes: number;
  workDate: string;
  notes: string;
}

interface ManualEntryPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntryCreated: () => void;
}

export default function ManualEntryPopup({ open, onOpenChange, onEntryCreated }: ManualEntryPopupProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTimeEntryData>({
    taskId: '',
    durationMinutes: 0,
    workDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<CreateTimeEntryData>>({});

  // Load tasks on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks?limit=100`, {
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

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateTimeEntryData> = {};

    if (!formData.taskId.trim()) {
      newErrors.taskId = 'Task is required';
    }

    if (formData.durationMinutes <= 0) {
      newErrors.durationMinutes = 'Duration must be at least 1 minute';
    }

    if (!formData.workDate.trim()) {
      newErrors.workDate = 'Work date is required';
    }

    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = 'Notes must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-entries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: formData.taskId.trim(),
          durationMinutes: formData.durationMinutes,
          workDate: formData.workDate,
          notes: formData.notes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create time entry');
      }

      if (data.success) {
        toast.success('Time entry created successfully');
        onOpenChange(false);
        setFormData({
          taskId: '',
          durationMinutes: 0,
          workDate: new Date().toISOString().split('T')[0],
          notes: '',
        });
        onEntryCreated();
      } else {
        throw new Error(data.error || 'Failed to create time entry');
      }
    } catch (error) {
      console.error('Error creating time entry:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create time entry');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateTimeEntryData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Manual Time Entry</span>
          </DialogTitle>
          <DialogDescription>
            Add time entry manually for past work
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateManualEntry} className="space-y-4">
          {/* Task Selection */}
          <div className="space-y-2">
            <Label htmlFor="taskId" className="text-sm font-medium text-gray-700">
              Task *
            </Label>
            <Select
              value={formData.taskId}
              onValueChange={(value) => handleInputChange('taskId', value)}
            >
              <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select a task" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title} ({task.project.brand.name} - {task.project.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.taskId && (
              <p className="text-sm text-red-600">{errors.taskId}</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="durationMinutes" className="text-lg font-bold text-gray-700">
              Duration (minutes) *
            </Label>
            <Input
              id="durationMinutes"
              type="number"
              min="1"
              step="1"
              placeholder="Enter duration in minutes"
              value={formData.durationMinutes || ''}
              onChange={(e) => handleInputChange('durationMinutes', Number(e.target.value))}
              className={`h-16 text-xl font-semibold border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                errors.durationMinutes ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {errors.durationMinutes && (
              <p className="text-sm text-red-600">{errors.durationMinutes}</p>
            )}
          </div>

          {/* Work Date */}
          <div className="space-y-2">
            <Label htmlFor="workDate" className="text-sm font-medium text-gray-700">
              Work Date *
            </Label>
            <Input
              id="workDate"
              type="date"
              value={formData.workDate}
              onChange={(e) => handleInputChange('workDate', e.target.value)}
              className={`h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                errors.workDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {errors.workDate && (
              <p className="text-sm text-red-600">{errors.workDate}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Enter notes about your work (optional)"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                errors.notes ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {errors.notes && (
              <p className="text-sm text-red-600">{errors.notes}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
                  <Plus className="mr-2 h-4 w-4" />
                  Create Entry
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 