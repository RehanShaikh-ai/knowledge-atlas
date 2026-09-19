import React, { useState, useEffect } from 'react';
import { Note } from '@/types/note';
import { Tag } from '@/types/tag';
import { createNote, updateNote, deleteNote } from '@/api/notes';
import { addTag, removeTag } from '@/api/tags';
import { Pin, Archive, Trash2, Save, X, Eye, Edit3, Tag as TagIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function renderMarkdown(content: string) {
  const html = content
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-3 text-slate-100">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-2.5 text-slate-100">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2 text-slate-200">$1</h3>')
    .replace(/\*\*(.*)\*\*/gim, '<strong class="text-slate-100 font-semibold">$1</strong>')
    .replace(/\*(.*)\*/gim, '<em class="text-slate-300">$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" class="text-sky-400 hover:text-sky-300 hover:underline">$1</a>')
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-2 border-sky-500/50 pl-4 italic my-3 text-slate-400 bg-sky-950/10 py-1 rounded-r">$1</blockquote>')
    .replace(/\n\n/g, '</p><p class="my-3 text-slate-300 leading-relaxed">');
  
  return `<div class="max-w-none text-slate-300 text-sm sm:text-base leading-relaxed">${html}</div>`;
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
    <div className={cn("flex flex-col h-full bg-[#0c1017]/95 rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-2xl text-slate-100 overflow-hidden", className)}>
      <header className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-1 sm:gap-2">
            <button 
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={cn(
                    "p-2 rounded-lg transition-colors border text-xs font-medium flex items-center gap-1.5",
                    isPinned 
                        ? "bg-amber-400/15 text-amber-300 border-amber-400/30 shadow-[0_0_10px_rgba(251,191,36,0.15)]" 
                        : "border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
                title={isPinned ? "Unpin note" : "Pin note"}
            >
                <Pin size={16} className={isPinned ? "fill-current" : ""} />
            </button>
            <button 
                type="button"
                onClick={() => setIsArchived(!isArchived)}
                className={cn(
                    "p-2 rounded-lg transition-colors border text-xs font-medium flex items-center gap-1.5",
                    isArchived 
                        ? "bg-purple-400/15 text-purple-300 border-purple-400/30 shadow-[0_0_10px_rgba(192,132,252,0.15)]" 
                        : "border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
                title={isArchived ? "Unarchive note" : "Archive note"}
            >
                <Archive size={16} />
            </button>
            
            <div className="w-px h-5 bg-slate-800 mx-1 sm:mx-2" />
            
            <button
                type="button"
                onClick={() => setIsPreview(!isPreview)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border",
                    isPreview 
                        ? "bg-sky-500/15 text-sky-300 border-sky-500/30 shadow-[0_0_10px_rgba(56,189,248,0.15)]" 
                        : "border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
            >
                {isPreview ? <><Edit3 size={15} /> <span className="hidden sm:inline">Edit</span></> : <><Eye size={15} /> <span className="hidden sm:inline">Preview</span></>}
            </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
            {isEditing && (
                <button 
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                    title="Delete note"
                >
                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
            )}
            <button 
                type="button"
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                    isDirty 
                        ? "bg-sky-500 hover:bg-sky-400 text-slate-950 border-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.35)] hover:-translate-y-0.5" 
                        : "bg-slate-800/40 text-slate-500 border-slate-700/40 cursor-not-allowed"
                )}
            >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save
            </button>
            <button 
                type="button"
                onClick={handleClose} 
                aria-label="Close" 
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors ml-1"
            >
                <X size={18} />
            </button>
        </div>
      </header>

      {error && (
        <div className="m-4 p-3 bg-rose-950/40 border border-rose-800/50 text-rose-300 rounded-lg text-xs font-medium">
            {error.message}
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col">
        <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="text-2xl lg:text-3xl font-bold text-slate-100 placeholder:text-slate-600 border-none outline-none bg-transparent mb-5 focus:ring-0 w-full tracking-tight"
            readOnly={isPreview}
        />
        
        {isPreview ? (
            <div 
                className="flex-1 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content || '*Empty note*') }} 
            />
        ) : (
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note here... (Markdown supported)"
                className="flex-1 resize-none border-none outline-none bg-transparent text-slate-200 placeholder:text-slate-600 focus:ring-0 leading-relaxed text-sm sm:text-base min-h-[300px]"
            />
        )}
      </main>

      <footer className="p-3.5 border-t border-slate-800/80 bg-slate-900/40 backdrop-blur-md flex items-center gap-3 overflow-x-auto">
        <TagIcon size={15} className="text-slate-500 shrink-0" />
        <div className="flex items-center gap-2 flex-nowrap overflow-x-auto pb-1 sm:pb-0">
            {tags.map(tag => (
                <span key={tag.id} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-medium tracking-wide bg-sky-950/50 border border-sky-500/30 text-sky-300 whitespace-nowrap lowercase">
                    {tag.name}
                    {isEditing && (
                        <button 
                            type="button"
                            onClick={() => handleRemoveTag(tag.id)} 
                            aria-label={`Remove tag ${tag.name}`} 
                            className="hover:text-rose-400 rounded-full hover:bg-rose-500/20 p-0.5 transition-colors"
                        >
                            <X size={11} strokeWidth={2.5} />
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
                    className="text-xs font-mono bg-transparent border-none outline-none w-24 focus:ring-0 text-slate-300 placeholder:text-slate-600"
                />
            )}
            {!isEditing && tags.length === 0 && (
                <span className="text-xs font-mono text-slate-500">Save note to add tags</span>
            )}
        </div>
      </footer>
    </div>
  );
};
