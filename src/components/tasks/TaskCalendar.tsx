'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, User, Calendar } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  estimatedHours?: number;
  dueDate?: string;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
  };
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    timeEntries: number;
  };
}

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onTaskEdit: (taskId: string) => void;
  formatDate: (dateString: string) => string;
}

export default function TaskCalendar({ tasks, onTaskClick, onTaskEdit, formatDate }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TODO':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">To Do</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">In Progress</Badge>;
      case 'DONE':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">Done</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Unknown</Badge>;
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getTasksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
      return taskDate === dateString;
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {days.map((date, index) => (
          <div
            key={index}
            className={`min-h-[120px] p-2 border border-gray-200 ${
              date ? 'bg-white' : 'bg-gray-50'
            } ${date && isToday(date) ? 'ring-2 ring-blue-500' : ''}`}
          >
            {date && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    isToday(date) ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {getTasksForDate(date).map((task) => (
                    <div
                      key={task.id}
                      className="p-1 bg-gray-50 rounded text-xs cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => onTaskClick(task.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 line-clamp-1">
                          {task.title}
                        </span>
                        {getStatusBadge(task.status)}
                      </div>
                      
                      {task.assignedUser && (
                        <div className="flex items-center space-x-1 text-gray-500">
                          <User className="h-2 w-2" />
                          <span className="line-clamp-1">{task.assignedUser.name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Clock className="h-2 w-2" />
                        <span>{task._count.timeEntries} entries</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Tasks without due dates */}
      {tasks.filter(task => !task.dueDate).length > 0 && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Tasks without due dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.filter(task => !task.dueDate).map((task) => (
                <Card key={task.id} className="border-0 shadow-sm bg-gray-50/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm text-gray-900 line-clamp-2">
                          {task.title}
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-600">
                          Created by {task.createdByUser?.name || 'Unknown'}
                        </CardDescription>
                      </div>
                      {getStatusBadge(task.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {task.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{task._count.timeEntries} entries</span>
                        </div>
                        {task.estimatedHours && (
                          <span>{task.estimatedHours}h</span>
                        )}
                      </div>
                      
                      {task.assignedUser && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <User className="h-3 w-3" />
                          <span>{task.assignedUser.name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-end space-x-1 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTaskClick(task.id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-6 px-2 text-xs"
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTaskEdit(task.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 h-6 px-2 text-xs"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 