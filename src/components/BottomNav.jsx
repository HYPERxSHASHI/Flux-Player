import React from 'react';

export default function BottomNav({ activeView, setActiveView }) {
    return (
        <div className="bottom-nav glass-panel-heavy">
            <button className={`nav-item ${activeView === 'home' ? 'active' : ''}`} onClick={() => setActiveView('home')}>
                <span className="material-symbols-rounded">home</span>
                <span>Home</span>
            </button>
            <button className={`nav-item ${activeView === 'search' ? 'active' : ''}`} onClick={() => setActiveView('search')}>
                <span className="material-symbols-rounded">search</span>
                <span>Search</span>
            </button>
            <button className={`nav-item ${activeView === 'nowPlaying' ? 'active' : ''}`} onClick={() => setActiveView('nowPlaying')}>
                <span className="material-symbols-rounded">play_circle</span>
                <span>Player</span>
            </button>
            <button className={`nav-item ${activeView === 'library' ? 'active' : ''}`} onClick={() => setActiveView('library')}>
                <span className="material-symbols-rounded">library_music</span>
                <span>Vault</span>
            </button>
        </div>
    );
}