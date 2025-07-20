'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface QuickProjectFormProps {
  brandId: string;
  brandName: string;
  onProjectCreated: (project: { id: string; name: string; description?: string; brandId: string }) => void;
  onCancel: () => void;
}

export default function QuickProjectForm({ brandId, brandName, onProjectCreated, onCancel }: QuickProjectFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          brandId: brandId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      if (data.success) {
        toast({
          title: "Success",
          description: "Project created successfully",
        });
        onProjectCreated(data.data);
      } else {
        throw new Error(data.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create project',
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
          Brand: {brandName}
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectName" className="text-sm font-medium">
          Project Name *
        </Label>
        <Input
          id="projectName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter project name"
          className="h-10"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectDescription" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="projectDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter project description (optional)"
          className="min-h-[80px]"
          disabled={loading}
        />
      </div>

      <div className="flex space-x-2 pt-2">
        <Button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Creating...' : 'Create Project'}
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