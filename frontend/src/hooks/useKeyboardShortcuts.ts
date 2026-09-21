import { useEffect } from 'react';

type ShortcutCallback = (e: KeyboardEvent) => void;

export interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: ShortcutCallback;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Determine if focus is within an input field
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      for (const shortcut of shortcuts) {
        const matchKey = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchCtrl = !!shortcut.ctrlKey === e.ctrlKey;
        const matchMeta = !!shortcut.metaKey === e.metaKey;
        const matchShift = !!shortcut.shiftKey === e.shiftKey;
        const matchAlt = !!shortcut.altKey === e.altKey;

        if (matchKey && matchCtrl && matchMeta && matchShift && matchAlt) {
          // If typing in an input, only allow shortcuts that use modifiers (like Cmd+K) or Escape
          if (isInput && e.key !== 'Escape' && !e.metaKey && !e.ctrlKey && !e.altKey) {
            continue;
          }
          
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          
          shortcut.handler(e);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
