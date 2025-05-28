import './SeekButton.css';

function SeekButton({ direction, currentTime, duration, onSeek }) {
  const handleClick = () => {
    if (direction === 'backward') {
      onSeek(Math.max(currentTime - 5, 0));
    } else if (direction === 'forward') {
      onSeek(Math.min(currentTime + 5, duration));
    }
  };

  return (
    <button
      className="seek-button"
      aria-label={`Seek ${direction === 'backward' ? 'backward' : 'forward'} 5 seconds`}
      onClick={handleClick}
    >
      {direction === 'backward' ? '-5' : '+5'}
    </button>
  );
}

export default SeekButton;
