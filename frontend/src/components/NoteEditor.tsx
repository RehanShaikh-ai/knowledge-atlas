import React, { useState, useEffect } from 'react';
import { Note } from '@/types/note';
import { Tag } from '@/types/tag';
import { createNote, updateNote, deleteNote } from '@/api/notes';
import { addTag, removeTag } from '@/api/tags';
import { Pin, Archive, Trash2, Save, X, Eye, Edit3, Tag as TagIcon, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function renderMarkdown(content: string) {
  let html = content
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-6 mb-4">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-5 mb-3">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" class="text-indigo-600 hover:underline">$1</a>')
    .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-slate-300 pl-4 italic my-4">$1</blockquote>')
    .replace(/\n\n/g, '</p><p class="my-3">');
  
  return `<div class="prose max-w-none text-slate-700">${html}</div>`;
}

interface NoteEditorProps {
  workspaceId: string;
  userId?: string; 
  initialNote?: Note;
  onClose: () => void;
  onSaved: (note: Note) => void;
  onDeleted: (noteId: string) => void;
  className?: string;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ 
  workspaceId,
  userId = 'default-user-id',
  initialNote, 
  onClose, 
  onSaved,
  onDeleted,
  className
}) => {
  const isEditing = !!initialNote;
  
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [isPinned, setIsPinned] = useState(initialNote?.is_pinned || false);
  const [isArchived, setIsArchived] = useState(initialNote?.is_archived || false);
  const [tags, setTags] = useState<Tag[]>(initialNote?.tags || []);
  
  const [isPreview, setIsPreview] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const isDirty = 
    title !== (initialNote?.title || '') || 
    content !== (initialNote?.content || '') ||
    isPinned !== (initialNote?.is_pinned || false) ||
    isArchived !== (initialNote?.is_archived || false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleClose = () => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError(new Error("Title is required"));
      return;
    }
    
    setError(null);
    setIsSaving(true);
    
    try {
      let savedNote: Note;
      if (isEditing) {
        savedNote = await updateNote(initialNote.id, {
          title,
          content,
          is_pinned: isPinned,
          is_archived: isArchived
        });
      } else {
        savedNote = await createNote(workspaceId, {
          title,
          content,
          created_by: userId
        });
        
        if (isPinned || isArchived) {
           savedNote = await updateNote(savedNote.id, { is_pinned: isPinned, is_archived: isArchived });
        }
      }
      
      onSaved({ ...savedNote, tags });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to save note"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    
    if (window.confirm("Are you sure you want to delete this note? This cannot be undone.")) {
      setIsDeleting(true);
      setError(null);
      try {
        await deleteNote(initialNote.id);
        onDeleted(initialNote.id);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to delete note"));
        setIsDeleting(false);
      }
    }
  };

  const handleAddTag = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tagName = tagInput.trim().toLowerCase();
      
      if (!isEditing) {
        setError(new Error("Please save the note first before adding tags."));
        return;
      }

      try {
        const newTag = await addTag(initialNote.id, tagName);
        if (!tags.some(t => t.id === newTag.id)) {
            setTags([...tags, newTag]);
        }
        setTagInput('');
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to add tag"));
      }
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!isEditing) return;
    try {
      await removeTag(initialNote.id, tagId);
      setTags(tags.filter(t => t.id !== tagId));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to remove tag"));
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden", className)}>
      <header className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-1 sm:gap-2">
            <button 
                onClick={() => setIsPinned(!isPinned)}
                className={cn("p-2 rounded-lg transition-colors", isPinned ? "bg-amber-100 text-amber-600 shadow-sm" : "text-slate-400 hover:bg-slate-200 hover:text-slate-600")}
                title={isPinned ? "Unpin note" : "Pin note"}
            >
                <Pin size={18} className={isPinned ? "fill-current" : ""} />
            </button>
            <button 
                onClick={() => setIsArchived(!isArchived)}
                className={cn("p-2 rounded-lg transition-colors", isArchived ? "bg-slate-200 text-slate-700 shadow-sm" : "text-slate-400 hover:bg-slate-200 hover:text-slate-600")}
                title={isArchived ? "Unarchive note" : "Archive note"}
            >
                <Archive size={18} />
            </button>
            
            <div className="w-px h-6 bg-slate-200 mx-1 sm:mx-2" />
            
            <button
                onClick={() => setIsPreview(!isPreview)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors",
                    isPreview ? "bg-slate-200 text-slate-800 shadow-sm" : "text-slate-600 hover:bg-slate-100"
                )}
            >
                {isPreview ? <><Edit3 size={16} /> <span className="hidden sm:inline">Edit</span></> : <><Eye size={16} /> <span className="hidden sm:inline">Preview</span></>}
            </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
            {isEditing && (
                <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete note"
                >
                    {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>
            )}
            <button 
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all",
                    isDirty 
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:-translate-y-0.5" 
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
            >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save
            </button>
            <button onClick={handleClose} aria-label="Close" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors ml-1">
                <X size={20} />
            </button>
        </div>
      </header>

      {error && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
            {error.message}
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-6 lg:p-10 flex flex-col">
        <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="text-3xl lg:text-4xl font-bold text-slate-900 placeholder:text-slate-300 border-none outline-none bg-transparent mb-6 lg:mb-8 focus:ring-0 w-full"
            readOnly={isPreview}
        />
        
        {isPreview ? (
            <div 
                className="flex-1"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content || '*Empty note*') }} 
            />
        ) : (
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note here... (Markdown supported)"
                className="flex-1 resize-none border-none outline-none bg-transparent text-slate-700 placeholder:text-slate-300 focus:ring-0 leading-relaxed text-lg min-h-[300px]"
            />
        )}
      </main>

      <footer className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3 overflow-x-auto">
        <TagIcon size={16} className="text-slate-400 shrink-0" />
        <div className="flex items-center gap-2 flex-nowrap overflow-x-auto pb-1 sm:pb-0">
            {tags.map(tag => (
                <span key={tag.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold tracking-wide bg-slate-200 text-slate-700 whitespace-nowrap uppercase">
                    {tag.name}
                    {isEditing && (
                        <button onClick={() => handleRemoveTag(tag.id)} aria-label={`Remove tag ${tag.name}`} className="hover:text-red-500 rounded-full hover:bg-slate-300 p-0.5 transition-colors">
                            <X size={12} strokeWidth={3} />
                        </button>
                    )}
                </span>
            ))}
            {isEditing && (
                <input 
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Add tag..."
                    className="text-sm font-medium bg-transparent border-none outline-none w-24 focus:ring-0 placeholder:text-slate-400"
                />
            )}
            {!isEditing && tags.length === 0 && (
                <span className="text-xs font-medium text-slate-400">Save note to add tags</span>
            )}
        </div>
      </footer>
    </div>
  );
};
