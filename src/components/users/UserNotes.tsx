'use client';

import { useState } from 'react';
import { StickyNote, Plus, Edit, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserNote } from '@/types/user';

interface UserNotesProps {
  notes: UserNote[];
  newNote: string;
  setNewNote: (value: string) => void;
  editingNote: UserNote | null;
  setEditingNote: (note: UserNote | null) => void;
  editingNoteText: string;
  setEditingNoteText: (value: string) => void;
  handleAddNote: () => Promise<void>;
  handleUpdateNote: (noteId: string) => Promise<void>;
  handleDeleteNote: (noteId: string) => Promise<void>;
  startEditingNote: (note: UserNote) => void;
  cancelEditingNote: () => void;
  formatDate: (dateString: string) => string;
}

export default function UserNotes({
  notes,
  newNote,
  setNewNote,
  editingNote,
  setEditingNote,
  editingNoteText,
  setEditingNoteText,
  handleAddNote,
  handleUpdateNote,
  handleDeleteNote,
  startEditingNote,
  cancelEditingNote,
  formatDate
}: UserNotesProps) {
  return (
    <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="w-5 h-5" />
          User Notes
        </CardTitle>
        <CardDescription>Add and manage notes about this user</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Note Form */}
        <Card className="bg-slate-50/50 border border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              Add Note
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your note about this user..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                Add Note
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notes List */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Notes History</h4>
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <StickyNote className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No notes added yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  {editingNote?.id === note.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={!editingNoteText.trim()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={cancelEditingNote}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">{note.admin.name}</span>
                          <span className="text-xs text-gray-500">{formatDate(note.createdAt)}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditingNote(note)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border-0 shadow-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Note</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this note? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{note.note}</p>
                      {note.updatedAt !== note.createdAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Edited on {formatDate(note.updatedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 