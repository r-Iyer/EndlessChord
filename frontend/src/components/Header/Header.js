import SearchBar from '../SearchBar/SearchBar';
import UserProfile from '../UserProfile/UserProfile';
import ChannelSelector from '../ChannelSelector/ChannelSelector';
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
  selectChannel
}) {
  return (
    <header className={`app-header ${isFullscreen ? 'app-header--hidden' : ''}`}>
      <div className="header-container">
        <div className="layout-column-gap">
          {/* Top row: Search Bar and User Profile */}
          <div className="layout-row-gap align-center">
            <div className="full-width">
              <SearchBar
                onSearch={handleSearch}
                searchQuery={searchQuery}
                className="full-width"
              />
            </div>
            <div className="no-shrink">
              <UserProfile
                user={user}
                onLogout={handleLogout}
                onShowAuth={() => setShowAuthModal(true)}
                onPlayFavorites={playFavorites}
              />
            </div>
          </div>

          {/* Bottom row: Channel Selector */}
          <div className="full-width">
            <ChannelSelector
              channels={channels}
              currentChannel={currentChannel}
              onSelectChannel={(channelIdOrName) => {
                setUserInteracted(true);
                setBackendError(false);
                clearSearch();
                const channel =
                  channels.find((c) => c._id === channelIdOrName) ||
                  channels.find(
                    (c) =>
                      c.name.replace(/\s+/g, '-').toLowerCase() ===
                      channelIdOrName.replace(/\s+/g, '-').toLowerCase()
                  );
                if (channel) {
                  setChannelNameInURL(channel.name.replace(/\s+/g, '-'));
                  selectChannel(channel._id);
                }
              }}
              disabled={isSearchMode}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
