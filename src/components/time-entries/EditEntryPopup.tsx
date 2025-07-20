'use client';

import { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

interface TimeEntry {
  id: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  workDate: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  task: {
    id: string;
    title: string;
    project: {
      id: string;
      name: string;
      brand: {
        id: string;
        name: string;
      };
    };
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface CreateTimeEntryData {
  taskId: string;
  durationMinutes: number;
  workDate: string;
  notes: string;
}

interface EditEntryPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeEntry: TimeEntry | null;
  onEntryUpdated: () => void;
}

export default function EditEntryPopup({ open, onOpenChange, timeEntry, onEntryUpdated }: EditEntryPopupProps) {
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

  // Update form data when timeEntry changes
  useEffect(() => {
    if (timeEntry) {
      setFormData({
        taskId: timeEntry.task.id,
        durationMinutes: timeEntry.durationMinutes || 0,
        workDate: timeEntry.workDate,
        notes: timeEntry.notes ?? '',
      });
    }
  }, [timeEntry]);

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

  const handleUpdateTimeEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !timeEntry) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-entries/${timeEntry.id}`, {
        method: 'PUT',
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
        throw new Error(data.error || 'Failed to update time entry');
      }

      if (data.success) {
        toast.success('Time entry updated successfully');
        onOpenChange(false);
        onEntryUpdated();
      } else {
        throw new Error(data.error || 'Failed to update time entry');
      }
    } catch (error) {
      console.error('Error updating time entry:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update time entry');
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
            <Edit className="h-5 w-5 text-green-600" />
            <span>Edit Time Entry</span>
          </DialogTitle>
          <DialogDescription>
            Update time entry details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdateTimeEntry} className="space-y-4">
          {/* Task Selection */}
          <div className="space-y-2">
            <Label htmlFor="editTaskId" className="text-sm font-medium text-gray-700">
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
            <Label htmlFor="editDurationMinutes" className="text-sm font-medium text-gray-700">
              Duration (minutes) *
            </Label>
            <Input
              id="editDurationMinutes"
              type="number"
              min="1"
              step="1"
              placeholder="Enter duration in minutes"
              value={formData.durationMinutes || ''}
              onChange={(e) => handleInputChange('durationMinutes', Number(e.target.value))}
              className={`h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                errors.durationMinutes ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {errors.durationMinutes && (
              <p className="text-sm text-red-600">{errors.durationMinutes}</p>
            )}
          </div>

          {/* Work Date */}
          <div className="space-y-2">
            <Label htmlFor="editWorkDate" className="text-sm font-medium text-gray-700">
              Work Date *
            </Label>
            <Input
              id="editWorkDate"
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
            <Label htmlFor="editNotes" className="text-sm font-medium text-gray-700">
              Notes
            </Label>
            <Textarea
              id="editNotes"
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
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Update Entry
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 