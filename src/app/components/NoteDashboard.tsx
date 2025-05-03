"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNotes } from "./providers/notesProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  Menu,
  Save,
  Edit,
  FileText,
  AlertTriangle,
  Database
} from "lucide-react";
import { useProfile } from "./providers/profileProvider";
import { useUpProvider } from "./providers/upProvider";
import { SlateEditor } from '@/components/ui/SlateEditor';
import type { Descendant } from 'slate';
import { NoteHistory } from './NoteHistory';
import { toast } from "react-hot-toast";

export function NoteDashboard() {
  const { 
    notes, 
    selectedNoteId, 
    setSelectedNoteId, 
    createNewNote, 
    updateNote, 
    deleteNote,
    isLoading,
    isSaving,
    saveNoteWithContent,
    viewingHistoricalVersion,
    applyHistoricalVersion: applyVersion,
    cancelHistoricalVersion: cancelVersion
  } = useNotes();

  // Local state for the current note being edited
  const [localNote, setLocalNote] = useState({
    title: "",
    content: [{ type: 'paragraph', children: [{ text: '' }] }] as Descendant[]
  });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [unsavedChangesExist, setUnsavedChangesExist] = useState(false);

  // Get the currently selected note
  const selectedNote = notes.find(note => note.id === selectedNoteId);

  // Function to handle switching to a different note
  const handleNoteSelect = useCallback((noteId: string) => {
    // Don't do anything if this is already the selected note
    if (selectedNoteId === noteId) {
      return;
    }
    
    // First save the current note if needed
    if (selectedNoteId && hasUnsavedChanges) {
      updateNote(selectedNoteId, localNote.title, JSON.stringify(localNote.content));
    }
    
    // Clear the current note state before setting new note
    setLocalNote({
      title: "",
      content: [{ type: 'paragraph', children: [{ text: '' }] }]
    });
    
    // Set the new selected note ID
    setSelectedNoteId(noteId);
    setIsSidebarOpen(false);
    setHasUnsavedChanges(false);
  }, [selectedNoteId, hasUnsavedChanges, localNote, updateNote, setSelectedNoteId]);

  // Update local state when selected note changes
  useEffect(() => {
    // Skip if there's no selected note to avoid clearing content unnecessarily
    if (!selectedNote) {
      // Only reset content if we don't have a selected note
      if (selectedNoteId === null) {
        setLocalNote({
          title: "",
          content: [{ type: 'paragraph', children: [{ text: '' }] }]
        });
        setHasUnsavedChanges(false);
      }
      return;
    }

    // If we're viewing a historical version of this note
    if (viewingHistoricalVersion && viewingHistoricalVersion.noteId === selectedNoteId) {
      try {
        // Parse the historical content
        let parsedContent;
        try {
          parsedContent = JSON.parse(viewingHistoricalVersion.content);
        } catch {
          parsedContent = JSON.parse(JSON.parse(viewingHistoricalVersion.content));
        }
        
        // Ensure we have valid Slate content
        if (!Array.isArray(parsedContent)) {
          console.error("Invalid historical content format");
          parsedContent = [{ type: 'paragraph', children: [{ text: '' }] }];
        }
        
        // Set the historical note state
        setLocalNote({
          title: viewingHistoricalVersion.title || "",
          content: parsedContent
        });
        // Don't mark as unsaved until user makes changes
        setHasUnsavedChanges(false);
        return;
      } catch (error) {
        console.error("Error parsing historical content:", error);
      }
    }

    // Normal note loading (not a historical version)
    try {
      // Parse the content string which is already a stringified JSON array
      let parsedContent;
      try {
        // First try to parse the content as is
        parsedContent = JSON.parse(selectedNote.content);
      } catch {
        // If that fails, try parsing it as a double-stringified JSON
        parsedContent = JSON.parse(JSON.parse(selectedNote.content));
      }
      
      // Ensure we have valid Slate content
      if (!Array.isArray(parsedContent)) {
        console.error("Invalid note content format");
        parsedContent = [{ type: 'paragraph', children: [{ text: '' }] }];
      }
      
      // Set the new note state
      setLocalNote({
        title: selectedNote.title || "",
        content: parsedContent
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error parsing note content:", error);
      setLocalNote({
        title: selectedNote.title || "",
        content: [{ type: 'paragraph', children: [{ text: '' }] }]
      });
    }
  }, [selectedNote?.id, viewingHistoricalVersion]); // Add viewingHistoricalVersion as a dependency

  // Handle content changes
  const handleContentChange = useCallback((newContent: Descendant[]) => {
    setLocalNote(prev => ({ ...prev, content: newContent }));
    setHasUnsavedChanges(true);
    
    // If editing a historical version, update the viewingHistoricalVersion content
    if (viewingHistoricalVersion && viewingHistoricalVersion.noteId === selectedNoteId) {
      // We'll need to update the historical version being viewed with the new content
      if (applyVersion) {
        // Using a function reference to modify the state properly
        // This ensures that the latest content is always saved back to the historical version
        applyVersion({
          updateContentOnly: true,
          newContent: JSON.stringify(newContent)
        });
      }
    }
  }, [viewingHistoricalVersion, selectedNoteId, applyVersion]);

  // Handle title changes
  const handleTitleChange = useCallback((newTitle: string) => {
    // Update local state
    setLocalNote(prev => ({ ...prev, title: newTitle }));
    
    // If editing a historical version, update its title
    if (viewingHistoricalVersion && viewingHistoricalVersion.noteId === selectedNoteId) {
      if (applyVersion) {
        // Update only the title in the historical version
        applyVersion({
          updateTitleOnly: true,
          newTitle: newTitle
        });
      }
    } else {
      // Normal note editing - update global notes state immediately
      if (selectedNoteId) {
        updateNote(selectedNoteId, newTitle, JSON.stringify(localNote.content));
      }
    }
    
    setHasUnsavedChanges(true);
  }, [selectedNoteId, localNote.content, updateNote, viewingHistoricalVersion, applyVersion]);

  // Function to handle saving the note to blockchain
  const handleSaveToBlockchain = useCallback(async () => {
    if (!selectedNoteId) return;
    
    await saveNoteWithContent(
      selectedNoteId, 
      localNote.title, 
      JSON.stringify(localNote.content)
    );
    
    setHasUnsavedChanges(false);
  }, [selectedNoteId, localNote, saveNoteWithContent]);

  // Save when user navigates away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Functions to handle historical version actions
  const applyHistoricalVersion = useCallback(() => {
    if (applyVersion) {
      // Save the current edited state of the historical version
      if (selectedNoteId) {
        applyVersion();
        setHasUnsavedChanges(false);
      }
    }
  }, [applyVersion, selectedNoteId]);

  const cancelHistoricalVersion = useCallback(() => {
    if (cancelVersion) {
      cancelVersion();
    }
  }, [cancelVersion]);

  // Check if any notes have been deleted or modified
  useEffect(() => {
    // This will re-run whenever notes change
    const hasDeletedNotes = notes.some(note => note.isDeleted);
    const hasModifiedNotes = hasUnsavedChanges;
    setUnsavedChangesExist(hasDeletedNotes || hasModifiedNotes);
  }, [notes, hasUnsavedChanges]);

  // Function to save all notes to the blockchain (useful after deletions)
  const saveAllChangesToBlockchain = useCallback(async () => {
    // Check if there are any notes marked for deletion
    const deletedNotes = notes.filter(note => note.isDeleted);
    
    // If there are deleted notes, confirm with the user
    if (deletedNotes.length > 0) {
      const noteNames = deletedNotes.map(note => `"${note.title || 'Untitled'}"`).join(", ");
      const confirmMessage = `You're about to permanently delete the following note${deletedNotes.length > 1 ? 's' : ''}: ${noteNames}. This action cannot be undone. Continue?`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    
    if (!selectedNoteId && notes.length > 0) {
      // Find the first non-deleted note
      const firstNonDeletedNote = notes.find(note => !note.isDeleted);
      
      if (firstNonDeletedNote) {
        setSelectedNoteId(firstNonDeletedNote.id);
        
        // Wait a bit for the state to update
        setTimeout(async () => {
          if (firstNonDeletedNote.id) {
            await saveNoteWithContent(
              firstNonDeletedNote.id,
              firstNonDeletedNote.title,
              firstNonDeletedNote.content
            );
          }
        }, 100);
      } else {
        // All notes are being deleted
        if (notes.length > 0 && notes[0].id) {
          await saveNoteWithContent(
            notes[0].id,
            notes[0].title,
            notes[0].content
          );
        } else {
          toast.error("No valid notes to save.");
        }
      }
    } else if (selectedNoteId) {
      // If a note is selected, save it (this will save all notes state)
      await saveNoteWithContent(
        selectedNoteId,
        localNote.title,
        JSON.stringify(localNote.content)
      );
    } else {
      toast("No notes to save.");
    }
  }, [selectedNoteId, notes, localNote, saveNoteWithContent]);

  const Sidebar = () => {
    const { profileData } = useProfile();
    const { accounts } = useUpProvider();
    const wallet = accounts?.[0] || "";
    const username = wallet ? wallet.slice(2, 6) : "user";
    const profileImg = profileData?.profileImages?.[0]?.url || "https://api.dicebear.com/7.x/identicon/svg?seed=notionuser";
    const displayName = profileData?.name || "Notes User";

    if (isLoading) {
      return (
        <div className="h-full w-full flex flex-col" style={{ background: '#f8f8f7' }}>
          {/* Loading Profile section */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-1" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
            </div>
            <div className="w-8 h-8 rounded-[8px] bg-gray-200 animate-pulse" />
          </div>
          {/* Loading Notes list */}
          <div className="flex-1 px-2 pt-2 pb-2">
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full w-full flex flex-col" style={{ background: '#f8f8f7' }}>
        {/* Profile section */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100">
          <img
            src={profileImg}
            alt="Profile"
            className="w-9 h-9 rounded-full border border-gray-200 bg-gray-100 object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate" onClick={() => {}}>{displayName}</div>
            <div className="text-xs text-gray-400 truncate">@{username}</div>
          </div>
          <button
            onClick={() => {
              createNewNote();
              setIsSidebarOpen(false);
            }}
            className="flex items-center justify-center w-8 h-8 rounded-[8px] hover:bg-[#f0f0ef] transition text-gray-500"
            disabled={isLoading}
            title="Add new note"
          >
            <Edit className="w-5 h-5" style={{ color: '#b7b6b4' }} />
          </button>
        </div>
        
        {/* Save all changes button - Only show when there are unsaved changes 
        {unsavedChangesExist && (
          <div className="bg-amber-50 px-3 py-2 m-2 rounded-lg">
            <div className="flex items-center text-amber-700 text-xs mb-2">
              <AlertTriangle className="w-3 h-3 mr-1" />
              <span>You have unsaved changes</span>
            </div>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
              size="sm"
              onClick={saveAllChangesToBlockchain}
              disabled={isSaving}
            >
              <Database className="w-3 h-3 mr-1" />
              Save all changes to blockchain
            </Button>
          </div>
        )}*/}
        
        {/* Notes list */}
        <ScrollArea className="flex-1 px-2 pt-2 pb-2">
          <div className="space-y-0.5">
            {notes.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No notes found</p>
                <p className="text-xs mt-1">Create a new note to get started</p>
                <Button
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                  onClick={() => {
                    createNewNote();
                    setIsSidebarOpen(false);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create new note
                </Button>
              </div>
            ) : (
              <>
                {notes.map((note, idx) => (
                  <React.Fragment key={note.id}>
                    <button
                      onClick={() => !note.isDeleted && handleNoteSelect(note.id)}
                      className={cn(
                        "w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        note.isDeleted 
                          ? "text-gray-400 bg-gray-100 line-through opacity-70 pointer-events-none" 
                          : selectedNoteId === note.id
                            ? "bg-[#f0f0ef] text-[#32302c]"
                            : "text-[#5f5e5b]",
                        !note.isDeleted && "hover:bg-[#f0f0ef] hover:text-[#32302c]"
                      )}
                      style={{ fontWeight: 500 }}
                    >
                      <FileText className="w-4 h-4 flex-shrink-0" style={{ color: note.isDeleted ? '#ccc' : '#9e9e9b' }} />
                      <span className="truncate">{note.title || "Untitled"}</span>
                      {note.isPinned && !note.isDeleted && (
                        <span className="ml-auto text-xs text-blue-500">Saved</span>
                      )}
                      {note.isDeleted && (
                        <span className="ml-auto text-xs text-red-400">Pending delete</span>
                      )}
                    </button>
                    {/* Only show the "Add new" button after the last non-deleted note */}
                    {idx === notes.filter(n => !n.isDeleted).length - 1 && (
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            createNewNote();
                            setIsSidebarOpen(false);
                          }}
                          className="flex w-full items-center gap-2 text-[#5f5e5b] text-sm hover:text-[#32302c] hover:bg-[#f0f0ef] transition-colors px-2 py-1 rounded-[6px]"
                          disabled={isLoading}
                          style={{ outline: 'none', fontWeight: 500 }}
                        >
                          <Plus className="w-4 h-4" style={{ color: '#b7b6b4' }} />
                          <span>Add new</span>
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-[#F7F7F7] dark:bg-[#1F1F1F]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-[280px] min-w-[280px] bg-white dark:bg-[#2F2F2F] shadow-sm">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden absolute top-4 left-4 z-10 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px] sm:w-[280px]">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full overflow-hidden bg-white dark:bg-[#2F2F2F] md:rounded-l-xl md:m-2 shadow-sm">
        {isLoading ? (
          <div className="flex-1 p-4">
            {/* Loading header */}
            <div className="flex items-center justify-between mb-8">
              <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
              </div>
            </div>
            {/* Loading editor */}
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ) : selectedNote ? (
          <>
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={localNote.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Untitled"
                  className="text-xl font-medium bg-transparent border-0 p-0 focus-visible:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-600"
                />
              </div>
              <div className="flex items-center gap-2">
                {viewingHistoricalVersion ? (
                  <>
                    <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-sm font-medium flex items-center mr-1">
                      Editing historical version
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={applyHistoricalVersion}
                      disabled={isSaving}
                      className="bg-green-600 hover:bg-green-700 text-white border-0"
                    >
                      Save changes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelHistoricalVersion}
                      className="border-gray-300"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    {hasUnsavedChanges && !isSaving && (
                      <span className="text-xs text-gray-400 mr-1">Unsaved changes</span>
                    )}
                    {isSaving && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Saving to IPFS...
                      </span>
                    )}
                    {selectedNoteId && <NoteHistory noteId={selectedNoteId} />}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveToBlockchain}
                      disabled={isSaving}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-600 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => selectedNote && deleteNote(selectedNote.id)}
                      disabled={isSaving}
                      className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-red-500 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {viewingHistoricalVersion && (
                  <div className="bg-amber-50 text-amber-700 px-4 py-2 text-sm m-2 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium mb-1">Editing historical version</p>
                      <p>Your changes to this historical version will be preserved even if you switch notes.</p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => applyHistoricalVersion()}
                      >
                        Save changes
                      </Button>
                    </div>
                  </div>
                )}
                <div className="px-8 pt-0 pb-6">
                  <SlateEditor
                    value={localNote.content}
                    onChange={handleContentChange}
                  />
                </div>
              </ScrollArea>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-500 dark:text-gray-400 p-4 text-center">
            <div>
              <h3 className="text-xl font-medium mb-2">No note selected</h3>
              <p className="text-sm">Select a note or create a new one to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 