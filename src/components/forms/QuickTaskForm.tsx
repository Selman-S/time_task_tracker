'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface QuickTaskFormProps {
  projectId: string;
  projectName: string;
  brandName: string;
  onTaskCreated: (task: { id: string; title: string; description?: string; projectId: string }) => void;
  onCancel: () => void;
}

export default function QuickTaskForm({ projectId, projectName, brandName, onTaskCreated, onCancel }: QuickTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
          title: title.trim(),
          description: description.trim() || undefined,
          projectId: projectId,
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
        onTaskCreated(data.data);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-600">
          {brandName} → {projectName}
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="taskTitle" className="text-sm font-medium">
          Task Title *
        </Label>
        <Input
          id="taskTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title"
          className="h-10"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="taskDescription" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="taskDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter task description (optional)"
          className="min-h-[80px]"
          disabled={loading}
        />
      </div>

      <div className="flex space-x-2 pt-2">
        <Button
          type="submit"
          disabled={loading || !title.trim()}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Creating...' : 'Create Task'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
} 