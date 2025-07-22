'use client';

import { FolderOpen, Plus, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UserDetails, ProjectPermission } from '@/types/user';

interface ProjectPermissionsProps {
  userDetails: UserDetails | null;
  projectPermissions: ProjectPermission[];
  availableProjects: any[];
  selectedProjectId: string;
  setSelectedProjectId: (value: string) => void;
  selectedProjectPermissionLevel: string;
  setSelectedProjectPermissionLevel: (value: string) => void;
  addingProjectPermission: boolean;
  userHasProjectPermission: (projectId: string) => boolean;
  handleAddProjectPermission: () => Promise<void>;
  handleRemoveProjectPermission: (projectId: string) => Promise<void>;
  handleUpdateProjectPermissionLevel: (projectId: string, newLevel: string) => Promise<void>;
  getPermissionBadgeVariant: (level: string) => "default" | "destructive" | "outline" | "secondary";
}

export default function ProjectPermissions({
  userDetails,
  projectPermissions,
  availableProjects,
  selectedProjectId,
  setSelectedProjectId,
  selectedProjectPermissionLevel,
  setSelectedProjectPermissionLevel,
  addingProjectPermission,
  userHasProjectPermission,
  handleAddProjectPermission,
  handleRemoveProjectPermission,
  handleUpdateProjectPermissionLevel,
  getPermissionBadgeVariant
}: ProjectPermissionsProps) {
  return (
    <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-green-600" />
              Project Permissions
            </CardTitle>
            <CardDescription>
              Manage user access to different projects
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Project Permission Form */}
        <Card className="bg-slate-50/50 border border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              Add Project Permission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:grid sm:grid-cols-1 md:grid-cols-3 gap-4 items-start sm:items-center">
              {/* Project Dropdown */}
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {availableProjects
                    .filter(project => !userHasProjectPermission(project.id))
                    .map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.brand.name} - {project.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {/* Permission Level Dropdown + Info Icon */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select value={selectedProjectPermissionLevel} onValueChange={setSelectedProjectPermissionLevel}>
                  <SelectTrigger className="h-10 flex-1 sm:flex-none">
                    <SelectValue placeholder="Select Permission Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="write">Write</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}><Info className="w-4 h-4 text-blue-500 cursor-pointer" /></span>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={8}>
                    <div className="text-xs whitespace-pre-line">
                      READ: View only access.<br></br>
                      WRITE: Create and edit access.<br></br>
                      ADMIN: Full management access (add/remove users, change permissions).
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              {/* Add Button */}
              <Button 
                onClick={handleAddProjectPermission}
                disabled={!selectedProjectId || userHasProjectPermission(selectedProjectId) || addingProjectPermission || !selectedProjectPermissionLevel}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 w-full sm:w-auto h-10"
              >
                {addingProjectPermission ? 'Adding...' : 'Add Permission'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Project Permissions */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Current Project Permissions</h4>
          {projectPermissions.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No project permissions assigned</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[350px] divide-y divide-gray-200 bg-white rounded-md border border-gray-200">
                {projectPermissions.map((perm) => (
                  <div key={perm.id} className="flex items-center px-4 py-2 hover:bg-slate-50 transition-all">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{perm.project.name}</div>
                      <div className="text-sm text-gray-500">
                        Brand: {perm.project.brand.name}
                      </div>
                      {perm.project.description && (
                        <div className="text-sm text-gray-500">{perm.project.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Permission Level Dropdown */}
                      <Select 
                        value={perm.permissionLevel.toLowerCase()} 
                        onValueChange={(value) => handleUpdateProjectPermissionLevel(perm.project.id, value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read">Read</SelectItem>
                          <SelectItem value="write">Write</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant={getPermissionBadgeVariant(perm.permissionLevel)} className="text-xs">
                        {perm.permissionLevel}
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-0 shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Project Permission</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {userDetails?.user.name}'s access to {perm.project.name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveProjectPermission(perm.project.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 