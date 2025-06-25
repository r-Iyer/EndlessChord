import { useState } from 'react';
import SearchBar from '../SearchBar/SearchBar';
import UserProfile from '../UserProfile/UserProfile';
import ChannelSelector, { slugify } from '../ChannelSelector/ChannelSelector';
import LanguageDropdown from '../LanguageDropdown/LanguageDropdown';
import './Header.css';

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

  const languages = [...new Set(channels.map(channel => channel.language))]
    .sort()
    .map(lang => ({
      value: lang,
      label: lang.charAt(0).toUpperCase() + lang.slice(1)
    }));

  const filteredChannels = languageFilter
    ? channels.filter(channel => channel.language === languageFilter)
    : channels;

  const handleChannelSelect = (channelIdOrName) => {
    clearSearch();
    setUserInteracted(true);
    setBackendError(false);

    const normalizedInput = slugify(channelIdOrName);

    const channel =
      channels.find((c) => c._id === channelIdOrName) ||
      channels.find((c) => slugify(c.name) === normalizedInput);

    if (channel) {
      setChannelNameInURL(slugify(channel.name));
      selectChannel(channel._id);
    }
  };

  return (
    <header className={`app-header ${isFullscreen ? 'app-header--hidden' : ''}`}>
      <div className="header-container">
        <div className="layout-column-gap">
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
