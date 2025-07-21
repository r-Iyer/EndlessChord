import { useEffect, useState, useRef } from 'react';
import { renameAlbum, deleteAlbum } from '../services/albumService';
import { getAlbums } from '../services/albumService';

/**
 * Manages dropdown open/close, focus, editing album names, keyboard navigation.
 */
export default function useAlbumDropdownHandlers({
  albums,
  triggerRef,
  dropdownRef,
  setAlbums,
}) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [editingAlbumId, setEditingAlbumId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const itemRefs = useRef([]);

  
  useEffect(() => {
    if (open) {
      getAlbums().then(fetchedAlbums => {
        setAlbums(fetchedAlbums || []);
      }).catch(err => console.error('Failed to refresh albums:', err));
    }
  }, [open, setAlbums]);

  // Sync itemRefs with albums
  useEffect(() => {
    itemRefs.current = Array(albums.length).fill().map((_, i) => itemRefs.current[i] || null);
  }, [albums.length]);

  // Outside click closes dropdown and edit
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setOpen(false);
        setEditingAlbumId(null);
      } else if (editingAlbumId && !e.target.closest('.album-edit-input')) {
        setEditingAlbumId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef, editingAlbumId]);

  // Close edit mode on dropdown close
  useEffect(() => {
    if (!open) setEditingAlbumId(null);
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    const handleNav = (e) => {
      if (!open) return;
      if (['ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (e.key === 'ArrowUp' && focusedIndex === 0) {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      let next = focusedIndex;
      if (e.key === 'ArrowDown') next = (focusedIndex + 1) % albums.length;
      else if (e.key === 'ArrowUp') next = (focusedIndex - 1 + albums.length) % albums.length;
      else return;

      setFocusedIndex(next);
      itemRefs.current[next]?.focus();
    };

    if (open) document.addEventListener('keydown', handleNav, true);
    return () => document.removeEventListener('keydown', handleNav, true);
  }, [open, focusedIndex, albums.length, triggerRef]);

  useEffect(() => {
    if (open && albums.length) {
      setFocusedIndex(0);
      requestAnimationFrame(() => itemRefs.current[0]?.focus());
    } else {
      setFocusedIndex(-1);
    }
  }, [open, albums.length]);

  const startEditAlbum = (album) => {
    setEditingAlbumId(album._id);
    setEditingName(album.name);
  };

  const finishEditAlbum = async (album) => {
    const trimmed = editingName.trim();
    if (!trimmed || trimmed === album.name) return;
    const updated = await renameAlbum(album._id, trimmed);
    if (updated) {
      setAlbums(albums.map(a => a._id === album._id ? { ...a, name: trimmed } : a));
    }
    setEditingAlbumId(null);
  };

  const handleEditKeyDown = (e, album) => {
    e.stopPropagation();
    if (e.key === 'Enter') finishEditAlbum(album);
    if (e.key === 'Escape') setEditingAlbumId(null);
  };

  const handleDeleteAlbum = async (album) => {
    await deleteAlbum(album._id);
    setAlbums(albums.filter(a => a._id !== album._id));
  };

  return {
    open,
    setOpen,
    focusedIndex,
    itemRefs,
    editingAlbumId,
    editingName,
    setEditingName,
    startEditAlbum,
    finishEditAlbum,
    handleEditKeyDown,
    handleDeleteAlbum,
    setEditingAlbumId,
  };
}
