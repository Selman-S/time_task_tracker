'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Clock, AlertCircle, ArrowLeft, Filter, Play, Square, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

// Import components
import TimerPopup from '@/components/time-entries/TimerPopup';
import ManualEntryPopup from '@/components/time-entries/ManualEntryPopup';
import EditEntryPopup from '@/components/time-entries/EditEntryPopup';

interface TimeEntry {
  id: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  workDate: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  task: {
    id: string;
    title: string;
    project: {
      id: string;
      name: string;
      brand: {
        id: string;
        name: string;
      };
    };
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface TimeEntriesResponse {
  success: boolean;
  data: {
    timeEntries: TimeEntry[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export default function TimeEntriesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [taskFilter, setTaskFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTimeEntries, setTotalTimeEntries] = useState(0);

  // Popup states
  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const [showManualPopup, setShowManualPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editingTimeEntry, setEditingTimeEntry] = useState<TimeEntry | null>(null);

  // Load user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Check if user has permission to manage time entries
  const canManageTimeEntries = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'WORKER';

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(taskFilter && taskFilter !== 'all' && { taskId: taskFilter }),
        ...(userFilter && userFilter !== 'all' && { userId: userFilter }),
        ...(startDateFilter && { startDate: startDateFilter }),
        ...(endDateFilter && { endDate: endDateFilter }),
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-entries?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch time entries');
      }

      const data: TimeEntriesResponse = await response.json();
      
      if (data.success) {
        setTimeEntries(data.data.timeEntries);
        setTotalPages(data.data.pagination.pages);
        setTotalTimeEntries(data.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast.error('Failed to fetch time entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeEntries();
  }, [currentPage, searchTerm, taskFilter, userFilter, startDateFilter, endDateFilter]);

  const handleDeleteTimeEntry = async (timeEntry: TimeEntry) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-entries/${timeEntry.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete time entry');
      }

      toast.success('Time entry deleted successfully');
      fetchTimeEntries();
    } catch (error) {
      console.error('Error deleting time entry:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete time entry');
    }
  };

  const handleStopTimer = async (timeEntry: TimeEntry) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-entries/${timeEntry.id}/stop`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to stop timer');
      }

      toast.success('Timer stopped successfully');
      fetchTimeEntries();
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to stop timer');
    }
  };

  const handleContinueTimeEntry = async (timeEntry: TimeEntry) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-entries/${timeEntry.id}/continue`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to continue time entry');
      }

      toast.success('Timer continued successfully');
      fetchTimeEntries();
    } catch (error) {
      console.error('Error continuing time entry:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to continue time entry');
    }
  };

  const handleEditTimeEntry = (timeEntry: TimeEntry) => {
    setEditingTimeEntry(timeEntry);
    setShowEditPopup(true);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleTaskFilter = (value: string) => {
    setTaskFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handleUserFilter = (value: string) => {
    setUserFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handleStartDateFilter = (value: string) => {
    setStartDateFilter(value);
    setCurrentPage(1);
  };

  const handleEndDateFilter = (value: string) => {
    setEndDateFilter(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  if (!canManageTimeEntries) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                <p className="text-muted-foreground">
                  You don't have permission to manage time entries.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-medium text-gray-900">{user?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Time Tracking</h1>
              <p className="text-gray-600">
                Manage your time entries and track work hours
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setShowTimerPopup(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Timer
              </Button>
              <Button 
                onClick={() => setShowManualPopup(true)}
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Manual Entry
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search time entries..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Select value={taskFilter || 'all'} onValueChange={handleTaskFilter}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Filter by task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                </SelectContent>
              </Select>
              <Select value={userFilter || 'all'} onValueChange={handleUserFilter}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value={user?.id}>My Entries</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="Start date"
                value={startDateFilter}
                onChange={(e) => handleStartDateFilter(e.target.value)}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <Input
                type="date"
                placeholder="End date"
                value={endDateFilter}
                onChange={(e) => handleEndDateFilter(e.target.value)}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Time Entries List */}
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : timeEntries.length === 0 ? (
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No time entries found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || taskFilter || userFilter || startDateFilter || endDateFilter ? 'No time entries match your filters.' : 'Get started by creating your first time entry.'}
                  </p>
                  {!searchTerm && !taskFilter && !userFilter && !startDateFilter && !endDateFilter && (
                    <div className="flex items-center justify-center space-x-3">
                      <Button 
                        onClick={() => setShowTimerPopup(true)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start Timer
                      </Button>
                      <Button 
                        onClick={() => setShowManualPopup(true)}
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Manual Entry
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {timeEntries.map((timeEntry) => (
                  <Card 
                    key={timeEntry.id} 
                    className={`border-0 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300 ${
                      timeEntry.isActive 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                        : 'bg-white/80'
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-gray-900 line-clamp-2">{timeEntry.task.title}</CardTitle>
                          <CardDescription className="text-gray-600">
                            {timeEntry.user.name} • {formatDate(timeEntry.workDate)}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          {timeEntry.isActive ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 animate-pulse">
                              <Play className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : timeEntry.durationMinutes ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {formatDuration(timeEntry.durationMinutes)}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Project:</span>
                          <span>{timeEntry.task.project.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Brand:</span>
                          <span>{timeEntry.task.project.brand.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Work Date:</span>
                          <span>{formatDate(timeEntry.workDate)}</span>
                        </div>
                        {timeEntry.durationMinutes && (
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Duration:</span>
                            <span className="font-medium">{formatDuration(timeEntry.durationMinutes)}</span>
                          </div>
                        )}
                        {timeEntry.notes && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Notes:</span>
                            <p className="mt-1 line-clamp-2">{timeEntry.notes}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-end space-x-2 pt-2">
                          {timeEntry.isActive ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStopTimer(timeEntry)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Square className="h-4 w-4 mr-1" />
                              Stop Timer
                            </Button>
                          ) : (
                            <>
                              {/* Continue button for today's entries */}
                              {isToday(timeEntry.workDate) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleContinueTimeEntry(timeEntry)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Continue
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditTimeEntry(timeEntry)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="border-0 shadow-2xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this time entry? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTimeEntry(timeEntry)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Popup Components */}
      <TimerPopup 
        open={showTimerPopup} 
        onOpenChange={setShowTimerPopup} 
        onTimerStarted={fetchTimeEntries}
      />
      
      <ManualEntryPopup 
        open={showManualPopup} 
        onOpenChange={setShowManualPopup} 
        onEntryCreated={fetchTimeEntries}
      />
      
      <EditEntryPopup 
        open={showEditPopup} 
        onOpenChange={setShowEditPopup} 
        timeEntry={editingTimeEntry}
        onEntryUpdated={fetchTimeEntries}
      />
    </div>
  );
} 