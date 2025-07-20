'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';

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

interface TaskBoardProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onTaskEdit: (taskId: string) => void;
  formatDate: (dateString: string) => string;
  onTaskStatusChange?: (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => void;
}

export default function TaskBoard({ tasks, onTaskClick, onTaskEdit, formatDate, onTaskStatusChange }: TaskBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const columns = [
    { id: 'TODO', title: 'To Do', color: 'bg-yellow-50 border-yellow-200' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-50 border-blue-200' },
    { id: 'DONE', title: 'Done', color: 'bg-green-50 border-green-200' },
  ];

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

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', task.id);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDraggedOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    
    if (draggedTask && draggedTask.status !== columnId && onTaskStatusChange) {
      try {
        await onTaskStatusChange(draggedTask.id, columnId as 'TODO' | 'IN_PROGRESS' | 'DONE');
        toast.success(`Task moved to ${columns.find(col => col.id === columnId)?.title}`);
      } catch (error) {
        toast.error('Failed to update task status');
      }
    }
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDraggedOverColumn(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((column) => {
        const columnTasks = tasks.filter(task => task.status === column.id);
        const isDragOver = draggedOverColumn === column.id;
        
        return (
          <div
            key={column.id}
            className={`rounded-lg border-2 ${column.color} p-3 min-h-[300px] transition-all duration-200 ${
              isDragOver ? 'ring-2 ring-blue-400 bg-blue-100' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-sm">{column.title}</h3>
              <Badge variant="secondary" className="bg-white text-gray-600 text-xs">
                {columnTasks.length}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {columnTasks.length === 0 ? (
                <div className="text-center py-2 text-gray-500">
                  <p className="text-xs">No tasks</p>
                </div>
              ) : (
                columnTasks.map((task) => (
                                      <Card
                      key={task.id}
                      className={`border-0 shadow-sm py-2 gap-2 bg-white/90 backdrop-blur-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                        draggedTask?.id === task.id ? 'opacity-50' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                    >
                      <CardHeader className="pb-1 pt-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle 
                              className="text-xs text-gray-900 line-clamp-1 font-medium" 
                              onClick={() => onTaskClick(task.id)}
                            >
                              {task.title}
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-500">
                              {task.createdByUser?.name || 'Unknown'}
                            </CardDescription>
                          </div>
                          {getStatusBadge(task.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 pb-2">
                        <div className="space-y-1">
                          {task.description && (
                            <p className="text-xs text-gray-600 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{task._count.timeEntries}</span>
                            </div>
                            {task.estimatedHours && (
                              <span className="text-xs">{task.estimatedHours}h</span>
                            )}
                          </div>
                          
                          {(task.assignedUser || task.dueDate) && (
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              {task.assignedUser && (
                                <div className="flex items-center space-x-1">
                                  <User className="h-3 w-3" />
                                  <span className="line-clamp-1">{task.assignedUser.name}</span>
                                </div>
                              )}
                              {task.dueDate && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(task.dueDate)}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-end space-x-1 pt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onTaskClick(task.id)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-5 px-2 text-xs"
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onTaskEdit(task.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 h-5 px-2 text-xs"
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
} 