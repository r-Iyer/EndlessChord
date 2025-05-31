import SearchBar from '../SearchBar/SearchBar';
import UserProfile from '../UserProfile/UserProfile';
import ChannelSelector, { slugify } from '../ChannelSelector/ChannelSelector';
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
}) {
  const handleChannelSelect = (channelIdOrName) => {
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
    onPlayFavorites={() => {
      clearSearch();       // First, clear search
      playFavorites();     // Then, play favorites
    }}
    />
    </div>
    </div>
    
    {/* Bottom row: Channel Selector */}
    <div className="full-width">
    <ChannelSelector
    channels={channels}
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
