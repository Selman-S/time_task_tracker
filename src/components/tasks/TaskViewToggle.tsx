'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Calendar } from 'lucide-react';

type ViewMode = 'board' | 'calendar';

interface TaskViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function TaskViewToggle({ viewMode, onViewModeChange }: TaskViewToggleProps) {
  return (
    <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
      <Button
        variant={viewMode === 'board' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('board')}
        className={`flex items-center space-x-2 ${
          viewMode === 'board' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="text-sm font-medium">Board</span>
      </Button>
      <Button
        variant={viewMode === 'calendar' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('calendar')}
        className={`flex items-center space-x-2 ${
          viewMode === 'calendar' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Calendar className="h-4 w-4" />
        <span className="text-sm font-medium">Calendar</span>
      </Button>
    </div>
  );
} 