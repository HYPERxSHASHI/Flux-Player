import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import BottomNav from './components/BottomNav';

const API_KEY = "AIzaSyA-iXHMW_bHyvYiZF8BjJlAeFvG91vcm1c";
const RAPID_API_KEY = "71af390377msh19f2934aa9f45f0p13bb41jsnde747c954e2e";

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://api.piped.projectsegfau.lt",
  "https://pipedapi.tokhmi.xyz"
];

let db;
const initDB = () => new Promise((resolve) => {
  const req = indexedDB.open("FluxVaultDB_React_V8", 1);
  req.onupgradeneeded = e => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("tracks")) db.createObjectStore("tracks", { keyPath: "id" });
  };
  req.onsuccess = e => { db = e.target.result; resolve(); };
  req.onerror = () => { console.error("Database initialization failed"); resolve(); };
});

const saveToDB = (track) => new Promise(res => {
  if (!db) return res();
  const tx = db.transaction(["tracks"], "readwrite");
  tx.objectStore("tracks").put(track);
  tx.oncomplete = () => res();
});

const getFromDB = () => new Promise(res => {
  if (!db) return res([]);
  const tx = db.transaction(["tracks"], "readonly");
  const req = tx.objectStore("tracks").getAll();
  req.onsuccess = () => res(req.result || []);
  req.onerror = () => res([]);
});

const deleteFromDB = (id) => new Promise(res => {
  if (!db) return res();
  const tx = db.transaction(["tracks"], "readwrite");
  tx.objectStore("tracks").delete(id);
  tx.oncomplete = () => res();
});

const decodeHTML = (html) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

