# 🎵 Endless Chord - An Immersive Audio-Visual Streaming Experience

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![React](https://img.shields.io/badge/React-18.2-blue)
![Node.js](https://img.shields.io/badge/Node.js-20-green)

**Endless Chord** provides an immersive, TV-style audio-visual streaming experience. This modern web application offers a continuous, endless stream of curated music channels, powered by YouTube and enhanced with intelligent, AI-driven recommendations. Dive into a seamless world of music and video discovery, presented through a sleek and intuitive interface designed for non-stop enjoyment.

---

## ✨ Core Features

| Feature | Description |
| :--- | :--- |
| 🎬 **Seamless Channel Streaming** | Effortlessly switch between curated, genre-based channels like "Hindi Hits" and "English Pop." Experience a continuous audio-visual stream, with a visually rich, full-screen interface. |
| 🔁 **Uninterrupted Playback** | Your personal soundtrack never stops. Tracks flow seamlessly one after another, with intuitive controls to skip or revisit songs. |
| 🎚 **Elegant & Adaptive Controls** | A minimalist UI that stays out of your way. Controls for playback, volume, and progress intelligently appear when needed and fade away to keep the focus on the content. |
| 🔍 **Universal Smart Search** | Instantly find any track, artist, album, or composer. Our powerful search delves deep into our extensive music library to bring you exactly what you're looking for. |
| 🤖 **AI-Powered Discovery** | Let Google's Gemini AI be your personal DJ. Receive tailored recommendations based on your listening habits and discover your next favorite song. |
| ❤️ **Personalized Favorites** | Found a gem? Save it to your personal collection with a single click. Registered users can build a library of their most-loved tracks for easy access. |
| 🔐 **Seamless Authentication** | A secure and flexible login system. Choose to sign up, log in, or continue as a guest to explore the platform's core features. |
| 🎵 **Song Card** | Enjoy a beautifully framed, clickable song card showcasing the current track’s title, album, artist, composer, release year, and genre, with gentle previews of the tunes coming up. |

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed and configured:

-   **Node.js**: Version 18 or higher
-   **MongoDB Atlas**: A free or paid account
-   **Google Gemini API Key**: For enabling AI recommendations

### Local Environment Setup

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/yourusername/EndlessChord.git](https://github.com/yourusername/EndlessChord.git)
    cd EndlessChord
    ```

2.  **Backend Configuration**
    Navigate to the backend directory and install dependencies.
    ```bash
    cd backend
    npm install
    ```
    Create a `.env` file in the `backend` directory and populate it with your credentials:
    ```env
    MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.hbj43yw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
    JWT_SECRET=your_super_secret_jwt_key
    JWT_EXPIRES_IN=90d
    GOOGLE_GENAI_API_KEY=your_gemini_api_key
    LOG_LEVEL="info"
    ```
    Now, start the backend server:
    ```bash
    npm run dev
    ```

3.  **Frontend Configuration**
    In a new terminal, navigate to the frontend directory.
    ```bash
    cd ../frontend
    npm install
    npm start
    ```

4.  **Launch the App**
    Open your browser and navigate to `http://localhost:3000` to see Endless Chord in action!

---

## 🛠 Technology Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | React, Redux Toolkit, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas |
| **Services** | Firebase Authentication, Google Gemini API, YouTube API |

---

## 📖 Usage Guide

### Basic Controls
-   **Browse Channels**: Click on any channel card on the home screen to start streaming.
-   **Search Music**: Just type any artist, composer, album, or song title into the search bar and click the magnifying-glass icon in the top-right to instantly find and play your music.
-   **Fullscreen Mode**: Use the dedicated fullscreen button for an immersive view.
-   **Skip Tracks**: Use the on-screen previous/next buttons or your keyboard's 'q' and 'e' buttons to navigate the playlist.
-   **Forward / Backward**: Use the on-screen "+5" and "-5" buttons or your keyboard's arrows to move forward or backward a song.
-   **Captions**: Use the on-screen captions button to toggle on/off captions.

### User Features
-   **Authentication**: Sign up or log in using email/password to access all features. You can also `Continue as a guest` for limited features.
-   **Favorites**: While a track is playing, click the ♡ icon to add it to your personal collection. Access your saved favorites from the user menu.
-   **AI Recommendations**: Discover new tracks suggested by our AI under each channel, tailored specifically to your listening history.
-   **Song Card**: View an elegantly framed card displaying the current track’s title, album, artist, composer, release year, and genre, with subtle previews of what's coming next and later.


---

## 🌐 Deployment

-   **Frontend**: Ready for deployment on services like Vercel, Netlify, or AWS Amplify.
-   **Backend**: Can be deployed on platforms such as Heroku, Render, or any VPS.
-   **Database**: Utilizes a MongoDB Atlas Cluster for a scalable and reliable database solution.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  **Fork the Project**
2.  **Create your Feature Branch**
    ```bash
    git checkout -b feature/AmazingFeature
    ```
3.  **Commit your Changes**
    ```bash
    git commit -m 'Add some AmazingFeature'
    ```
4.  **Push to the Branch**
    ```bash
    git push origin feature/AmazingFeature
    ```
5.  **Open a Pull Request**

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
