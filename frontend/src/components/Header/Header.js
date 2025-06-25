import { useState } from 'react';
import SearchBar from '../SearchBar/SearchBar';
import UserProfile from '../UserProfile/UserProfile';
import ChannelSelector, { slugify } from '../ChannelSelector/ChannelSelector';
import LanguageDropdown from '../LanguageDropdown/LanguageDropdown';
import './Header.css';

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
  currentChannel,
  isSearchMode,
  setUserInteracted,
  setBackendError,
  clearSearch,
  setChannelNameInURL,
  selectChannel,
  channelSelectorRef,
}) {
  const [languageFilter, setLanguageFilter] = useState('');

  // Get unique languages from channels and capitalize first letter
  const languages = [...new Set(channels.map(channel => channel.language))]
    .sort()
    .map(lang => ({
      value: lang,
      label: lang.charAt(0).toUpperCase() + lang.slice(1)
    }));

  // Filter channels based on selected language
  const filteredChannels = languageFilter
    ? channels.filter(channel => channel.language === languageFilter)
    : channels;

  const handleChannelSelect = (channelIdOrName) => {
    clearSearch();
    setUserInteracted(true);
    setBackendError(false);

    // Normalize input for comparison
    const normalizedInput = slugify(channelIdOrName);

    // Find by id or slugified name
    const channel =
      channels.find((c) => c._id === channelIdOrName) ||
      channels.find((c) => slugify(c.name) === normalizedInput);

    if (channel) {
      setChannelNameInURL(slugify(channel.name));
      selectChannel(channel._id);
    }
  };

  // Handle ArrowDown key from anywhere in header
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

            {/* Language Filter Dropdown */}
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

          {/* Bottom row: Channel Selector */}
          <div className="full-width">
            <ChannelSelector
              ref={channelSelectorRef}
              channels={filteredChannels}
              currentChannel={currentChannel}
              onSelectChannel={handleChannelSelect}
              clearSearch={clearSearch}
              disabled={isSearchMode}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