const formatTime = (sec) => {
  if (isNaN(sec) || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const generateDynamicCover = (text) => {
  if (!text) text = "Unknown";
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = text.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="hsl(${hue},60%,40%)"/><text x="150" y="160" font-family="sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle" opacity="0.6">${text.charAt(0).toUpperCase()}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif', background: '#e0ecef', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2>Engine Recovery Mode</h2>
          <p>A critical rendering exception was intercepted.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '14px 28px', marginTop: '20px', background: '#3b7b80', color: '#fff', border: 'none', borderRadius: '24px', fontWeight: 'bold', cursor: 'pointer' }}>
            Reboot Engine
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function FluxApp() {
  const [activeView, setActiveView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [volume, setVolume] = useState(1.0);

  const [avMode, setAvMode] = useState('song');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [lyrics, setLyrics] = useState('Searching Database...');

  const [vaultTracks, setVaultTracks] = useState([]);
  const [playlistFilter, setPlaylistFilter] = useState('all');
  const [toast, setToast] = useState({ message: '', visible: false });
  const [isEqOpen, setIsEqOpen] = useState(false);
  const [eqValues, setEqValues] = useState({ 60: 0, 230: 0, 910: 0, 3000: 0, 14000: 0 });

  const audioRef1 = useRef(null);
  const audioRef2 = useRef(null);
  const videoRef = useRef(null);

  const activeAudioRef = useRef(1);
  const isCrossfading = useRef(false);
  const fadeIntervalRef = useRef(null);
  const crossfadeTimeoutRef = useRef(null);
  const playIdRef = useRef(0);
  const volumeRef = useRef(1.0);

  const audioCtxRef = useRef(null);
  const filtersRef = useRef([]);

  useEffect(() => {
    initDB().then(() => loadVault());
  }, []);

  const showToast = (msg) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2500);
  };

  const loadVault = async () => {
    const tracks = await getFromDB();
    setVaultTracks(tracks);
  };

  const handleSearch = async (e, directQuery = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const queryToUse = directQuery || searchQuery.trim();
    if (!queryToUse) return;

    setIsSearching(true);
    try {
      const q = encodeURIComponent(queryToUse + " official audio OR lyrics");
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${q}&type=video&key=${API_KEY}`);
      const data = await res.json();
      setSearchResults(data.items || []);
      if (directQuery) {
        setSearchQuery(directQuery);
        setActiveView('search');
      }
    } catch (err) { showToast("❌ Search Engine Offline"); }
    setIsSearching(false);
  };

  const handleLocalUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (let file of files) {
      const track = {
        id: 'local_' + Date.now() + Math.random(),
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Local Media',
        thumb: generateDynamicCover(file.name),
        blob: file,
        playlist: 'all'
      };
      await saveToDB(track);
    }
    showToast(`✅ Added ${files.length} tracks!`);
    loadVault();
  };

  // --- DUAL-API STREAMING FALLBACK MECHANISM ---
  const fetchStreamUrl = async (id, title) => {
    // Pipeline A: Try primary Piped/YouTube stream infrastructure
    for (let instance of PIPED_INSTANCES) {
      try {
        const res = await fetch(`${instance}/streams/${id}`);
        if (res.ok) {
          const data = await res.json();
          const audio = data.audioStreams.find(s => s.mimeType.includes("mp4a")) || data.audioStreams[0];
          if (audio) return audio.url;
        }
      } catch (e) { /* step down to next instance */ }
    }

    // Pipeline B: JioSaavn Unofficial RapidAPI Engine Fallback
    try {
      const searchRes = await fetch(`https://jio-saavan-unofficial.p.rapidapi.com/search?query=${encodeURIComponent(title)}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPID_API_KEY,
          'x-rapidapi-host': 'jio-saavan-unofficial.p.rapidapi.com'
        }
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const mediaUrl = searchData?.results?.[0]?.encrypted_media_url;

        if (mediaUrl) {
          const songRes = await fetch("https://jio-saavan-unofficial.p.rapidapi.com/getsong", {
            method: "POST",
            headers: {
              'x-rapidapi-key': RAPID_API_KEY,
              'x-rapidapi-host': "jio-saavan-unofficial.p.rapidapi.com",
              'Content-Type': "application/json"
            },
            body: JSON.stringify({ encrypted_media_url: mediaUrl })
          });
          if (songRes.ok) {
            const songData = await songRes.json();
            return songData.media_url || songData.download_url;
          }
        }
      }
    } catch (e) { /* skip to global network search */ }

    return null;
  };

  const initWebAudio = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();

      const src1 = audioCtxRef.current.createMediaElementSource(audioRef1.current);
      const src2 = audioCtxRef.current.createMediaElementSource(audioRef2.current);

      const freqs = [60, 230, 910, 3000, 14000];
      let lastNode = null;

      freqs.forEach(freq => {
        let filter = audioCtxRef.current.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.0;
        filter.gain.value = 0;
        filtersRef.current.push(filter);
        if (lastNode) lastNode.connect(filter);
        lastNode = filter;
      });

      src1.connect(filtersRef.current[0]);
      src2.connect(filtersRef.current[0]);
      lastNode.connect(audioCtxRef.current.destination);

    } catch (e) { console.warn("WebAudio disabled for cross-origin compliance"); }
  };

  const handleEqChange = (freq, value) => {
    const val = parseFloat(value);
    setEqValues(prev => ({ ...prev, [freq]: val }));
    if (filtersRef.current.length > 0) {
      const indexMap = { 60: 0, 230: 1, 910: 2, 3000: 3, 14000: 4 };
      filtersRef.current[indexMap[freq]].gain.value = val;
    }
  };

  const applyCopperPreset = () => {
    const preset = { 60: 6, 230: 4, 910: -3, 3000: 2, 14000: 4 };
    setEqValues(preset);
    if (filtersRef.current.length > 0) {
      filtersRef.current[0].gain.value = 6;
      filtersRef.current[1].gain.value = 4;
      filtersRef.current[2].gain.value = -3;
      filtersRef.current[3].gain.value = 2;
      filtersRef.current[4].gain.value = 4;
    }
    setIsEqOpen(false);
  };

  const playTrack = async (targetQueue, index) => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    if (crossfadeTimeoutRef.current) clearTimeout(crossfadeTimeoutRef.current);
    isCrossfading.current = false;

    audioRef1.current.pause();
    audioRef2.current.pause();

    const currentPlayId = Date.now();
    playIdRef.current = currentPlayId;

    setQueue(targetQueue);
    setCurrentIndex(index);
    const trackInfo = targetQueue[index];
    if (!trackInfo) return;

    setActiveView('nowPlaying');
    setAvMode('song');

    const engine = activeAudioRef.current === 1 ? audioRef1.current : audioRef2.current;
    engine.volume = volumeRef.current;

    try {
      if (trackInfo.blob) {
        const objectUrl = URL.createObjectURL(trackInfo.blob);
        engine.src = objectUrl;
        engine.load();
        if (trackInfo.blob.type && trackInfo.blob.type.includes('video') && videoRef.current) {
          videoRef.current.src = objectUrl;
          videoRef.current.load();
        } else {
          if (videoRef.current) videoRef.current.src = "";
        }
      } else {
        const url = await fetchStreamUrl(trackInfo.id, trackInfo.title);
        if (playIdRef.current !== currentPlayId) return;

        if (url) {
          engine.src = url;
          engine.load();
        } else {
          throw new Error("Pipeline Error");
        }
      }

      const playPromise = engine.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
          initWebAudio();
          setIsPlaying(true);
          extractTheme(trackInfo.thumb);
          if (avMode === 'video' && videoRef.current && videoRef.current.src) videoRef.current.play();
        }).catch(() => setIsPlaying(false));
      }
      fetchLyrics(trackInfo);
    } catch (e) {
      if (playIdRef.current === currentPlayId) showToast("❌ Link Unreachable");
    }
  };

  // --- MULTI-API LYRICS FALLBACK INTEGRATION ---
  const fetchLyrics = async (track) => {
    setLyrics('Loading...');
    let clnTitle = track.title.replace(/lyrics|official|video|audio|\(.*\)|\[.*\]/gi, '').trim();
    let clnArtist = track.artist.replace(/VEVO|Official|- Topic/gi, '').trim();

    try {
      const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(clnArtist)}/${encodeURIComponent(clnTitle)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.lyrics) {
          setLyrics(data.lyrics.replace(/\n/g, '<br>'));
          return;
        }
      }
    } catch (e) { }

    try {
      const spotSearch = await fetch(`https://spotify23.p.rapidapi.com/search/?q=${encodeURIComponent(clnTitle + " " + clnArtist)}&type=tracks&offset=0&limit=1`, {
        method: 'GET',
        headers: { 'x-rapidapi-key': RAPID_API_KEY, 'x-rapidapi-host': 'spotify23.p.rapidapi.com' }
      });
      if (spotSearch.ok) {
        const spotData = await spotSearch.json();
        const trackId = spotData?.tracks?.items?.[0]?.data?.id;

        if (trackId) {
          const lyricsRes = await fetch(`https://spotify23.p.rapidapi.com/track_lyrics/?id=${trackId}`, {
            method: "GET",
            headers: { 'x-rapidapi-key': RAPID_API_KEY, 'x-rapidapi-host': "spotify23.p.rapidapi.com" }
          });
          if (lyricsRes.ok) {
            const lyricData = await lyricsRes.json();
            const lines = lyricData?.lyrics?.lines?.map(l => l.words).join('<br>') || "";
            if (lines) {
              setLyrics(lines);
              return;
            }
          }
        }
      }
    } catch (e) { }

    setLyrics("Lyrics unavailable for this track context.");
  };

  const extractTheme = (url) => {
    if (!url) return;
    const img = new Image(); img.crossOrigin = "Anonymous";
    img.onload = () => {
      const cvs = document.createElement('canvas'); const ctx = cvs.getContext('2d');
      cvs.width = 50; cvs.height = 50; ctx.drawImage(img, 0, 0, 50, 50);
      try {
        const d = ctx.getImageData(0, 0, 50, 50).data; let r = 0, g = 0, b = 0, c = 0;
        for (let i = 0; i < d.length; i += 16) { r += d[i]; g += d[i + 1]; b += d[i + 2]; c++; }
        document.documentElement.style.setProperty('--accent-color', `rgb(${Math.max(0, r / c - 40)}, ${Math.max(0, g / c - 40)}, ${Math.max(0, b / c - 40)})`);
        document.documentElement.style.setProperty('--blob-color', `rgba(${r}, ${g}, ${b}, 0.5)`);
      } catch (e) { }
    }; img.src = url;
  };

  const handleTimeUpdate = () => {
    const engine = activeAudioRef.current === 1 ? audioRef1.current : audioRef2.current;
    const nextEngine = activeAudioRef.current === 1 ? audioRef2.current : audioRef1.current;

    if (!engine) return;
    const cur = engine.currentTime || 0;
    const tot = engine.duration || 0;
    setProgress({ current: cur, total: tot });

    if (avMode === 'video' && videoRef.current && Math.abs(videoRef.current.currentTime - cur) > 0.5) {
      videoRef.current.currentTime = cur;
    }

    if (tot > 0 && tot - cur <= 5 && !isCrossfading.current && currentIndex + 1 < queue.length) {
      isCrossfading.current = true;
      const nextIdx = isShuffle ? Math.floor(Math.random() * queue.length) : currentIndex + 1;
      const nextTrack = queue[nextIdx];

      if (nextTrack.blob) {
        nextEngine.src = URL.createObjectURL(nextTrack.blob);
        nextEngine.load();
        beginFade(engine, nextEngine, nextIdx);
      } else {
        fetchStreamUrl(nextTrack.id, nextTrack.title).then(url => {
          if (url) {
            nextEngine.src = url;
            nextEngine.load();
            beginFade(engine, nextEngine, nextIdx);
          }
        });
      }
    }

    if (tot > 1 && cur >= tot && !isCrossfading.current) playNext();
  };

  const beginFade = (fadeOutEngine, fadeInEngine, nextIdx) => {
    fadeInEngine.volume = 0;
    fadeInEngine.play().catch(() => { });

    const masterVol = volumeRef.current;

    fadeIntervalRef.current = setInterval(() => {
      if (fadeOutEngine.volume > 0.05) fadeOutEngine.volume -= 0.05;
      if (fadeInEngine.volume < masterVol - 0.05) fadeInEngine.volume += 0.05;
    }, 250);

    crossfadeTimeoutRef.current = setTimeout(() => {
      clearInterval(fadeIntervalRef.current);
      fadeOutEngine.pause();
      fadeOutEngine.volume = masterVol;
      fadeInEngine.volume = masterVol;

      activeAudioRef.current = activeAudioRef.current === 1 ? 2 : 1;
      isCrossfading.current = false;

      setCurrentIndex(nextIdx);
      const t = queue[nextIdx];
      if (t) {
        extractTheme(t.thumb);
        fetchLyrics(t);
      }
    }, 5000);
  };

  const togglePlay = () => {
    if (currentIndex === -1 || queue.length === 0) return;
    const engine = activeAudioRef.current === 1 ? audioRef1.current : audioRef2.current;
    if (isPlaying) {
      engine.pause();
      if (videoRef.current) videoRef.current.pause();
    } else {
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
      engine.play();
      if (avMode === 'video' && videoRef.current) videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (queue.length === 0) return;
    const nextIdx = isShuffle ? Math.floor(Math.random() * queue.length) : (currentIndex + 1) % queue.length;
    playTrack(queue, nextIdx);
  };

  const playPrev = () => {
    if (queue.length === 0) return;
    const engine = activeAudioRef.current === 1 ? audioRef1.current : audioRef2.current;
    if (engine.currentTime > 5) {
      engine.currentTime = 0;
    } else {
      const prevIdx = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
      playTrack(queue, prevIdx);
    }
  };

  const handleProgressClick = (e) => {
    if (!progress.total) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const engine = activeAudioRef.current === 1 ? audioRef1.current : audioRef2.current;
    engine.currentTime = percent * progress.total;
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    volumeRef.current = newVol;
    const engine = activeAudioRef.current === 1 ? audioRef1.current : audioRef2.current;
    if (engine && !isCrossfading.current) engine.volume = newVol;
  };

  const toggleVaultStatus = async () => {
    const track = queue[currentIndex];
    if (!track) return;

    const exists = vaultTracks.find(t => t.id === track.id);
    if (exists) {
      await deleteFromDB(track.id);
      showToast("🗑️ Removed from Vault");
    } else {
      try {
        const vaultItem = { id: track.id, title: track.title, artist: track.artist, thumb: track.thumb, playlist: 'favorites' };
        if (track.blob) vaultItem.blob = track.blob;
        await saveToDB(vaultItem);
        showToast("⭐ Added to Vault");
      } catch (e) { showToast("❌ Database Error"); }
    }
    loadVault();
  };

  const currentTrack = (queue && queue.length > 0 && currentIndex >= 0 && queue[currentIndex])
    ? queue[currentIndex]
    : { id: 'default', title: 'Flux Player', artist: 'Engine Ready', thumb: null, blob: null };

  const percentComplete = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const displayedVault = playlistFilter === 'all' ? vaultTracks : vaultTracks.filter(t => t.playlist === playlistFilter);
  const isSaved = vaultTracks.some(t => t.id === currentTrack.id);
  const displayThumb = (currentTrack.blob && !currentTrack.thumb) ? generateDynamicCover(currentTrack.title) : currentTrack.thumb;

  return (
    <div className="app">
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* ================= 1. HOME VIEW ================= */}
      {activeView === 'home' && (
        <div className="view active-view">
          <div className="top-header"><div className="library-title">Home</div></div>

          <div style={{ fontWeight: 800, fontSize: '18px', marginBottom: '15px' }}>Top Anthems</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '30px' }}>
            <div className="song-item glass-panel" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '20px' }} onClick={() => handleSearch(null, 'Max Verstappen Song official audio')}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏎️</div>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>F1 Drivers<br /><span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Super Max & More</span></div>
            </div>
            <div className="song-item glass-panel" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '20px' }} onClick={() => handleSearch(null, 'Global Top 50 Hits official audio')}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌍</div>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>Global Top 50<br /><span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Universal Hits</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. SEARCH VIEW ================= */}
      {activeView === 'search' && (
        <div className="view active-view">
          <div className="top-header"><div className="library-title">Discover</div></div>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="search-bar glass-panel"
              placeholder="Search artists, songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="icon-btn glass-panel" style={{ width: '54px', height: '54px', borderRadius: '20px', flexShrink: 0 }}>
              <span className="material-symbols-rounded">search</span>
            </button>
          </form>

          {isSearching && <div className="loader" style={{ display: 'block' }}></div>}

          <div className="song-list" style={{ marginTop: '16px' }}>
            {searchResults.length === 0 && !isSearching ? (
              <div style={{ textAlign: 'center', marginTop: '60px', fontWeight: 600, fontSize: '16px', color: 'var(--text-secondary)' }}>
                Find your rhythm.<br /><span style={{ fontSize: '13px', fontWeight: 500, opacity: 0.8 }}>Dual API Fallback Engine Active.</span>
              </div>
            ) : (
              searchResults.map((item, idx) => (
                <div key={item.id.videoId} className="song-item glass-panel" onClick={() => {
                  const mappedQueue = searchResults.map(r => ({
                    id: r.id.videoId, title: decodeHTML(r.snippet.title), artist: decodeHTML(r.snippet.channelTitle), thumb: r.snippet.thumbnails.high.url
                  }));
                  playTrack(mappedQueue, idx);
                }}>
                  <div className="song-cover-small" style={{ backgroundImage: `url('${item.snippet.thumbnails.high.url}')` }}></div>
                  <div className="song-info">
                    <div className="song-title">{decodeHTML(item.snippet.title)}</div>
                    <div className="song-artist">{decodeHTML(item.snippet.channelTitle)}</div>
                  </div>
                  <div className="list-play-btn"><span className="material-symbols-rounded">play_arrow</span></div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= 3. PLAYER VIEW ================= */}
      {activeView === 'nowPlaying' && (
        <div className="view active-view">
          <div className="top-header">
            <button className="icon-btn glass-panel" onClick={() => setActiveView('home')}><span className="material-symbols-rounded">expand_more</span></button>
            <div style={{ fontWeight: 800, fontSize: '16px' }}>Now Playing</div>

            {/* Top-Right Volume Control */}
            <div className="volume-wrapper">
              <button className="icon-btn glass-panel">
                <span className="material-symbols-rounded">
                  {volume === 0 ? 'volume_off' : volume > 0.5 ? 'volume_up' : 'volume_down'}
                </span>
              </button>
              <div className="volume-slider-container glass-panel-heavy">
                <input
                  type="range"
                  min="0" max="1" step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
              </div>
            </div>
          </div>

          <div className="av-toggle-container glass-panel">
            <button className={`av-btn ${avMode === 'song' ? 'active' : ''}`} onClick={() => setAvMode('song')}>Song</button>
            <button className={`av-btn ${avMode === 'lyrics' ? 'active' : ''}`} onClick={() => setAvMode('lyrics')}>Lyrics</button>
            <button className={`av-btn ${avMode === 'video' ? 'active' : ''}`} onClick={() => { setAvMode('video'); if (isPlaying && videoRef.current) videoRef.current.play(); }}>Video</button>
          </div>

          <div className="artwork-container" style={{ backgroundImage: displayThumb ? `url('${displayThumb}')` : 'none' }}>
            {!displayThumb && <div className="glass-pill glass-panel"><span className="material-symbols-rounded">music_note</span></div>}

            <div id="video-player-container" style={{ display: avMode === 'video' ? 'block' : 'none' }}>
              <video ref={videoRef} playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
            </div>

            <div className="lyrics-overlay glass-panel-heavy" style={{ display: avMode === 'lyrics' ? 'flex' : 'none' }}>
              <div className="lyrics-title">Lyrics</div>
              <div className="lyrics-text" dangerouslySetInnerHTML={{ __html: lyrics }}></div>
            </div>
          </div>

          <div className="track-info">
            <div className="track-title">{currentTrack.title}</div>
            <div className="track-artist">{currentTrack.artist}</div>
          </div>

          <div className="progress-area">
            <div className="progress-bar-container" onClick={handleProgressClick}>
              <div className="progress-track"></div>
              <div className="progress-fill" style={{ width: `${percentComplete}%` }}></div>
              <div className="progress-thumb" style={{ left: `${percentComplete}%` }}></div>
            </div>
            <div className="time-row">
              <span>{formatTime(progress.current)}</span>
              <span>{formatTime(progress.total)}</span>
            </div>
          </div>

          <div className="controls-main">
            <button className="ctrl-btn" onClick={playPrev}><span className="material-symbols-rounded">skip_previous</span></button>
            <button className="play-btn" onClick={togglePlay}>
              <span className="material-symbols-rounded" style={{ fontSize: '42px' }}>{isPlaying ? 'pause' : 'play_arrow'}</span>
            </button>
            <button className="ctrl-btn" onClick={playNext}><span className="material-symbols-rounded">skip_next</span></button>

            {/* EQ Button Restored Next to Skip Button */}
            <button className="ctrl-btn" onClick={() => setIsEqOpen(true)}>
              <span className="material-symbols-rounded">tune</span>
            </button>
          </div>

          <div className="controls-secondary">
            <button className="ctrl-btn" onClick={() => setIsShuffle(!isShuffle)}>
              <span className="material-symbols-rounded" style={{ fontSize: '26px', color: isShuffle ? 'var(--accent-color)' : 'var(--text-primary)' }}>shuffle</span>
            </button>
            <button className="ctrl-btn" onClick={toggleVaultStatus}>
              <span className="material-symbols-rounded" style={{ fontSize: '28px', color: isSaved ? 'var(--accent-color)' : 'var(--text-primary)' }}>
                {isSaved ? 'favorite' : 'favorite_border'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ================= 4. VAULT VIEW ================= */}
      {activeView === 'library' && (
        <div className="view active-view">
          <div className="top-header" style={{ paddingLeft: 0 }}><div className="library-title">The Vault</div></div>

          <select className="playlist-select glass-panel" value={playlistFilter} onChange={(e) => setPlaylistFilter(e.target.value)}>
            <option value="all">All Saved Tracks</option>
            <option value="favorites">Favorites</option>
          </select>

          <label className="load-music-btn glass-panel">
            <span className="material-symbols-rounded">folder_open</span> Add Local Music
            <input type="file" accept="audio/*,video/*" multiple style={{ display: 'none' }} onChange={handleLocalUpload} />
          </label>

          <div style={{ fontSize: '14px', marginBottom: '16px', fontWeight: 800, color: 'var(--text-secondary)' }}>
            💾 {displayedVault.length} tracks registered
          </div>

          <div className="song-list">
            {displayedVault.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '40px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Your Vault is empty.<br /><span style={{ fontSize: '12px' }}>Heart a song or load local media.</span>
              </div>
            ) : (
              displayedVault.map((t, idx) => {
                const finalThumb = t.thumb || generateDynamicCover(t.title);
                return (
                  <div key={t.id} className="song-item glass-panel" onClick={() => playTrack(displayedVault, idx)}>
                    <div className="song-cover-small" style={{ backgroundImage: `url('${finalThumb}')` }}></div>
                    <div className="song-info">
                      <div className="song-title">{t.title}</div>
                      <div className="song-artist">{t.artist}</div>
                    </div>
                    <div className="list-play-btn"><span className="material-symbols-rounded">play_arrow</span></div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <BottomNav activeView={activeView} setActiveView={setActiveView} />

      {/* ================= EQ MODAL ================= */}
      {isEqOpen && (
        <div className="modal-overlay show">
          <div className="modal-box glass-panel-heavy">
            <div className="modal-title">DSP Tuner</div>

            <div className="eq-rack">
              {[60, 230, 910, 3000, 14000].map(freq => (
                <div key={freq} className="eq-row">
                  <span className="eq-label">{freq < 1000 ? freq + 'Hz' : (freq / 1000) + 'k'}</span>
                  <input
                    type="range" min="-12" max="12"
                    value={eqValues[freq]}
                    onChange={(e) => handleEqChange(freq, e.target.value)}
                  />
                  <span className="eq-val">{eqValues[freq]}dB</span>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={applyCopperPreset}>Copper Preset</button>
              <button className="modal-btn save" onClick={() => setIsEqOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      <div className={`fallback-badge glass-panel-heavy ${toast.visible ? 'show' : ''}`}>{toast.message}</div>

      <audio ref={audioRef1} onTimeUpdate={handleTimeUpdate}></audio>
      <audio ref={audioRef2} onTimeUpdate={handleTimeUpdate}></audio>
    </div>
  );
}

export default function SafeApp() {
  return (
    <ErrorBoundary>
      <FluxApp />
    </ErrorBoundary>
  );
}