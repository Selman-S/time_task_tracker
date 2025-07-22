'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface QuickUserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: (user: { id: string; name: string; email: string; role: string; createdAt: string }) => void;
  editUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  } | null;
}

export default function QuickUserForm({ open, onOpenChange, onUserCreated, editUser }: QuickUserFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('WORKER');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Prefill form in edit mode
  React.useEffect(() => {
    if (editUser) {
      setName(editUser.name);
      setEmail(editUser.email);
      setRole(editUser.role);
      setPassword('');
    } else {
      setName('');
      setEmail('');
      setRole('WORKER');
      setPassword('');
    }
  }, [editUser, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || (!editUser && !password.trim())) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
      return;
    }
    if (!editUser && password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let response, data;
      if (editUser) {
        response = await fetch(`http://localhost:5000/api/admin/users/${editUser.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            role: role,
            ...(password.trim() ? { password } : {}),
          }),
        });
        data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update user');
        if (data.success) {
          toast({ title: 'Success', description: 'User updated successfully' });
          onUserCreated(data.data.user);
          onOpenChange(false);
        } else {
          throw new Error(data.error || 'Failed to update user');
        }
      } else {
        response = await fetch(`http://localhost:5000/api/admin/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: password,
            role: role,
          }),
        });
        data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to create user');
        if (data.success) {
          toast({ title: 'Success', description: 'User created successfully' });
          onUserCreated(data.data.user);
          resetForm();
          onOpenChange(false);
        } else {
          throw new Error(data.error || 'Failed to create user');
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to save user', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('WORKER');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>{editUser ? 'Edit User' : 'Create New User'}</span>
          </DialogTitle>
          <DialogDescription>
            {editUser ? 'Update user information and role.' : 'Add a new user to the system with appropriate role and permissions.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userName" className="text-sm font-medium">Full Name *</Label>
            <Input id="userName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" className="h-10" disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userEmail" className="text-sm font-medium">Email *</Label>
            <Input id="userEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email address" className="h-10" disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userPassword" className="text-sm font-medium">{editUser ? 'Password (leave blank to keep current)' : 'Password *'}</Label>
            <div className="relative">
              <Input
                id="userPassword"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editUser ? 'Leave blank to keep current password' : 'Enter password (min 6 characters)'}
                className="h-10 pr-10"
                disabled={loading}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="userRole" className="text-sm font-medium">Role *</Label>
            <Select value={role} onValueChange={setRole} disabled={loading}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="WORKER">Worker</SelectItem>
                <SelectItem value="CLIENT">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading || !name.trim() || !email.trim() || (!editUser && !password.trim())} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {loading ? (editUser ? 'Updating...' : 'Creating...') : (editUser ? 'Update User' : 'Create User')}
            </Button>
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }} disabled={loading} className="flex-1">Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 