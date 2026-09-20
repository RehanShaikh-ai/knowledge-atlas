import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Note } from '@/types/note';
import { updateNote, deleteNote } from '@/api/notes';
import {
  Edit3,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Trash2,
  Copy,
  X,
  Link,
  LucideIcon,
} from 'lucide-react';

interface RadialMenuProps {
  note: Note;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: (note: Note) => void;
  onNoteUpdated?: (note: Note) => void;
  onNoteDeleted?: () => void;
}

interface RadialItem {
  id: string;
  icon: LucideIcon;
  label: string;
  angle: number;
  colorClass: string;
  iconColor: string;
}

const RADIUS = 62;

const getItems = (note: Note): RadialItem[] => [
  {
    id: 'edit',
    icon: Edit3,
    label: 'Open',
    angle: 90,
    colorClass: 'accent',
    iconColor: 'var(--blue)',
  },
  {
    id: 'pin',
    icon: note.is_pinned ? PinOff : Pin,
    label: note.is_pinned ? 'Unpin' : 'Pin',
    angle: 30,
    colorClass: 'warning',
    iconColor: 'var(--yellow)',
  },
  {
    id: 'copy',
    icon: Copy,
    label: 'Copy ID',
    angle: -30,
    colorClass: '',
    iconColor: 'var(--mauve)',
  },
  {
    id: 'archive',
    icon: note.is_archived ? ArchiveRestore : Archive,
    label: note.is_archived ? 'Restore' : 'Archive',
    angle: -90,
    colorClass: '',
    iconColor: 'var(--overlay2)',
  },
  {
    id: 'delete',
    icon: Trash2,
    label: 'Delete',
    angle: -150,
    colorClass: 'danger',
    iconColor: 'var(--red)',
  },
  {
    id: 'link',
    icon: Link,
    label: 'Links',
    angle: 150,
    colorClass: 'accent',
    iconColor: 'var(--teal)',
  },
];

const toRad = (deg: number) => (deg * Math.PI) / 180;

export const RadialMenu: React.FC<RadialMenuProps> = ({
  note,
  position,
  onClose,
  onEdit,
  onNoteUpdated,
  onNoteDeleted,
}) => {
  // Handle Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleAction = useCallback(
    async (id: string) => {
      onClose();
      switch (id) {
        case 'edit':
          onEdit(note);
          break;

        case 'pin': {
          try {
            const updated = await updateNote(note.id, { is_pinned: !note.is_pinned });
            onNoteUpdated?.(updated);
          } catch {
            // Backend not implemented
          }
          break;
        }

        case 'copy':
          try {
            await navigator.clipboard.writeText(note.id);
          } catch {
            // Handle clipboard constraints
          }
          break;

        case 'archive': {
          try {
            const updated = await updateNote(note.id, { is_archived: !note.is_archived });
            onNoteUpdated?.(updated);
          } catch {
            // Backend not implemented
          }
          break;
        }

        case 'delete': {
          if (!window.confirm(`Delete "${note.title}"? This cannot be undone.`)) return;
          try {
            await deleteNote(note.id);
            onNoteDeleted?.();
          } catch {
            // Backend not implemented
          }
          break;
        }

        case 'link':
          // Open editor with links panel
          onEdit(note);
          break;
      }
    },
    [note, onClose, onEdit, onNoteUpdated, onNoteDeleted]
  );

  const items = getItems(note);

  // Clamp to viewport
  const margin = 90;
  const cx = Math.max(margin, Math.min(window.innerWidth - margin, position.x));
  const cy = Math.max(margin, Math.min(window.innerHeight - margin, position.y));

  return createPortal(
    <div
      className="radial-overlay"
      onClick={onClose}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-label={`Quick actions for: ${note.title}`}
    >
      {/* The ring — click events stopPropagation so overlay doesn't close it */}
      <div
        className="radial-ring"
        style={{ left: cx, top: cy }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle connector lines */}
        {items.map((item) => (
          <div
            key={`conn-${item.id}`}
            className="radial-connector"
            style={{
              width: RADIUS - 17,
              transform: `rotate(${-item.angle + 180}deg)`,
            }}
            aria-hidden="true"
          />
        ))}

        {/* Action items */}
        {items.map((item) => {
          const rad = toRad(item.angle);
          const ix = Math.cos(rad) * RADIUS;
          const iy = -Math.sin(rad) * RADIUS;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`radial-item-btn ${item.colorClass}`}
              style={{
                left: ix,
                top: iy,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleAction(item.id);
              }}
              title={item.label}
              aria-label={item.label}
            >
              <Icon size={15} color={item.iconColor} aria-hidden="true" />
              <span className="radial-item-label">{item.label}</span>
            </button>
          );
        })}

        {/* Center close button */}
        <button
          type="button"
          className="radial-center-btn"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close menu"
        >
          <X size={13} aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body
  );
};
