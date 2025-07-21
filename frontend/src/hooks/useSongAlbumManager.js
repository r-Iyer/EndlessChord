import { useEffect, useRef, useState } from 'react';
import AuthService from '../services/authService';
import { getAlbums, addSongToAlbum, removeSongFromAlbum, createAlbum } from '../services/albumService';

export default function useSongAlbumManager(user, currentSong) {
  const [albums, setAlbums] = useState([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [songAlbumMap, setSongAlbumMap] = useState({});
  const wrapper = useRef();
  
  // Function to fetch albums and update song mapping
  const fetchAndMapAlbums = async () => {
    if (user && !AuthService.isGuest) {
      const albums = await getAlbums();
      setAlbums(albums);
      
      if (currentSong) {
        const map = {};
        albums.forEach(album => {
          if (album.songs?.some(song => song.songId === currentSong._id)) {
            map[album._id] = true;
          }
        });
        setSongAlbumMap(map);
      }
    }
  };
  
  // Fetch albums when user or song changes
  useEffect(() => {
    fetchAndMapAlbums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentSong]);
  
  // ✅ Fetch latest albums when dropdown opens
  useEffect(() => {
    if (open) {
      fetchAndMapAlbums();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  
  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapper.current && !wrapper.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  
  const onToggleAlbum = async (albumId) => {
    if (!currentSong) return;
    const alreadyAdded = songAlbumMap[albumId];
    
    if (alreadyAdded) {
      await removeSongFromAlbum(albumId, currentSong._id);
    } else {
      await addSongToAlbum(albumId, currentSong._id);
    }
    
    setSongAlbumMap(prev => ({ ...prev, [albumId]: !alreadyAdded }));
  };
  
  const onCreate = async () => {
    if (!currentSong || !newName.trim()) return;
    await createAlbum(newName.trim(), currentSong._id);
    await fetchAndMapAlbums();
    setNewName('');
  };
  
const handleEditKeyDown = (e) => {
  e.stopPropagation();
  if (e.key === 'Enter') {
    setNewName(e.target.value);
  } else if (e.key === 'Escape') {
    setOpen(false); // close dropdown
  }
};

  
  return {
    albums,
    setAlbums,
    open,
    setOpen,
    newName,
    setNewName,
    songAlbumMap,
    wrapper,
    onToggleAlbum,
    onCreate,
    handleEditKeyDown
  };
}
