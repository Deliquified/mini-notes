'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useUpProvider } from "./upProvider";
import { ERC725 } from '@erc725/erc725.js';
import NotesSchema from '@/schemas/NotesSchema';
import { createPublicClient, http } from 'viem';
import { lukso } from 'viem/chains';
import toast from 'react-hot-toast';
import { uploadMetadataToIPFS } from "@/app/helper/pinata";
import { pinata } from "@/app/pinata/config";

interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  isPinned: boolean;
  createdAt?: number;
  previousVersions?: Array<{
    cid: string;
    timestamp: number;
    title: string; // Store basic metadata about the version
  }>;
  isDeleted?: boolean;
}

interface NotesContextType {
  notes: Note[];
  selectedNoteId: string | null;
  isLoading: boolean;
  error: string | null;
  setSelectedNoteId: (id: string | null) => void;
  createNewNote: () => void;
  updateNote: (noteId: string, title: string, content: string) => void;
  deleteNote: (noteId: string) => void;
  saveNoteWithContent: (noteId: string, title: string, content: string) => Promise<void>;
  isSaving: boolean;
  getNoteHistory: (noteId: string) => Array<{cid: string, timestamp: number, title: string}> | undefined;
  restoreNoteVersion: (noteId: string, versionCid: string) => Promise<void>;
  viewingHistoricalVersion: {
    noteId: string;
    content: any;
    title: string;
    originalVersion: any;
  } | null;
  applyHistoricalVersion: (updateOptions?: {
    updateContentOnly?: boolean;
    updateTitleOnly?: boolean;
    newContent?: string;
    newTitle?: string;
  }) => Promise<void>;
  cancelHistoricalVersion: () => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'lukso-notes';

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const { client, accounts, walletConnected } = useUpProvider();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedCid, setLastSavedCid] = useState<string>("");
  const [currentIpfsCid, setCurrentIpfsCid] = useState<string>("");
  const [viewingHistoricalVersion, setViewingHistoricalVersion] = useState<{
    noteId: string;
    content: any;
    title: string;
    originalVersion: any;
  } | null>(null);
  // Map to preserve historical edits across note switches
  const [historicalVersionsMap, setHistoricalVersionsMap] = useState<{
    [noteId: string]: {
      content: any;
      title: string;
      originalVersion: any;
    };
  }>({});

  // Load notes from localStorage on initial mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }

    // Also load any saved historical versions
    const savedHistoricalVersions = localStorage.getItem(LOCAL_STORAGE_KEY + "_historical");
    if (savedHistoricalVersions) {
      setHistoricalVersionsMap(JSON.parse(savedHistoricalVersions));
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  // Save historical versions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY + "_historical", JSON.stringify(historicalVersionsMap));
  }, [historicalVersionsMap]);

  // Function to fetch pinned notes from IPFS when wallet connects
  useEffect(() => {
    if (walletConnected && accounts?.[0]) {
      fetchPinnedNotes();
    }
  }, [walletConnected, accounts]);

  const fetchPinnedNotes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("🔄 Starting to fetch pinned notes from smart contract");
      
      if (!accounts?.[0]) {
        console.log("⚠️ No account connected, skipping fetch");
        return;
      }
      
      console.log("📝 Using account:", accounts[0]);

      // Create ERC725 instance
      const erc725js = new ERC725(
        NotesSchema,
        accounts[0],
        'https://42.rpc.thirdweb.com',
        {
          ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
        }
      );

      // Fetch and decode data directly using ERC725
      const encodedData = await erc725js.getData();
      console.log("📦 Encoded data from smart contract:", encodedData);

      // Check if we have data
      //@ts-expect-error
      if (!encodedData || !encodedData[0] || !encodedData[0].value || !encodedData[0].value.url) {
        console.log("ℹ️ No notes data found in smart contract");
        setIsLoading(false);
        return;
      }

      // Extract IPFS hash from the URL
      //@ts-expect-error
      const ipfsUrl = encodedData[0].value.url;
      console.log("🔗 IPFS URL found:", ipfsUrl);
      
      // Extract CID from ipfs:// URL
      const ipfsHash = ipfsUrl.replace('ipfs://', '');
      console.log("📋 IPFS hash to fetch:", ipfsHash);
      
      // Store the current IPFS hash for version history
      setCurrentIpfsCid(ipfsHash);

      // Fetch notes from our server API instead of directly from Pinata
      console.log("⬇️ Fetching notes from API endpoint");
      const response = await fetch(`/api/pinataGetFile?cid=${ipfsHash}`);
      
      if (!response.ok) {
        console.error(`❌ Failed to fetch notes: ${response.statusText}`);
        throw new Error(`Failed to fetch notes: ${response.statusText}`);
      }
      
      const fetchedData = await response.json();
      console.log("📚 Fetched data:", fetchedData);

      // Handle different possible formats
      let fetchedNotes: Note[];
      
      if (Array.isArray(fetchedData)) {
        // Direct array of notes (preferred format)
        fetchedNotes = fetchedData.map((note: Note) => ({
          ...note,
          isPinned: true
        }));
      } else if (fetchedData.id && fetchedData.title) {
        // Single note object
        fetchedNotes = [{
          ...fetchedData,
          isPinned: true
        }];
      } else if (fetchedData.notes && Array.isArray(fetchedData.notes)) {
        // Object containing notes array
        fetchedNotes = fetchedData.notes.map((note: Note) => ({
          ...note,
          isPinned: true
        }));
      } else {
        console.error("❌ Invalid notes data format");
        console.error("Received:", fetchedData);
        throw new Error("Invalid notes data format");
      }
      
      console.log("📝 Extracted notes:", fetchedNotes);

      // Merge with local notes, preferring pinned versions
      const localNotes = notes.filter(note => 
        !fetchedNotes.some((fetchedNote: Note) => fetchedNote.id === note.id)
      );
      
      const mergedNotes = [...fetchedNotes, ...localNotes];
      console.log("🔄 Final merged notes:", mergedNotes);
      
      setNotes(mergedNotes);
    } catch (err) {
      console.error('❌ Error fetching notes:', err);
      setError('Failed to load pinned notes');
    } finally {
      setIsLoading(false);
      console.log("🏁 Finished fetching pinned notes");
    }
  };

  const createNewNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled Note',
      content: JSON.stringify([{ type: 'paragraph', children: [{ text: '' }] }]),
      lastModified: Date.now(),
      isPinned: false
    };

    setNotes(prev => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
  };

  const updateNote = (noteId: string, title: string, content: string) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId
        ? { ...note, title, content, lastModified: Date.now() }
        : note
    ));
  };

  const deleteNote = async (noteId: string) => {
    // Ask for confirmation
    if (!window.confirm("Are you sure you want to delete this note? This action cannot be undone once you save to blockchain.")) {
      return;
    }
    
    // Mark the note as deleted (but don't remove it yet until saved to blockchain)
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, isDeleted: true }
        : note
    ));
    
    // If the deleted note was selected, clear the selection
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }
    
    toast.success("Note marked for deletion. Save to blockchain to make this permanent.");
  };

  const saveNoteWithContent = async (noteId: string, title: string, content: string) => {
    if (!client || !accounts?.[0]) {
      toast.error('Please connect your wallet to save notes');
      console.log("❌ Save failed: No wallet connected");
      return;
    }

    console.log("🔄 Starting save to IPFS with explicit content");
    
    try {
      setIsSaving(true);
      
      // First get a reference to the current note before updating
      const currentNote = notes.find(n => n.id === noteId);
      let currentVersions = currentNote?.previousVersions || [];
      
      // Update the note with the provided content if it exists and is not marked for deletion
      if (currentNote && !currentNote.isDeleted) {
        updateNote(noteId, title, content);
      }
      
      // Filter out notes marked for deletion
      const notesToSave = notes
        .filter(note => !note.isDeleted)
        .map(note => {
          if (note.id === noteId && !note.isDeleted) {
            // Reference to previous IPFS hash if this note was previously pinned
            const previousVersions = [...currentVersions];
            
            // If the note was already pinned, add the current version to history
            if (note.isPinned && currentIpfsCid) {
              console.log("📝 Adding version to history with CID:", currentIpfsCid);
              previousVersions.push({
                cid: currentIpfsCid,
                timestamp: Date.now(),
                title: currentNote?.title || "Unknown"
              });
            }
            
            return {
              id: noteId,
              title: title,
              content: content,
              lastModified: Date.now(),
              isPinned: true,
              createdAt: note.createdAt || Date.now(),
              previousVersions
            };
          }
          return note;
        });
      
      // Use a direct array of notes, following LSP28TheGrid format
      console.log("⬆️ Uploading notes array to IPFS...");
      const ipfsHash = await uploadMetadataToIPFS(notesToSave);
      console.log("✅ IPFS upload successful! Hash:", ipfsHash);

      // Update our stored CID for the next save
      setCurrentIpfsCid(ipfsHash);

      // Update note as pinned in local state and remove notes marked for deletion
      setNotes(prev => prev
        .filter(note => !note.isDeleted)
        .map(n => n.id === noteId ? { ...n, isPinned: true } : n)
      );

      // Create ERC725 instance for encoding
      const erc725 = new ERC725(NotesSchema);

      // Encode the data with VerifiableURI format
      const encodedData = erc725.encodeData([{
        keyName: 'Notes',
        value: {
          json: notesToSave,
          url: `ipfs://${ipfsHash}`,
        },
      }]);

      console.log("🔑 Schema key:", NotesSchema[0].key);
      console.log("🔑 Encoded value:", encodedData.values[0]);

      // Update the smart contract with the new hash
      await client.writeContract({
        address: accounts[0],
        abi: [{
          name: "setData",
          type: "function",
          inputs: [
            { name: "key", type: "bytes32" },
            { name: "value", type: "bytes" }
          ],
          outputs: [],
          stateMutability: "payable"
        }],
        functionName: "setData",
        args: [
          NotesSchema[0].key as `0x${string}`,
          encodedData.values[0] as `0x${string}`
        ],
        account: accounts[0],
        chain: lukso
      });

      toast.success('Notes saved to blockchain!');
      console.log("🎉 Full save process completed successfully");
    } catch (err) {
      console.error('Error saving notes:', err);
      console.log("❌ Save process failed with error:", err);
      toast.error('Failed to save notes to blockchain');
    } finally {
      setIsSaving(false);
      console.log("🏁 Save process finished, isSaving set to false");
    }
  };

  const getNoteHistory = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    return note?.previousVersions;
  };

  const restoreNoteVersion = async (noteId: string, versionCid: string) => {
    try {
      setIsLoading(true);
      
      // Fetch the specific version from IPFS
      const response = await fetch(`/api/pinataGetFile?cid=${versionCid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch version: ${response.statusText}`);
      }
      
      const versionData = await response.json();
      
      // Find the specific note in the historical version
      let historicalNote: Note | undefined;
      
      if (Array.isArray(versionData)) {
        historicalNote = versionData.find((note: Note) => note.id === noteId);
      } else if (versionData.notes && Array.isArray(versionData.notes)) {
        historicalNote = versionData.notes.find((note: Note) => note.id === noteId);
      }
      
      if (!historicalNote) {
        throw new Error("Note not found in the historical version");
      }
      
      // Get the current note for comparison
      const currentNote = notes.find(n => n.id === noteId);
      
      if (currentNote) {
        // Store the historical version in both the view state and the persistent map
        const historicalVersionData = {
          content: historicalNote.content,
          title: historicalNote.title || "",
          originalVersion: {
            content: currentNote.content,
            title: currentNote.title
          }
        };
        
        // Update current view if this is the selected note
        setViewingHistoricalVersion({
          noteId: noteId,
          ...historicalVersionData
        });
        
        // Store in the map for persistence between switches
        setHistoricalVersionsMap(prev => ({
          ...prev,
          [noteId]: historicalVersionData
        }));
        
        toast.success("Loaded historical version! Click 'Save changes' to apply these changes or 'Cancel' to revert.");
      }
    } catch (error) {
      console.error("Error restoring version:", error);
      toast.error("Failed to load historical version");
    } finally {
      setIsLoading(false);
    }
  };

  const applyHistoricalVersion = async (updateOptions?: {
    updateContentOnly?: boolean;
    updateTitleOnly?: boolean;
    newContent?: string;
    newTitle?: string;
  }) => {
    // Use the current view state if available, otherwise use the map
    const versionToApply = viewingHistoricalVersion || 
      (selectedNoteId ? { noteId: selectedNoteId, ...historicalVersionsMap[selectedNoteId] } : null);
    
    if (!versionToApply) return;
    
    // If this is just an update to the content or title of the historical version being edited
    if (updateOptions) {
      if (updateOptions.updateContentOnly && updateOptions.newContent) {
        // Only update the content in both view state and map
        const updatedVersion = {
          ...versionToApply,
          content: updateOptions.newContent
        };
        
        // Update view state
        setViewingHistoricalVersion(updatedVersion);
        
        // Update map
        setHistoricalVersionsMap(prev => ({
          ...prev,
          [versionToApply.noteId]: {
            content: updatedVersion.content,
            title: updatedVersion.title,
            originalVersion: updatedVersion.originalVersion
          }
        }));
        
        return; // Don't proceed with saving to blockchain
      }
      
      if (updateOptions.updateTitleOnly && updateOptions.newTitle) {
        // Only update the title in both view state and map
        const updatedVersion = {
          ...versionToApply,
          title: updateOptions.newTitle
        };
        
        // Update view state
        setViewingHistoricalVersion(updatedVersion);
        
        // Update map
        setHistoricalVersionsMap(prev => ({
          ...prev,
          [versionToApply.noteId]: {
            content: updatedVersion.content,
            title: updatedVersion.title,
            originalVersion: updatedVersion.originalVersion
          }
        }));
        
        return; // Don't proceed with saving to blockchain
      }
    }
    
    // This is a full save operation to blockchain
    try {
      setIsSaving(true);
      
      // Save the historical version content as the current note
      await saveNoteWithContent(
        versionToApply.noteId,
        versionToApply.title,
        versionToApply.content
      );
      
      // Clear the historical version view and remove from map
      setViewingHistoricalVersion(null);
      setHistoricalVersionsMap(prev => {
        const newMap = { ...prev };
        delete newMap[versionToApply.noteId];
        return newMap;
      });
      
      toast.success("Successfully applied historical version!");
    } catch (error) {
      console.error("Error applying historical version:", error);
      toast.error("Failed to apply historical version");
    } finally {
      setIsSaving(false);
    }
  };

  const cancelHistoricalVersion = () => {
    if (viewingHistoricalVersion) {
      // Remove from both the view state and the map
      const noteId = viewingHistoricalVersion.noteId;
      setViewingHistoricalVersion(null);
      setHistoricalVersionsMap(prev => {
        const newMap = { ...prev };
        delete newMap[noteId];
        return newMap;
      });
      toast("Reverted to current version");
    }
  };

  useEffect(() => {
    // When selected note changes, check if we have a historical version for it
    if (selectedNoteId && historicalVersionsMap[selectedNoteId]) {
      // Restore the historical version view state when switching back to a note
      setViewingHistoricalVersion({
        noteId: selectedNoteId,
        ...historicalVersionsMap[selectedNoteId]
      });
    } else {
      // No historical version for this note
      setViewingHistoricalVersion(null);
    }
  }, [selectedNoteId, historicalVersionsMap]);

  return (
    <NotesContext.Provider
      value={{
        notes,
        selectedNoteId,
        isLoading,
        error,
        isSaving,
        setSelectedNoteId,
        createNewNote,
        updateNote,
        deleteNote,
        saveNoteWithContent,
        getNoteHistory,
        restoreNoteVersion,
        viewingHistoricalVersion,
        applyHistoricalVersion,
        cancelHistoricalVersion,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}