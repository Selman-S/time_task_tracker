'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Clock, ArrowLeft, Play, Square, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { showTimerStartedToast, showTimerStoppedToast, showTimeEntryCreatedToast, showTimeEntryErrorToast, showDeleteSuccessToast } from '@/lib/toast';

// Import components
import TimerPopup from '@/components/time-entries/TimerPopup';
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

  // Day tabs state
  const [currentWeekStart, setCurrentWeekStart] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [weekData, setWeekData] = useState<{ [key: string]: TimeEntry[] }>({});
  const [weekLoading, setWeekLoading] = useState(false);

  // Popup states
  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editingTimeEntry, setEditingTimeEntry] = useState<TimeEntry | null>(null);
  const [selectedWorkDate, setSelectedWorkDate] = useState<string>('');

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
        page: '1', // Always fetch the first page for now
        limit: '10',
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
        // setTotalPages(data.data.pagination.pages); // Removed as per edit hint
        // setTotalTimeEntries(data.data.pagination.total); // Removed as per edit hint
      }
    } catch (error) {
      console.error('Error fetching time entries:', error);
      showTimeEntryErrorToast('Failed to fetch time entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeEntries();
  }, []); // Removed dependencies as per edit hint

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

      showTimerStoppedToast();
      refreshWeekData();
    } catch (error) {
      console.error('Error stopping timer:', error);
      showTimeEntryErrorToast(error instanceof Error ? error.message : 'Failed to stop timer');
    }
  };

  const handleStartTimeEntry = async (timeEntry: TimeEntry) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-entries/${timeEntry.id}/start`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start time entry');
      }

      showTimerStartedToast();
      refreshWeekData();
    } catch (error) {
      console.error('Error starting time entry:', error);
      showTimeEntryErrorToast(error instanceof Error ? error.message : 'Failed to start time entry');
    }
  };

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

      showDeleteSuccessToast('Time Entry');
      refreshWeekData();
    } catch (error) {
      console.error('Error deleting time entry:', error);
      showTimeEntryErrorToast(error instanceof Error ? error.message : 'Failed to delete time entry');
    }
  };

  const handleEditTimeEntry = (timeEntry: TimeEntry) => {
    setEditingTimeEntry(timeEntry);
    setShowEditPopup(true);
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

  // Get current week start (Monday)
  const getCurrentWeekStart = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    return monday.toISOString().split('T')[0];
  };

  // Generate day tabs for a week
  const generateDayTabs = (weekStart: string) => {
    const tabs = [];
    const startDate = new Date(weekStart);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = date.getDate();
      const isTodayDate = isToday(dateKey);
      
      tabs.push({
        date: dateKey,
        label: `${dayNumber} ${dayName}`,
        isToday: isTodayDate,
        isSelected: selectedDay === dateKey,
      });
    }
    
    return tabs;
  };

  // Fetch week data
  const fetchWeekData = async (weekStart: string) => {
    try {
      setWeekLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-entries/week?weekStart=${weekStart}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch week data');
      }

      const data = await response.json();
      
      if (data.success) {
        setWeekData(data.data.timeEntriesByDay);
        setCurrentWeekStart(weekStart);
      }
    } catch (error) {
      console.error('Error fetching week data:', error);
      showTimeEntryErrorToast('Failed to fetch week data');
    } finally {
      setWeekLoading(false);
    }
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const currentStart = new Date(currentWeekStart);
    currentStart.setDate(currentStart.getDate() - 7);
    const newWeekStart = currentStart.toISOString().split('T')[0];
    fetchWeekData(newWeekStart);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const currentStart = new Date(currentWeekStart);
    currentStart.setDate(currentStart.getDate() + 7);
    const newWeekStart = currentStart.toISOString().split('T')[0];
    fetchWeekData(newWeekStart);
  };

  // Go to today
  const goToToday = () => {
    const todayWeekStart = getCurrentWeekStart();
    fetchWeekData(todayWeekStart);
    setSelectedDay(new Date().toISOString().split('T')[0]);
  };

  // Refresh week data and update current day
  const refreshWeekData = async () => {
    if (currentWeekStart) {
      await fetchWeekData(currentWeekStart);
      // Keep the selected day active
      if (selectedDay && weekData[selectedDay]) {
        setTimeEntries(weekData[selectedDay]);
      }
    }
  };

  // Initialize week data on component mount
  useEffect(() => {
    if (user) {
      const todayWeekStart = getCurrentWeekStart();
      const today = new Date().toISOString().split('T')[0];
      setSelectedDay(today);
      fetchWeekData(todayWeekStart);
    }
  }, [user]);

  // Update time entries when selected day changes
  useEffect(() => {
    if (selectedDay && weekData[selectedDay]) {
      setTimeEntries(weekData[selectedDay]);
    }
  }, [selectedDay, weekData]);

  // Calculate total duration for a day
  const calculateDayTotal = (entries: TimeEntry[]) => {
    return entries.reduce((total, entry) => {
      return total + (entry.durationMinutes || 0);
    }, 0);
  };

  // Format total duration
  const formatTotalDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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
                onClick={() => {
                  setSelectedWorkDate(selectedDay);
                  setShowTimerPopup(true);
                }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Timer / Add Time
              </Button>
            </div>
          </div>
        </div>

        {/* Day Tabs */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPreviousWeek}
                  disabled={weekLoading}
                  className="text-gray-600 hover:text-gray-900 "
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm text-gray-600">
                  {currentWeekStart && (
                    <>
                      {new Date(currentWeekStart).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextWeek}
                  disabled={weekLoading}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="text-base text-gray-500">Week Total</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatTotalDuration(Object.values(weekData).reduce((total, entries) => 
                      total + calculateDayTotal(entries), 0
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  disabled={weekLoading}
                  className="text-blue-600 hover:text-blue-700 border-blue-300"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Today
                </Button>
              </div>
            </div>
            
            {/* Day Tabs */}
            <div className="grid grid-cols-7 gap-1">
              {currentWeekStart && generateDayTabs(currentWeekStart).map((tab) => {
                const dayEntries = weekData[tab.date] || [];
                const dayTotal = calculateDayTotal(dayEntries);
                const dayTotalFormatted = dayTotal > 0 ? formatTotalDuration(dayTotal) : '';
                
                return (
                  <div key={tab.date} className="flex flex-col">
                    <Button
                      variant={tab.isSelected ? "default" : "ghost"}
                      size="lg"
                      onClick={() => setSelectedDay(tab.date)}
                      disabled={weekLoading}
                      className={`${
                        tab.isToday 
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                          : tab.isSelected 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xs font-medium">{tab.label.split(' ')[1]}</div>
                        <div className="text-sm font-bold">{tab.label.split(' ')[0]}</div>
                      </div>
                    </Button>
                    {dayTotal > 0 && (
                      <div className="text-center mt-1">
                        <div className="text-base font-bold text-green-600">
                          {dayTotalFormatted}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Time Entries List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm animate-pulse">
                  <CardContent className="pt-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
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
                    No time entries for this day. Get started by creating your first time entry.
                  </p>
                  <div className="flex items-center justify-center space-x-3">
                    <Button 
                      onClick={() => {
                        setSelectedWorkDate(selectedDay);
                        setShowTimerPopup(true);
                      }}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Timer / Add Time
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Time Entries as Rows */}
              <div className="space-y-3">
                {timeEntries.map((timeEntry) => (
                  <Card 
                    key={timeEntry.id} 
                    className={`border-0 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300 ${
                      timeEntry.isActive 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                        : 'bg-white/80'
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{timeEntry.task.title}</h4>
                              <p className="text-sm text-gray-600">
                                {timeEntry.task.project.name} • {timeEntry.task.project.brand.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {timeEntry.user.name} • {new Date(timeEntry.startTime).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {timeEntry.isActive ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 animate-pulse px-4 py-2 text-base font-semibold">
                                  <Play className="w-5 h-5 mr-2" />
                                  Active
                                </Badge>
                              ) : timeEntry.durationMinutes ? (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-4 py-2 text-base font-semibold">
                                  {formatDuration(timeEntry.durationMinutes)}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                          {timeEntry.notes && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{timeEntry.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
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
                              {/* Start button for today's entries */}
                              {isToday(timeEntry.workDate) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartTimeEntry(timeEntry)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Start
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
            </>
          )}
        </div>

              {/* Pagination */}
              {/* Removed as per edit hint */}
      </main>

      {/* Popup Components */}
      <TimerPopup 
        open={showTimerPopup} 
        onOpenChange={setShowTimerPopup} 
        onTimerStarted={refreshWeekData}
        selectedWorkDate={selectedWorkDate}
      />
      
      <EditEntryPopup 
        open={showEditPopup} 
        onOpenChange={setShowEditPopup} 
        timeEntry={editingTimeEntry}
        onEntryUpdated={refreshWeekData}
      />
    </div>
  );
} 