# Music Channel

A full-stack web application that streams curated music channels (like "Hindi Hits", "English Pop") using YouTube videos, with AI-powered song recommendations and a modern, TV-like user experience.

---

## Features

- **Channel-based music streaming**: Users can select from curated channels (e.g., Hindi Hits, English Pop).
- **Continuous playback**: Songs play back-to-back, with next/previous controls.
- **Custom progress slider**: Seek within the current song.
- **Auto-hide controls**: Controls and slider fade out after inactivity, reappear on mouse/touch.
- **Fullscreen support**: True fullscreen mode (covers browser chrome and OS taskbar).
- **AI-powered recommendations**: Uses Gemini (Google GenAI) to suggest new songs for each channel.
- **YouTube integration**: Streams music videos directly from YouTube.
- **Backend with MongoDB**: Stores channels, songs, and play history.

---

## System Design

**Frontend:**  
- React
- Tailwind CSS for styling
- Custom player controls and slider
- Communicates with backend via REST API

**Backend:**  
- Node.js + Express
- MongoDB (via Mongoose)
- Google GenAI (Gemini) for song recommendations
- YouTube Data API and fallback scraping for video search

**Key Flow:**
1. User selects a channel.
2. Backend fetches songs for the channel (from DB or AI).
3. Frontend streams YouTube videos, tracks progress, and manages playback.
4. Controls and slider auto-hide after inactivity.
5. Fullscreen mode available.

---