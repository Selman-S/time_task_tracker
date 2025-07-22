'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Permission {
  id: string;
  permissionLevel: 'READ' | 'WRITE' | 'ADMIN';
  createdAt: string;
  user: User;
}

interface BrandPermissionManagerProps {
  brandId: string;
  brandName: string;
  permissions: Permission[];
  onPermissionsUpdated: () => void;
}

export default function BrandPermissionManager({ 
  brandId, 
  brandName, 
  permissions, 
  onPermissionsUpdated 
}: BrandPermissionManagerProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPermissionLevel, setSelectedPermissionLevel] = useState<string>('READ');
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const { toast } = useToast();

  // Fetch all users for the dropdown
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddPermission = async () => {
    if (!selectedUserId || !selectedPermissionLevel) {
      toast({
        title: "Error",
        description: "Please select a user and permission level",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/brands/${brandId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          permissionLevel: selectedPermissionLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add permission');
      }

      if (data.success) {
        toast({
          title: "Success",
          description: "Permission added successfully",
        });
        setShowAddDialog(false);
        setSelectedUserId('');
        setSelectedPermissionLevel('READ');
        onPermissionsUpdated();
      } else {
        throw new Error(data.error || 'Failed to add permission');
      }
    } catch (error) {
      console.error('Error adding permission:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to add permission',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermission = async () => {
    if (!editingPermission || !selectedPermissionLevel) {
      toast({
        title: "Error",
        description: "Please select a permission level",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/brands/${brandId}/permissions/${editingPermission.user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissionLevel: selectedPermissionLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update permission');
      }

      if (data.success) {
        toast({
          title: "Success",
          description: "Permission updated successfully",
        });
        setEditingPermission(null);
        setSelectedPermissionLevel('READ');
        onPermissionsUpdated();
      } else {
        throw new Error(data.error || 'Failed to update permission');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update permission',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePermission = async (permission: Permission) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/brands/${brandId}/permissions/${permission.user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove permission');
      }

      if (data.success) {
        toast({
          title: "Success",
          description: "Permission removed successfully",
        });
        onPermissionsUpdated();
      } else {
        throw new Error(data.error || 'Failed to remove permission');
      }
    } catch (error) {
      console.error('Error removing permission:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to remove permission',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPermissionLevelColor = (level: string) => {
    switch (level) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'WRITE':
        return 'bg-blue-100 text-blue-800';
      case 'READ':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter out users who already have permissions
  const availableUsers = users.filter(user => 
    !permissions.some(permission => permission.user.id === user.id)
  );

  return (
    <div className="space-y-4">
      {/* Add Permission Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Add a user to {brandName} with specific permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">User</label>
                {/* User dropdown with placeholder */}
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" disabled>Select a user</SelectItem>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  Permission Level
                  {/* Info icon with tooltip for permission levels */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={0} className="ml-1 cursor-pointer">
                          <Info className="w-4 h-4 text-blue-500" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="text-xs text-left">
                          <b>READ:</b> View only.<br/>
                          <b>WRITE:</b> Create and edit.<br/>
                          <b>ADMIN:</b> Full management.
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                {/* Permission dropdown with placeholder */}
                <Select value={selectedPermissionLevel} onValueChange={setSelectedPermissionLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a permission level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" disabled>Select a permission level</SelectItem>
                    <SelectItem value="READ">Read Only</SelectItem>
                    <SelectItem value="WRITE">Read & Write</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleAddPermission}
                  disabled={loading || !selectedUserId}
                  className="flex-1"
                >
                  {loading ? 'Adding...' : 'Add Member'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Permissions List */}
      {permissions.length === 0 ? (
        <Card className="border-0 shadow-md bg-gray-50/50">
          <CardContent className="p-8 text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
            <p className="text-muted-foreground">
              Add users to this brand to start collaborating.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {permissions.map((permission) => (
            <Card key={permission.id} className="border-0 shadow-md bg-gray-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{permission.user.name}</p>
                      <p className="text-sm text-gray-600">{permission.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPermissionLevelColor(permission.permissionLevel)}>
                      {permission.permissionLevel}
                    </Badge>
                    <span className="text-sm text-gray-500">{permission.user.role}</span>
                    
                    {/* Edit Permission Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingPermission(permission);
                            setSelectedPermissionLevel(permission.permissionLevel);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Permission</DialogTitle>
                          <DialogDescription>
                            Update permission level for {permission.user.name}.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Permission Level</label>
                            <Select value={selectedPermissionLevel} onValueChange={setSelectedPermissionLevel}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="READ">Read Only</SelectItem>
                                <SelectItem value="WRITE">Read & Write</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex space-x-2 pt-4">
                            <Button
                              onClick={handleUpdatePermission}
                              disabled={loading}
                              className="flex-1"
                            >
                              {loading ? 'Updating...' : 'Update Permission'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setEditingPermission(null)}
                              disabled={loading}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Remove Permission */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Permission</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {permission.user.name} from {brandName}? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemovePermission(permission)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 