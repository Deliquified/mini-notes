'use client';

import React from 'react';
import { useNotes } from './providers/notesProvider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { History, RotateCcw } from 'lucide-react';

type VersionInfo = {
  cid: string;
  timestamp: number;
  title: string;
};

export function NoteHistory({ noteId }: { noteId: string }) {
  const { 
    getNoteHistory, 
    restoreNoteVersion, 
    viewingHistoricalVersion,
    applyHistoricalVersion,
    cancelHistoricalVersion,
    isSaving, 
    isLoading 
  } = useNotes();
  const [open, setOpen] = React.useState(false);

  const history = getNoteHistory(noteId) || [];
  const hasHistory = history && history.length > 0;
  const isViewingHistory = viewingHistoricalVersion && viewingHistoricalVersion.noteId === noteId;

  // Format the date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRestore = async (versionCid: string) => {
    await restoreNoteVersion(noteId, versionCid);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-1">
      {isViewingHistory && (
        <div className="flex items-center gap-1">
          <div className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded mr-1">
            Editing historical version
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 text-gray-600"
            onClick={cancelHistoricalVersion}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      )}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            disabled={!hasHistory || isLoading || isSaving}
            className="gap-1"
            title={!hasHistory ? "No history available" : "View note history"}
          >
            <History className="h-4 w-4" />
            <span className="sr-only md:not-sr-only md:inline">History</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Note History</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {hasHistory ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {history.map((version: VersionInfo, index: number) => (
                    <div 
                      key={version.cid || index} 
                      className="p-3 border rounded-md transition-colors hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-sm truncate flex-1">{version.title}</h3>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 gap-1" 
                          onClick={() => handleRestore(version.cid)}
                          disabled={isLoading || isSaving || !version.cid}
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(version.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No history available for this note yet.
                <br />
                History is created when you save notes to the blockchain.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 