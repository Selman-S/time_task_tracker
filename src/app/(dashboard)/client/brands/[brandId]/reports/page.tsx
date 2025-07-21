'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Clock, BarChart3, Download, Filter, Calendar, User, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface TimeEntry {
  id: string;
  durationMinutes: number;
  workDate: string;
  notes?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  task: {
    id: string;
    title: string;
    status: string;
    project: {
      id: string;
      name: string;
    };
  };
}

interface GroupedData {
  id: string;
  label: string;
  totalMinutes: number;
  totalEntries: number;
  totalHours: number;
  entries: TimeEntry[];
}

interface TimeReportsData {
  summary: {
    totalTimeHours: number;
    totalEntries: number;
    uniqueUsers: number;
    uniqueProjects: number;
    uniqueTasks: number;
    dateRange: {
      startDate?: string;
      endDate?: string;
    };
    groupBy: string;
  };
  groupedData: GroupedData[];
  timeEntries: TimeEntry[];
}

export default function ClientBrandReportsPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.brandId as string;
  
  const [user, setUser] = useState<any>(null);
  const [reportsData, setReportsData] = useState<TimeReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [brandName, setBrandName] = useState<string>('');
  
  // Filter states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [groupBy, setGroupBy] = useState<string>('project');
  const [projectFilter, setProjectFilter] = useState<string>('');

  // Load user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUser(user);
        
        // Check if user is CLIENT
        if (user.role !== 'CLIENT') {
          toast.error('Access denied. This page is for clients only.');
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  // Fetch time reports data
  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      params.append('groupBy', groupBy);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (projectFilter) params.append('projectId', projectFilter);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/brands/${brandId}/time-reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports data');
      }

      const data = await response.json();
      
      if (data.success) {
        setReportsData(data.data);
        // Extract brand name from first time entry if available
        if (data.data.timeEntries.length > 0) {
          // We would need brand info in the response, for now use a placeholder
          setBrandName('Brand'); 
        }
      } else {
        throw new Error(data.error || 'Failed to fetch reports data');
      }
    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast.error('Failed to load reports data');
      // Don't redirect on error, just show error state
    } finally {
      setLoading(false);
    }
  };

  // Load reports data when user or filters change
  useEffect(() => {
    if (user?.role === 'CLIENT' && brandId) {
      fetchReportsData();
    }
  }, [user, brandId, groupBy, startDate, endDate, projectFilter]);

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resetFilters = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
    setGroupBy('project');
    setProjectFilter('');
  };

  const exportToCSV = () => {
    if (!reportsData) return;

    const csvHeaders = ['Date', 'User', 'Project', 'Task', 'Duration (hours)', 'Notes'];
    const csvRows = reportsData.timeEntries.map(entry => [
      formatDate(entry.workDate),
      entry.user.name,
      entry.task.project.name,
      entry.task.title,
      (entry.durationMinutes / 60).toFixed(2),
      entry.notes || ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `time-reports-${brandName}-${formatDate(new Date().toISOString())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-4 animate-pulse"></div>
              <h3 className="text-lg font-semibold mb-2">Loading Reports...</h3>
              <p className="text-muted-foreground">
                Please wait while we load the time reports data.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.push('/client')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="text-2xl font-bold text-gray-900">Time Reports</h2>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Data Found</h3>
                <p className="text-muted-foreground mb-4">
                  No time entries found for the selected filters. Try adjusting your date range or filters.
                </p>
                <Button onClick={resetFilters} variant="outline">
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.push('/client')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Time Reports</h2>
            <p className="text-gray-600">{brandName} - Detailed time tracking reports</p>
          </div>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="groupBy">Group By</Label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={resetFilters} variant="outline" className="w-full">
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{reportsData.summary.totalTimeHours}h</p>
                <p className="text-sm text-blue-700">Total Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{reportsData.summary.totalEntries}</p>
                <p className="text-sm text-green-700">Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{reportsData.summary.uniqueUsers}</p>
                <p className="text-sm text-purple-700">Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{reportsData.summary.uniqueProjects}</p>
                <p className="text-sm text-orange-700">Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-teal-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{reportsData.summary.uniqueTasks}</p>
                <p className="text-sm text-teal-700">Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grouped Data */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Time Summary by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</CardTitle>
          <CardDescription>
            Grouped time entries for the selected period ({formatDate(startDate)} - {formatDate(endDate)})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportsData.groupedData.map((group) => (
              <div key={group.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg text-gray-900">{group.label}</h3>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{group.totalHours}h</div>
                      <div className="text-sm text-blue-700">Total Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{group.totalEntries}</div>
                      <div className="text-sm text-green-700">Entries</div>
                    </div>
                  </div>
                </div>
                
                {/* Recent entries for this group */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Recent Entries:</h4>
                  {group.entries.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{entry.task.title}</p>
                        <p className="text-sm text-gray-600">
                          {entry.user.name} • {formatDate(entry.workDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-orange-600">
                          {Math.round(entry.durationMinutes / 60 * 10) / 10}h
                        </div>
                        {entry.notes && (
                          <div className="text-xs text-gray-500 max-w-32 truncate">
                            {entry.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {group.entries.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      ... and {group.entries.length - 3} more entries
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Time Entries */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Detailed Time Entries</CardTitle>
          <CardDescription>All time entries for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportsData.timeEntries.slice(0, 20).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-xs">
                      {formatDate(entry.workDate)}
                    </Badge>
                    <span className="font-medium text-gray-900">{entry.task.title}</span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <span>{entry.task.project.name}</span>
                    <span>•</span>
                    <span>{entry.user.name}</span>
                    <span>•</span>
                    <span>{formatDateTime(entry.createdAt)}</span>
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">{entry.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-orange-600">
                    {Math.round(entry.durationMinutes / 60 * 10) / 10}h
                  </div>
                </div>
              </div>
            ))}
            {reportsData.timeEntries.length > 20 && (
              <div className="text-center py-4">
                <p className="text-gray-600">
                  Showing 20 of {reportsData.timeEntries.length} entries. Export CSV for complete data.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 