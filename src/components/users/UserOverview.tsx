'use client';

import { User, Info, ShieldCheck, Building2, FolderOpen, Clock, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { UserDetails, Activity } from '@/types/user';

interface UserOverviewProps {
  userDetails: UserDetails | null;
  activities: Activity[];
  getRoleBadgeVariant: (role: string) => "default" | "destructive" | "outline" | "secondary";
  formatDate: (dateString: string) => string;
  getActivityIcon: (type: string) => React.ReactElement;
  getActivityBadgeVariant: (type: string) => "default" | "destructive" | "outline" | "secondary";
  onTabChange?: (tab: string) => void;
}

export default function UserOverview({
  userDetails,
  activities,
  getRoleBadgeVariant,
  formatDate,
  getActivityIcon,
  getActivityBadgeVariant,
  onTabChange
}: UserOverviewProps) {
  return (
    <div className="space-y-6">
      {/* User Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-bold">
                  {userDetails?.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl">{userDetails?.user.name}</CardTitle>
            <CardDescription className="text-gray-600">{userDetails?.user.email}</CardDescription>
            <div className="flex justify-center mt-3">
              <Badge variant={getRoleBadgeVariant(userDetails?.user.role || '')} className="text-sm">
                {userDetails?.user.role?.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{userDetails?.brandPermissions.length || 0}</div>
                <div className="text-gray-600">Brands</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{userDetails?.projectPermissions.length || 0}</div>
                <div className="text-gray-600">Projects</div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Member since:</span>
                <span className="font-medium">{formatDate(userDetails?.user.createdAt || '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last updated:</span>
                <span className="font-medium">{formatDate(userDetails?.user.updatedAt || '')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Statistics */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              User Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {userDetails?.brandPermissions.filter(p => p.permissionLevel === 'ADMIN').length || 0}
                </div>
                <div className="text-xs text-gray-600">Admin Brands</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {userDetails?.projectPermissions.filter(p => p.permissionLevel === 'ADMIN').length || 0}
                </div>
                <div className="text-xs text-gray-600">Admin Projects</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {userDetails?.brandPermissions.filter(p => p.permissionLevel === 'WRITE').length || 0}
                </div>
                <div className="text-xs text-gray-600">Write Access</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {userDetails?.brandPermissions.filter(p => p.permissionLevel === 'READ').length || 0}
                </div>
                <div className="text-xs text-gray-600">Read Access</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => onTabChange?.('permissions')}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Manage Permissions
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => onTabChange?.('activities')}
            >
              <Clock className="w-4 h-4 mr-2" />
              View Recent Activities
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => onTabChange?.('notes')}
            >
              <StickyNote className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Preview */}
      <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest user activities and interactions</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{activity.title}</span>
                      <Badge variant={getActivityBadgeVariant(activity.type)} className="text-xs">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
                                   {activities.length > 5 && (
                       <div className="text-center pt-2">
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => onTabChange?.('activities')}
                         >
                           View All Activities
                         </Button>
                       </div>
                     )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 