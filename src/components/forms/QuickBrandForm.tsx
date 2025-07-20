'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface QuickBrandFormProps {
  onBrandCreated: (brand: { id: string; name: string; description?: string }) => void;
  onCancel: () => void;
}

export default function QuickBrandForm({ onBrandCreated, onCancel }: QuickBrandFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Brand name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/brands`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create brand');
      }

      if (data.success) {
        toast({
          title: "Success",
          description: "Brand created successfully",
        });
        onBrandCreated(data.data);
      } else {
        throw new Error(data.error || 'Failed to create brand');
      }
    } catch (error) {
      console.error('Error creating brand:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create brand',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="space-y-2">
        <Label htmlFor="brandName" className="text-sm font-medium">
          Brand Name *
        </Label>
        <Input
          id="brandName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter brand name"
          className="h-10"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brandDescription" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="brandDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter brand description (optional)"
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
          {loading ? 'Creating...' : 'Create Brand'}
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