import { useEffect } from 'react';

type ShortcutCallback = (e: KeyboardEvent) => void;

export interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  modKey?: boolean;
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
        const isSpace = shortcut.key.toLowerCase() === 'space' || shortcut.key === ' ';
        const matchKey = isSpace
          ? e.key === ' ' || e.code === 'Space'
          : e.key.toLowerCase() === shortcut.key.toLowerCase();

        const matchMod = shortcut.modKey ? (e.metaKey || e.ctrlKey) : true;
        const matchCtrl = shortcut.modKey ? true : (!!shortcut.ctrlKey === e.ctrlKey);
        const matchMeta = shortcut.modKey ? true : (!!shortcut.metaKey === e.metaKey);
        const matchShift = !!shortcut.shiftKey === e.shiftKey;
        const matchAlt = !!shortcut.altKey === e.altKey;

        if (matchKey && matchMod && matchCtrl && matchMeta && matchShift && matchAlt) {
          // If typing in an input, only allow shortcuts that use modifiers (like Mod+Space) or Escape
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
