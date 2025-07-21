import { slugify } from '../components/ChannelSelector/ChannelSelector';

/**
 * Handles both channel and album selection.
 */
export default function useChannelAlbumHandlers({
  clearSearch,
  setUserInteracted,
  setBackendError,
  setChannelNameInURL,
  selectChannel,
  selectAlbum,
  onSelect,
}) {
  const handleSelect = (selection) => {
    clearSearch();
    setUserInteracted(true);
    setBackendError(false);
    onSelect(selection);

    if (selection.type === 'channel') {
      const ch = selection.channel;
      setChannelNameInURL(slugify(ch.name));
      selectChannel(ch._id);
    } else if (selection.type === 'album') {
      const alb = selection.album;
      setChannelNameInURL(alb._id);
      selectAlbum(alb);
    }
  };

  return { handleSelect };
}