'use client';

import { Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from '@/types/user';

interface UserActivitiesProps {
  activities: Activity[];
  formatDate: (dateString: string) => string;
  getActivityIcon: (type: string) => React.ReactElement;
  getActivityBadgeVariant: (type: string) => "default" | "destructive" | "outline" | "secondary";
}

export default function UserActivities({
  activities,
  formatDate,
  getActivityIcon,
  getActivityBadgeVariant
}: UserActivitiesProps) {
  return (
    <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          User Activities
        </CardTitle>
        <CardDescription>Recent user activities and interactions</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">{activity.title}</span>
                    <Badge variant={getActivityBadgeVariant(activity.type)} className="text-xs">
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{formatDate(activity.timestamp)}</span>
                    {activity.data?.durationMinutes && (
                      <span>Duration: {Math.round(activity.data.durationMinutes)} minutes</span>
                    )}
                    {activity.data?.status && (
                      <span>Status: {activity.data.status}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No activities found</p>
            <p className="text-sm">This user hasn't performed any activities yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 