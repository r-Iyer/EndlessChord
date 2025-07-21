import { useState } from 'react';
import SearchBar from '../SearchBar/SearchBar';
import UserProfile from '../UserProfile/UserProfile';
import ChannelSelector from '../ChannelSelector/ChannelSelector';
import LanguageDropdown from '../LanguageDropdown/LanguageDropdown';
															
import './Header.css';
import useChannelAlbumHandlers from '../../hooks/useChannelAlbumHandlers';

/**
 * Header component contains:
 * - Search bar
 * - Language dropdown
 * - User profile
 * - Channel selector (with Firestick keyboard nav)
 */
export default function Header({
  isFullscreen,
  setShowAuthModal,
  searchQuery,
  handleSearch,
  user,
  handleLogout,
  playFavorites,
  channels,
  albums,
  setAlbums,
  currentSelection,
  onSelect,
  isSearchMode,
  setUserInteracted,
  setBackendError,
  clearSearch,
  setChannelNameInURL,
  selectChannel,
  channelSelectorRef,
  selectAlbum		  
			  
}) {
  const [languageFilter, setLanguageFilter] = useState('');
  const { handleSelect } = useChannelAlbumHandlers({
    clearSearch,
    setUserInteracted,
    setBackendError,
    setChannelNameInURL,
    selectChannel,
    selectAlbum,
    onSelect,
  });
  
  // Get unique languages from channels and capitalize first letter
  const languages = [...new Set(channels.map(ch => ch.language))]
  .sort()
  .map(lang => ({ value: lang, label: lang.charAt(0).toUpperCase() + lang.slice(1) }));
  
  // Filter channels based on selected language
  const filteredChannels = languageFilter
  ? channels.filter(ch => ch.language === languageFilter)
  : channels;
  
  
  const handleKeyDown = (e) => {
    if (e.code === 'ArrowDown') {
      channelSelectorRef?.current?.focusFirstButton?.();
    }
  };
  
  return (
    <header className={`app-header ${isFullscreen ? 'app-header--hidden' : ''}`}>
    <div className="header-container" onKeyDown={handleKeyDown}>
    <div className="layout-column-gap">
    {/* Top row: Search Bar, Language Filter, and User Profile */}
    <div className="flex gap-4 items-center">
    <div className="flex-1">
    <SearchBar
    onSearch={handleSearch}
    searchQuery={searchQuery}
    className="full-width"
    />
    </div>
    <LanguageDropdown
    languages={languages}
    selectedValue={languageFilter}
    onSelect={setLanguageFilter}
    placeholder="All Languages"
    />
    <div className="no-shrink">
    <UserProfile
    user={user}
    onLogout={handleLogout}
    onShowAuth={() => setShowAuthModal(true)}
    onPlayFavorites={() => {
      clearSearch();
      playFavorites();
    }}
    />
    </div>
    </div>
    
    <div className="full-width">
    <ChannelSelector
    ref={channelSelectorRef}
    channels={filteredChannels}
    albums={albums}
    currentSelection={currentSelection}
    onSelect={handleSelect}
    clearSearch={clearSearch}
    disabled={isSearchMode}
    setAlbums={setAlbums}
    />
    </div>
    </div>
    </div>
    </header>
  );
}
