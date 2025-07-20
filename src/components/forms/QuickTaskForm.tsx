'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface QuickTaskFormProps {
  projectId: string;
  projectName: string;
  brandId: string;
  brandName: string;
  onTaskCreated: () => void;
}

export default function QuickTaskForm({ 
  projectId, 
  projectName, 
  brandId, 
  brandName,
  onTaskCreated 
}: QuickTaskFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [estimatedHours, setEstimatedHours] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  // Fetch users for assignment dropdown
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.data.users);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    if (!assignedUserId || assignedUserId === 'none') {
      toast({
        title: "Error",
        description: "Please assign at least one person to the task",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          projectId,
          assignedUserId: assignedUserId,
          estimatedHours: estimatedHours ? parseInt(estimatedHours) : undefined,
          dueDate: dueDate || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      if (data.success) {
        toast({
          title: "Success",
          description: "Task created successfully",
        });
        
        // Reset form
        setTitle('');
        setDescription('');
        setAssignedUserId('');
        setEstimatedHours('');
        setDueDate('');
        setOpen(false);
        
        // Notify parent component
        onTaskCreated();
      } else {
        throw new Error(data.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create task',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchUsers();
    } else {
      // Reset form when closing
      setTitle('');
      setDescription('');
      setAssignedUserId('');
      setEstimatedHours('');
      setDueDate('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Add a new task to {projectName} project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <div><strong>Brand:</strong> {brandName}</div>
              <div><strong>Project:</strong> {projectName}</div>
            </div>
          </div>

          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          {/* Assigned User */}
          <div className="space-y-2">
            <Label htmlFor="assignedUser">Assign To</Label>
            <Select value={assignedUserId} onValueChange={setAssignedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user *" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estimated Hours */}
          <div className="space-y-2">
            <Label htmlFor="estimatedHours">Estimated Hours</Label>
            <Input
              id="estimatedHours"
              type="number"
              min="0"
              step="0.5"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="e.g., 8"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Form Actions */}
          <div className="flex space-x-2 pt-4">
                            <Button
                  type="submit"
                  disabled={loading || !title.trim() || !assignedUserId}
                  className="flex-1"
                >
                  {loading ? 'Adding...' : 'Add Task'}
                </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 