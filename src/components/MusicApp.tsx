import { useState, useEffect, useRef } from 'react'
import { Search, Play, Heart, Music, Pause, Star, ListMusic, Home, LogOut, Loader2, TrendingUp, SkipForward, SkipBack, Plus, Shuffle, Repeat, X, Library, Mic2, Bell, User, Settings, MoreHorizontal, Zap, Volume2, Volume1, VolumeX, ChevronDown, Headphones, Cast, MoreVertical, ChevronRight, ThumbsUp, ThumbsDown, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SongFloatingCard from '@/components/SongFloatingCard'
import { motion, AnimatePresence } from 'framer-motion'
import Hls from 'hls.js'

interface Song {
  id: string
  seokey?: string // Optional for Gaana re-fetching
  title: string
  artist: string
  album: string
  duration: string
  coverUrl: string
  preview: string
  isFavorite: boolean
  source: string
}

const CATEGORIES = ['All', 'Familiar', 'Discover', 'Popular', 'Deep cuts']

interface Playlist {
  id: string
  name: string
  songs: Song[]
}

interface MusicAppProps {
  onBackToLanding: () => void
}

const DEFAULT_COVER = "/placeholder.png";

export default function MusicApp({ onBackToLanding }: MusicAppProps) {
  // --- Core State ---
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([])
  const [topCharts, setTopCharts] = useState<any[]>([])
  const [tracks, setTracks] = useState<Song[]>([])
  const [search, setSearch] = useState("")
  const [current, setCurrent] = useState<Song | null>(null)
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<Song[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [queue, setQueue] = useState<Song[]>([])
  
  // --- UI State ---
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'library' | 'favorites' | 'playlist'>('home')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [isFullScreenPlayerOpen, setIsFullScreenPlayerOpen] = useState(false)
  const [showPlaylistSelectorModal, setShowPlaylistSelectorModal] = useState(false)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState<'off' | 'one' | 'all'>('off')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [showAddSongSearch, setShowAddSongSearch] = useState(false)
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('')
  const [playlistSearchResults, setPlaylistSearchResults] = useState<Song[]>([])
  const [searchingInPlaylist, setSearchingInPlaylist] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showQueueSearch, setShowQueueSearch] = useState(false)
  const [queueSearchQuery, setQueueSearchQuery] = useState('')
  const [queueSearchResults, setQueueSearchResults] = useState<Song[]>([])
  const [searchingInQueue, setSearchingInQueue] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // --- Initialization ---
  useEffect(() => {
    loadTrending()
    const savedFavs = localStorage.getItem('melody-mentor-favorites')
    if (savedFavs) setFavorites(JSON.parse(savedFavs))
    const savedPlaylists = localStorage.getItem('melody-mentor-playlists')
    if (savedPlaylists) setPlaylists(JSON.parse(savedPlaylists))
  }, [])

  useEffect(() => {
    localStorage.setItem('melody-mentor-favorites', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem('melody-mentor-playlists', JSON.stringify(playlists))
  }, [playlists])

  useEffect(() => {
    if ('mediaSession' in navigator && current) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        album: current.album,
        artwork: [
          { src: current.coverUrl, sizes: '512x512', type: 'image/png' }
        ]
      })

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'

      navigator.mediaSession.setActionHandler('play', () => {
        audioRef.current?.play()
      })
      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause()
      })
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious())
      navigator.mediaSession.setActionHandler('nexttrack', () => playNext())
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (audioRef.current && details.seekTime) {
          audioRef.current.currentTime = details.seekTime
        }
      })
    }
  }, [current, isPlaying])

  // --- Music Logic ---
  const loadTrending = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/modules?language=english,hindi')
      const data = await res.json()
      if (data.trending) {
        const mapped = data.trending.map((s: any) => ({ ...s, isFavorite: favorites.some(f => f.id === s.id) }))
        setTrendingSongs(mapped)
        setTracks(mapped)
      }
      if (data.charts) setTopCharts(data.charts)
    } catch (e) { console.error(e) }
    finally { setTimeout(() => setLoading(false), 500) }
  }

  const handleSearch = async () => {
    if (!search.trim()) return
    setLoading(true)
    setCurrentView('search')
    try {
      const res = await fetch(`/api/songs?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      const raw = Array.isArray(data) ? data : (data.songs || [])
      setTracks(raw.map((s: any) => ({ ...s, isFavorite: favorites.some(f => f.id === s.id) })))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const playCollection = (songs: Song[]) => {
    if (songs.length === 0) return
    setQueue(songs)
    playTrack(songs[0])
  }

  const playTrack = async (song: Song, openFullScreen = true) => {
    let songToPlay = { ...song };

    // Auto-refresh stream URL for Gaana tracks (they are time-sensitive)
    if (song.source === 'gaana' && song.seokey) {
      try {
        const res = await fetch(`/api/songs/info?seokey=${song.seokey}&source=gaana`)
        if (res.ok) {
          const freshData = await res.json()
          if (freshData.preview) {
            songToPlay = { ...freshData, id: song.id, isFavorite: song.isFavorite };
          }
        }
      } catch (e) { 
        console.error("Gaana refresh failed, using fallback:", e)
        // Fallback to title+artist search if seokey info fails
        if (!songToPlay.preview) {
          try {
            const res = await fetch(`/api/songs?search=${encodeURIComponent(song.title + ' ' + song.artist)}`)
            const data = await res.json()
            const results = Array.isArray(data) ? data : (data.songs || [])
            if (results.length > 0) songToPlay = { ...results[0], id: song.id };
          } catch (e2) { console.error("Search fallback failed:", e2) }
        }
      }
    } else if (!songToPlay.preview) {
      // General fallback for any track missing a preview
      try {
        const res = await fetch(`/api/songs?search=${encodeURIComponent(song.title + ' ' + song.artist)}`)
        const data = await res.json()
        const results = Array.isArray(data) ? data : (data.songs || [])
        if (results.length > 0) songToPlay = { ...results[0], id: song.id };
      } catch (e) { console.error("Auto-fetch failed:", e) }
    }

    setCurrent(songToPlay)
    setIsPlaying(true)
    if (openFullScreen) setIsFullScreenPlayerOpen(true)
    
    if (audioRef.current) {
      // Cleanup previous HLS instance if it exists
      if ((window as any).hls) {
        (window as any).hls.destroy();
        (window as any).hls = null;
      }

      const isHLS = songToPlay.preview?.includes('.m3u8')
      
      if (isHLS && Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(songToPlay.preview);
        hls.attachMedia(audioRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          audioRef.current?.play().catch(err => console.error("Playback failed:", err));
        });
        (window as any).hls = hls;
      } else if (songToPlay.preview) {
        audioRef.current.src = songToPlay.preview;
        audioRef.current.load();
        audioRef.current.play().catch(err => console.error("Playback failed:", err));
      }
    }
  }

  const toggleFavorite = (song: Song) => {
    if (favorites.find(f => f.id === song.id)) {
      setFavorites(favorites.filter(f => f.id !== song.id))
    } else {
      setFavorites([...favorites, song])
    }
  }

  const addToPlaylist = (song: Song, playlistId: string) => {
    setPlaylists(playlists.map(p => {
      if (p.id === playlistId && !p.songs.find(s => s.id === song.id)) {
        return { ...p, songs: [...p.songs, song] }
      }
      return p
    }))
  }

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause()
      else audioRef.current.play()
      setIsPlaying(!isPlaying)
    }
  }

  const handleVolumeChange = (v: number) => {
    setVolume(v)
    if (audioRef.current) {
      audioRef.current.volume = v
      setIsMuted(v === 0)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      const newMute = !isMuted
      setIsMuted(newMute)
      audioRef.current.volume = newMute ? 0 : volume
    }
  }

  const removeFromQueue = (songId: string) => {
    setQueue(prev => prev.filter(s => s.id !== songId))
  }

  const addToQueue = (song: Song) => {
    if (!queue.find(s => s.id === song.id)) {
      setQueue(prev => [...prev, song])
    }
  }

  const handleQueueSearch = async () => {
    if (!queueSearchQuery.trim()) return
    setSearchingInQueue(true)
    try {
      const res = await fetch(`/api/songs?search=${encodeURIComponent(queueSearchQuery)}`)
      const data = await res.json()
      const raw = Array.isArray(data) ? data : (data.songs || [])
      setQueueSearchResults(raw)
    } catch (e) { console.error(e) }
    finally { setSearchingInQueue(false) }
  }

  const playNext = () => {
    const songList = queue.length > 0 ? queue : trendingSongs
    if (songList.length === 0) return
    const index = songList.findIndex(s => s.id === current?.id)
    const nextIndex = (index + 1) % songList.length
    playTrack(songList[nextIndex], false)
  }

  const playPrevious = () => {
    const songList = queue.length > 0 ? queue : trendingSongs
    if (songList.length === 0) return
    const index = songList.findIndex(s => s.id === current?.id)
    const prevIndex = (index - 1 + songList.length) % songList.length
    playTrack(songList[prevIndex], false)
  }

  const handlePlaylistSearch = async () => {
    if (!playlistSearchQuery.trim()) return
    setSearchingInPlaylist(true)
    try {
      const res = await fetch(`/api/songs?search=${encodeURIComponent(playlistSearchQuery)}`)
      const data = await res.json()
      const raw = Array.isArray(data) ? data : (data.songs || [])
      setPlaylistSearchResults(raw)
    } catch (e) { console.error(e) }
    finally { setSearchingInPlaylist(false) }
  }

  const curatedPlaylists = [
    { 
      id: 'hype_vibe', 
      name: 'Hype your Vibe', 
      image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&auto=format&fit=crop&q=60',
      songs: [
        { id: 'unstoppable', title: 'Unstoppable', artist: 'Sia', album: 'This Is Acting', duration: '3:37', coverUrl: 'https://c.saavncdn.com/159/This-Is-Acting-English-2016-500x500.jpg', preview: '', isFavorite: false, source: 'gaana' },
        { id: 'woman', title: 'Woman', artist: 'Doja Cat', album: 'Planet Her', duration: '2:52', coverUrl: 'https://c.saavncdn.com/831/Planet-Her-English-2021-20210624192617-500x500.jpg', preview: '', isFavorite: false, source: 'gaana' },
        { id: 'heat_waves', title: 'Heat Waves', artist: 'Glass Animals', album: 'Dreamland', duration: '3:58', coverUrl: 'https://c.saavncdn.com/269/Dreamland-English-2020-20200806202421-500x500.jpg', preview: '', isFavorite: false, source: 'gaana' },
        { id: 'say_my_name', title: 'Say My Name', artist: 'David Guetta', album: '7', duration: '3:18', coverUrl: 'https://c.saavncdn.com/791/7-English-2018-20180913165239-500x500.jpg', preview: '', isFavorite: false, source: 'gaana' },
        { id: 'living_hell', title: 'Living Hell', artist: 'Bella Poarch', album: 'Dolls', duration: '2:53', coverUrl: 'https://c.saavncdn.com/247/Dolls-English-2022-20220810141629-500x500.jpg', preview: '', isFavorite: false, source: 'gaana' },
        { id: '7_rings', title: '7 rings', artist: 'Ariana Grande', album: 'thank u, next', duration: '2:58', coverUrl: 'https://c.saavncdn.com/978/thank-u-next-English-2019-20190207163013-500x500.jpg', preview: '', isFavorite: false, source: 'gaana' }
      ]
    },
    { 
      id: 'midnight_city', 
      name: 'Midnight City', 
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60', 
      songs: [
        { id: 'blinding_lights', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: '3:20', coverUrl: 'https://c.saavncdn.com/743/After-Hours-English-2020-20200320000000-500x500.jpg', preview: '', isFavorite: false, source: 'gaana' },
        { id: 'starboy', title: 'Starboy', artist: 'The Weeknd', album: 'Starboy', duration: '3:50', coverUrl: 'https://c.saavncdn.com/937/Starboy-English-2016-500x500.jpg', preview: '', isFavorite: false, source: 'gaana' },
        { id: 'nightcall', title: 'Nightcall', artist: 'Kavinsky', album: 'OutRun', duration: '4:18', coverUrl: 'https://i1.sndcdn.com/artworks-000047321683-16788h-t500x500.jpg', preview: '', isFavorite: false, source: 'gaana' }
      ]
    },
    { 
      id: 'workout_hits', 
      name: 'Power Workout', 
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=60', 
      songs: [
        { id: 'believer', title: 'Believer', artist: 'Imagine Dragons', album: 'Evolve', duration: '3:24', coverUrl: 'https://c.saavncdn.com/624/Evolve-English-2017-500x500.jpg', preview: '', isFavorite: false, source: 'gaana' },
        { id: 'stronger', title: 'Stronger', artist: 'Kanye West', album: 'Graduation', duration: '5:11', coverUrl: 'https://c.saavncdn.com/839/Graduation-English-2007-500x500.jpg', preview: '', isFavorite: false, source: 'gaana' }
      ]
    },
    { 
      id: 'desi_hits', 
      name: 'Desi Hits', 
      image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&auto=format&fit=crop&q=60', 
      songs: [
        { id: 'pasoori', title: 'Pasoori', artist: 'Ali Sethi', album: 'Coke Studio', duration: '3:44', coverUrl: 'https://c.saavncdn.com/348/Pasoori-Punjabi-2022-20220203184918-500x500.jpg', preview: '', isFavorite: false, source: 'gaana' },
        { id: 'brown_munde', title: 'Brown Munde', artist: 'AP Dhillon', album: 'Brown Munde', duration: '4:27', coverUrl: 'https://c.saavncdn.com/007/Brown-Munde-Punjabi-2020-20200918070805-500x500.jpg', preview: '', isFavorite: false, source: 'gaana' }
      ]
    }
  ]

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return
    const newPlaylist = { id: Date.now().toString(), name: newPlaylistName, songs: [] }
    setPlaylists([...playlists, newPlaylist])
    setNewPlaylistName('')
    setShowCreateModal(false)
  }

  // --- UI Components ---
  const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-md transition-colors duration-200 ${active ? 'bg-[#282828] text-white' : 'text-[#a7a7a7] hover:text-white'}`}
    >
      <Icon className="w-6 h-6" />
      <span className="font-bold text-sm tracking-tight lg:block hidden">{label}</span>
    </button>
  )

  const SongCard = ({ song }: { song: Song }) => (
    <div 
      className="group bg-[#181818] p-4 rounded-xl border border-white/5 hover:bg-[#242424] transition-colors duration-200 cursor-pointer relative shadow-md"
      onClick={() => {
        if (currentView === 'home') setQueue(trendingSongs);
        else if (currentView === 'search') setQueue(tracks);
        else if (currentView === 'favorites') setQueue(favorites);
        playTrack(song);
      }}
    >
      <div className="aspect-square bg-[#121212] rounded-lg overflow-hidden mb-4 relative">
        <img 
          src={song.coverUrl || DEFAULT_COVER} 
          className="w-full h-full object-cover" 
          alt="" 
          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_COVER }}
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-md">
            <Play className="w-5 h-5 fill-current ml-1" />
          </div>
        </div>
        {/* Source Badge */}
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white/90 text-[8px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-white/10 uppercase">
          {song.source === 'gaana' ? 'G' : 'J'}
        </div>
      </div>
      <h4 className="font-semibold text-white text-sm truncate leading-none mb-2 px-1">{song.title}</h4>
      <p className="text-[#a7a7a7] text-[10px] font-medium tracking-normal truncate px-1">{song.artist}</p>
      <button 
        onClick={(e) => { e.stopPropagation(); toggleFavorite(song); }}
        className={`absolute top-6 right-6 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-colors duration-200 ${favorites.some(f => f.id === song.id) ? 'bg-rose-500 text-white' : 'bg-black/60 text-white hover:text-rose-500'}`}
      >
        <Heart className={`w-3.5 h-3.5 ${favorites.some(f => f.id === song.id) ? 'fill-current' : ''}`} />
      </button>
    </div>
  )

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans selection:bg-primary/30">
      <audio 
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={playNext}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => {
          console.error("Audio error:", e)
          setIsPlaying(false)
        }}
        preload="auto"
      />

      {/* Sidebar */}
      <aside className="hidden md:flex w-20 lg:w-72 flex-col bg-black border-r border-white/5 p-6 z-40">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
            <Zap className="w-6 h-6 text-white fill-current" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tighter lg:block hidden">MelodyMentor</h1>
        </div>

        <div className="space-y-3 mb-12">
          <NavItem icon={Home} label="Home" active={currentView === 'home'} onClick={() => setCurrentView('home')} />
          <NavItem icon={Search} label="Search" active={currentView === 'search'} onClick={() => setCurrentView('search')} />
          <NavItem icon={Library} label="Library" active={currentView === 'library'} onClick={() => setCurrentView('library')} />
          <NavItem icon={Heart} label="Favorites" active={currentView === 'favorites'} onClick={() => setCurrentView('favorites')} />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between px-4 mb-6">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] lg:block hidden">Playlists</span>
            <button onClick={() => setShowCreateModal(true)} className="text-slate-500 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-1">
            {playlists.map(p => (
              <button 
                key={p.id}
                onClick={() => { setSelectedPlaylistId(p.id); setCurrentView('playlist'); }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-colors duration-200 ${selectedPlaylistId === p.id && currentView === 'playlist' ? 'bg-white/5 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={onBackToLanding}
          className="mt-auto flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-bold text-sm lg:block hidden">Exit Landing</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 relative flex flex-col pb-20 md:pb-0 min-w-0 ${isFullScreenPlayerOpen ? 'bg-black' : 'bg-black'}`}>
        {/* Top Header (YouTube Music Style) */}
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-10 shrink-0 z-40 bg-inherit border-b border-white/5">
          <div className="flex items-center gap-10 flex-1">
            <div className="hidden md:flex items-center gap-3 bg-white/5 hover:bg-[#242424] rounded-xl px-4 py-2.5 w-full max-w-2xl transition-colors duration-200 border border-white/5 group">
              <Search className="w-5 h-5 text-white/40 group-hover:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search songs, albums, artists, podcasts" 
                className="bg-transparent border-none outline-none text-sm font-medium w-full text-white placeholder:text-white/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-white/40 hover:text-white transition-colors"><Cast className="w-6 h-6" /></button>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-primary to-indigo-400 p-[2px]">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Harsh" alt="Profile" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
          <AnimatePresence mode="wait">
            {isFullScreenPlayerOpen ? (
              <motion.div 
                key="full-player"
                initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
                className="absolute top-0 left-0 right-0 bottom-0 md:bottom-24 z-[110] bg-black flex flex-col md:flex-row p-4 md:p-10 gap-6 md:gap-10 overflow-y-auto md:overflow-hidden"
              >
                {/* Desktop Layout (Side-by-side) */}
                <div className="hidden md:flex flex-1 w-full h-full gap-10">
                  {/* Left: Large Album Art */}
                  <div className="w-[55%] flex flex-col items-center justify-center min-h-0">
                    <div className="relative w-full max-w-[500px] aspect-square shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                      <img 
                        src={current?.coverUrl || DEFAULT_COVER} 
                        className="w-full h-full rounded-lg object-cover shadow-md" 
                        alt="" 
                      />
                    </div>
                  </div>

                  {/* Right: Queue / Tabs Panel */}
                  <div className="w-[45%] flex flex-col bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden">
                    <div className="flex items-center px-6 pt-6 gap-8 border-b border-white/5">
                      {['UP NEXT', 'LYRICS', 'RELATED'].map((tab, i) => (
                        <button key={tab} className={`text-[11px] font-semibold tracking-[0.2em] pb-4 transition-colors duration-200 ${i === 0 ? 'text-white border-b-2 border-white' : 'text-white/40 hover:text-white'}`}>
                          {tab}
                        </button>
                      ))}
                    </div>
                    
                    <div className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.1em] mb-0.5">Playing from</p>
                        <p className="text-sm font-semibold text-white">Your queue</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowQueueSearch(!showQueueSearch)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-full text-[11px] font-semibold uppercase tracking-normal border border-white/10 transition-colors"
                        >
                          {showQueueSearch ? 'Close Search' : 'Add to Queue'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setShowPlaylistSelectorModal(true); }} className="px-5 py-2 bg-white text-black rounded-full text-[11px] font-semibold uppercase tracking-normal flex items-center gap-2 hover:scale-105 active:scale-95 transition-colors duration-200">
                          <Plus className="w-4 h-4" /> Save
                        </button>
                      </div>
                    </div>

                    {/* Desktop Queue Search Inline */}
                    <AnimatePresence>
                      {showQueueSearch && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-4 overflow-hidden">
                          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="flex gap-2 mb-3">
                              <input 
                                type="text" placeholder="Search songs to add..." value={queueSearchQuery}
                                onChange={(e) => setQueueSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleQueueSearch()}
                                className="flex-1 bg-black/40 border border-white/5 rounded-lg px-4 py-2 text-xs text-white outline-none focus:border-primary"
                              />
                              <button onClick={handleQueueSearch} className="bg-primary text-white p-2 rounded-lg"><Search className="w-4 h-4" /></button>
                            </div>
                            <div className="max-h-40 overflow-y-auto no-scrollbar space-y-2">
                              {searchingInQueue ? <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /> : (
                                queueSearchResults.map(s => (
                                  <div key={s.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg group">
                                    <div className="flex items-center gap-3">
                                      <img src={s.coverUrl || DEFAULT_COVER} className="w-8 h-8 rounded" alt="" />
                                      <div className="min-w-0">
                                        <p className="text-[11px] font-semibold truncate">{s.title}</p>
                                        <p className="text-[9px] text-white/40 truncate">{s.artist}</p>
                                      </div>
                                    </div>
                                    <button onClick={() => addToQueue(s)} className="text-primary hover:bg-primary/20 p-1.5 rounded-full transition-colors"><Plus className="w-4 h-4" /></button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Filter Chips */}
                    <div className="px-6 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
                      {CATEGORIES.map(cat => (
                        <button key={cat} className={`px-4 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors duration-200 border ${cat === 'All' ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/5 hover:bg-[#242424]'}`}>
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
                      {queue.map((s, i) => (
                        <div 
                          key={`${s.id}-${i}`}
                          onClick={() => playTrack(s)}
                          className={`flex items-center gap-4 p-3 rounded-lg transition-colors duration-200 cursor-pointer group ${s.id === current?.id ? 'bg-[#242424]' : 'hover:bg-white/5'}`}
                        >
                          <div className="relative w-12 h-12 shrink-0">
                            <img src={s.coverUrl || DEFAULT_COVER} className="w-full h-full rounded-md object-cover" alt="" />
                            {s.id === current?.id && isPlaying && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-md">
                                <Volume2 className="w-5 h-5 text-primary fill-current" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className={`text-sm font-semibold truncate ${s.id === current?.id ? 'text-primary' : 'text-white'}`}>{s.title}</h5>
                            <p className="text-[10px] font-bold text-white/40 truncate uppercase tracking-normal">{s.artist}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-white/30 tabular-nums">{s.duration}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeFromQueue(s.id); }}
                              className="text-white/20 hover:text-rose-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile Layout (Structural Refactor to Fix Overlap) */}
                <div className="flex md:hidden flex-col w-full h-full bg-black overflow-y-auto no-scrollbar pt-12 pb-10">
                  {/* Top Bar (Shrink-0) */}
                  <div className="flex items-center justify-between px-2 mb-8 shrink-0">
                    <button onClick={() => setIsFullScreenPlayerOpen(false)} className="text-white/70 p-2"><ChevronDown className="w-7 h-7" /></button>
                    <div className="flex items-center gap-2 bg-[#181818] px-4 py-2 rounded-full border border-white/5">
                      <Headphones className="w-4 h-4 text-white" />
                      <span className="text-[10px] font-semibold tracking-normal text-white uppercase">Audio Only</span>
                    </div>
                    <button className="text-white/70 p-2"><MoreVertical className="w-6 h-6" /></button>
                  </div>

                  {/* Flexible Content Wrapper */}
                  <div className="flex flex-col flex-1 min-h-0">
                    {/* Centered Album Art (Flexible & Scaling) */}
                    <div className="flex-1 flex items-center justify-center min-h-0 px-6 mb-6">
                      <img 
                        src={current?.coverUrl || DEFAULT_COVER} 
                        className="h-full max-h-[320px] max-w-full aspect-square object-cover rounded-2xl shadow-2xl bg-[#121212]" 
                        alt="Album Art" 
                      />
                    </div>

                    {/* Track Info & Add to Playlist (Shrink-0) */}
                    <div className="px-6 mb-8 shrink-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h2 className="text-2xl font-bold text-white truncate mb-1">{current?.title}</h2>
                          <p className="text-lg font-medium text-[#a7a7a7] truncate">{current?.artist}</p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowPlaylistSelectorModal(true); }}
                          className="flex flex-col items-center gap-1.5 text-[#a7a7a7] hover:text-white transition-colors duration-200 shrink-0"
                        >
                          <Plus className="w-8 h-8" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Playlist</span>
                        </button>
                      </div>
                    </div>

                    {/* Progress & Playback Controls (Shrink-0) */}
                    <div className="px-4 mb-4 shrink-0">
                      <div className="mb-8">
                        <div className="w-full h-1 bg-[#181818] rounded-full relative mb-4">
                          <div className="absolute h-full bg-white rounded-full" style={{ width: `${(currentTime/duration)*100}%` }} />
                          <input 
                            type="range" min="0" max={duration} step="1" value={currentTime} 
                            onChange={(e) => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value) }} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-bold text-[#a7a7a7] tabular-nums tracking-widest">
                          <span>{Math.floor(currentTime/60)}:{String(Math.floor(currentTime%60)).padStart(2,'0')}</span>
                          <span>{Math.floor(duration/60)}:{String(Math.floor(duration%60)).padStart(2,'0')}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-2">
                        <button onClick={(e) => { e.stopPropagation(); setShuffle(!shuffle); }} className={`transition-colors duration-200 ${shuffle ? 'text-primary' : 'text-[#a7a7a7] hover:text-white'}`}><Shuffle className="w-6 h-6" /></button>
                        <button onClick={(e) => { e.stopPropagation(); playPrevious(); }} className="text-white p-2 active:scale-95 transition-transform"><SkipBack className="w-10 h-10 fill-current" /></button>
                        <button onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform">
                          {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); playNext(); }} className="text-white p-2 active:scale-95 transition-transform"><SkipForward className="w-10 h-10 fill-current" /></button>
                        <button onClick={(e) => { e.stopPropagation(); setRepeat(repeat === 'off' ? 'all' : 'off'); }} className={`transition-colors duration-200 ${repeat !== 'off' ? 'text-primary' : 'text-[#a7a7a7] hover:text-white'}`}><Repeat className="w-6 h-6" /></button>
                      </div>
                    </div>

                    {/* Mobile Queue / Up Next Section (Shrink-0 so it expands the scroll area) */}
                    <div className="px-4 mt-8 shrink-0 pb-10">
                      <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-4">
                        <div className="flex items-center justify-between mb-4 px-2">
                          <h3 className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.2em]">Up Next</h3>
                          <button 
                            onClick={() => setShowQueueSearch(!showQueueSearch)}
                            className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-3 py-1 rounded-full"
                          >
                            {showQueueSearch ? 'Close' : 'Add Songs'}
                          </button>
                        </div>

                        {/* Mobile Queue Search Inline */}
                        <AnimatePresence>
                          {showQueueSearch && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-6 overflow-hidden">
                              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <div className="flex gap-2 mb-4">
                                  <input 
                                    type="text" placeholder="Search to add..." value={queueSearchQuery}
                                    onChange={(e) => setQueueSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleQueueSearch()}
                                    className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary"
                                  />
                                </div>
                                <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
                                  {searchingInQueue ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto my-4" /> : (
                                    queueSearchResults.map(s => (
                                      <div key={s.id} className="flex items-center justify-between p-2 bg-white/5 rounded-xl">
                                        <div className="flex items-center gap-3">
                                          <img src={s.coverUrl || DEFAULT_COVER} className="w-10 h-10 rounded-lg" alt="" />
                                          <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate text-white">{s.title}</p>
                                            <p className="text-[10px] text-white/40 truncate uppercase">{s.artist}</p>
                                          </div>
                                        </div>
                                        <button onClick={() => addToQueue(s)} className="bg-white text-black p-2 rounded-full"><Plus className="w-4 h-4" /></button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="space-y-1">
                          {queue.map((s, i) => (
                            <div 
                              key={`${s.id}-${i}`}
                              onClick={() => playTrack(s)}
                              className={`flex items-center gap-4 p-3 rounded-xl transition-colors duration-200 cursor-pointer group ${s.id === current?.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                            >
                              <div className="relative w-12 h-12 shrink-0">
                                <img 
                                  src={s.coverUrl || DEFAULT_COVER} 
                                  className="w-full h-full rounded-md object-cover" 
                                  alt="" 
                                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_COVER }}
                                />
                                {s.id === current?.id && isPlaying && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-md">
                                    <Volume2 className="w-5 h-5 text-primary fill-current" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className={`text-sm font-semibold truncate ${s.id === current?.id ? 'text-primary' : 'text-white'}`}>{s.title}</h5>
                                <p className="text-[10px] font-bold text-white/40 truncate uppercase tracking-normal">{s.artist}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-white/30 tabular-nums">{s.duration}</span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); removeFromQueue(s.id); }}
                                  className="text-white/20 hover:text-rose-500 p-2"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="px-6 md:px-10 pb-52 md:pb-40"
              >
              {currentView === 'home' && (
                <div className="space-y-10">
                  {/* Mobile Header & Filters (Spotify Style) */}
                  <div className="md:hidden space-y-6">
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/5 overflow-hidden">
                        <img src="https://ui-avatars.com/api/?name=User&background=random" className="w-full h-full object-cover" alt="" />
                      </div>
                      <button className="px-5 py-2.5 bg-primary text-black rounded-full text-xs font-bold whitespace-nowrap shadow-lg shadow-primary/20 transition-all active:scale-95">All</button>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div 
                        onClick={() => setCurrentView('favorites')}
                        className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg overflow-hidden border border-white/5 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <div className="w-14 h-14 shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-700 to-indigo-900">
                          <Heart className="w-6 h-6 text-white fill-current" />
                        </div>
                        <p className="text-[11px] font-bold text-white pr-2 leading-tight">Liked Songs</p>
                      </div>
                      
                      {curatedPlaylists.slice(0, 5).map((p) => (
                        <div 
                          key={p.id} 
                          onClick={() => { 
                            if (p.songs.length > 0) {
                              setQueue(p.songs);
                              playTrack(p.songs[0]);
                            } else {
                              // If empty, search for related vibe
                              setSearch(p.name);
                              handleSearch();
                              setCurrentView('search');
                            }
                          }}
                          className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg overflow-hidden border border-white/5 transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                            <img 
                              src={p.image} 
                              className="w-full h-full object-cover" 
                              alt="" 
                              onError={(e) => { (p.songs.length > 0) ? (e.target as HTMLImageElement).src = p.songs[0].coverUrl : (e.target as HTMLImageElement).src = DEFAULT_COVER }}
                            />
                          </div>
                          <p className="text-[11px] font-bold text-white line-clamp-2 pr-2 leading-tight">{p.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Picked for you Section */}
                  <div className="md:hidden space-y-4">
                    <h3 className="text-2xl font-bold tracking-tight">Picked for you</h3>
                    {trendingSongs.length > 0 && (
                      <div 
                        onClick={() => { setQueue(trendingSongs); playTrack(trendingSongs[0]); }}
                        className="bg-[#181818] rounded-2xl overflow-hidden border border-white/5 flex flex-col active:scale-[0.99] transition-transform cursor-pointer"
                      >
                        <div className="relative aspect-[16/9] w-full">
                          <img src={trendingSongs[0].coverUrl || DEFAULT_COVER} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-4">
                            <h4 className="text-xl font-black text-white uppercase tracking-tighter">Featured Track</h4>
                            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Trending Now</p>
                          </div>
                        </div>
                        <div className="p-5 space-y-2">
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Daily Recommendation</p>
                          <h5 className="text-sm font-bold text-white leading-tight">{trendingSongs[0].title}</h5>
                          <p className="text-xs text-white/50 line-clamp-2 leading-relaxed font-medium">Experience the top trending track on MelodyMentor. {trendingSongs[0].title} by {trendingSongs[0].artist} is currently capturing listeners worldwide.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hero Section (Desktop Only) */}
                  <div className="hidden md:block">
                    {trendingSongs.length > 0 && (
                    <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden group shadow-md">
                    <img src={trendingSongs[0]?.coverUrl} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent flex flex-col justify-center p-12">
                      <span className="text-primary text-[10px] font-semibold uppercase tracking-[0.4em] mb-4">Trending Now</span>
                      <h2 className="text-4xl md:text-7xl font-semibold mb-6 tracking-tighter leading-none">{trendingSongs[0]?.title}</h2>
                      <p className="text-slate-300 font-bold mb-8 flex items-center gap-2"><Mic2 className="w-4 h-4" /> {trendingSongs[0]?.artist}</p>
                      <Button onClick={() => { setQueue(trendingSongs); playTrack(trendingSongs[0]); }} className="bg-white text-black hover:bg-primary hover:text-white rounded-full px-10 py-7 font-semibold uppercase tracking-normal text-xs flex items-center gap-3 w-fit shadow-md transition-colors duration-200">
                        <Play className="w-4 h-4 fill-current" /> Play Now
                      </Button>
                    </div>
                    </div>
                  )}

                  {/* Horizontal Charts */}
                  {topCharts.length > 0 && (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-semibold tracking-tight">Top Charts</h3>
                        <button className="text-primary text-xs font-semibold uppercase tracking-normal hover:underline">See All</button>
                      </div>
                      <div className="flex gap-8 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
                        {topCharts.map(c => (
                          <div key={c.id} className="min-w-[180px] group cursor-pointer" onClick={() => loadTrending()}>
                            <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative shadow-xl">
                              <img src={c.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-8 h-8 text-white fill-current" />
                              </div>
                            </div>
                            <h4 className="font-semibold text-sm truncate px-2">{c.title}</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-normal truncate px-2">{c.subtitle}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Discovery Grid */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-7 h-7 text-primary" />
                      <h3 className="text-2xl font-semibold tracking-tight">Discovery</h3>
                    </div>
                    {loading ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        {[1,2,3,4,5].map(i => <div key={i} className="aspect-square bg-white/5 rounded-2xl animate-pulse" />)}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        {trendingSongs.map(s => <SongCard key={s.id} song={s} />)}
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              )}

              {currentView === 'search' && (
                <div className="space-y-10 pt-4">
                  {/* Mobile Search Bar (Only visible on mobile because header search is hidden) */}
                  <div className="md:hidden flex items-center gap-3 bg-white/5 rounded-2xl px-5 py-4 border border-white/5 focus-within:border-primary transition-all">
                    <Search className="w-6 h-6 text-white/40" />
                    <input 
                      type="text" 
                      placeholder="Search songs, artists..." 
                      className="bg-transparent border-none outline-none text-base font-medium w-full text-white placeholder:text-white/20"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    {search && (
                      <button onClick={() => setSearch('')} className="text-white/20 hover:text-white"><X className="w-5 h-5" /></button>
                    )}
                  </div>

                  <h3 className="text-3xl font-semibold tracking-tighter hidden md:block">Search Results</h3>
                  {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                      {tracks.map(s => <SongCard key={s.id} song={s} />)}
                    </div>
                  )}
                </div>
              )}

              {currentView === 'library' && (
                <div className="space-y-10 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-semibold tracking-tighter">Your Collections</h3>
                    <Button onClick={() => setShowCreateModal(true)} className="bg-primary/10 text-primary hover:bg-primary/20 rounded-full px-6 py-2 text-[10px] font-semibold uppercase tracking-normal border border-primary/20">New Playlist</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Create New Card (Mobile Friendly) */}
                    <div onClick={() => setShowCreateModal(true)} className="md:hidden bg-white/5 border-2 border-dashed border-white/10 p-8 rounded-2xl flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-white hover:border-primary/40 transition-colors duration-200">
                      <Plus className="w-12 h-12" />
                      <span className="font-semibold text-xs uppercase tracking-normal">Create Playlist</span>
                    </div>
                    {playlists.map(p => (
                      <div key={p.id} onClick={() => { setSelectedPlaylistId(p.id); setCurrentView('playlist'); }} className="bg-gradient-to-br from-indigo-600 to-primary p-10 rounded-2xl shadow-md cursor-pointer hover:scale-105 transition-transform group relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform"><Music className="w-32 h-32" /></div>
                        <Music className="w-12 h-12 text-white/50 mb-8" />
                        <h4 className="text-2xl font-semibold text-white mb-2">{p.name}</h4>
                        <p className="text-white/60 text-xs font-semibold uppercase tracking-normal">{p.songs.length} Tracks</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentView === 'favorites' && (
                <div className="space-y-10 pt-4">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-semibold tracking-tighter">Loved Tracks</h3>
                    {favorites.length > 0 && (
                      <Button onClick={() => playCollection(favorites)} className="bg-white text-black hover:bg-primary hover:text-white rounded-full px-8 py-4 font-semibold uppercase tracking-normal text-[10px] flex items-center gap-2 transition-colors duration-200">
                        <Play className="w-4 h-4 fill-current" /> Play All
                      </Button>
                    )}
                  </div>
                  {favorites.length === 0 ? (
                    <div className="text-center py-24 bg-white/5 rounded-2xl border border-white/5">
                      <Heart className="w-16 h-16 text-slate-800 mx-auto mb-6" />
                      <p className="text-slate-500 font-bold">Your favorites list is empty. Start loving music!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                      {favorites.map(s => <SongCard key={s.id} song={s} />)}
                    </div>
                  )}
                </div>
              )}

              {currentView === 'playlist' && (
                <div className="space-y-6 md:space-y-10 pt-2">
                  <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 mb-8 md:mb-16">
                    <div className="w-32 h-32 md:w-56 md:h-56 bg-gradient-to-br from-primary to-indigo-700 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-md">
                      <Music className="w-16 h-16 md:w-28 md:h-28 text-white" />
                    </div>
                    <div className="text-center md:text-left">
                      <span className="text-primary text-[10px] font-semibold uppercase tracking-[0.4em] mb-2 md:mb-4 block">Personal Playlist</span>
                      <h2 className="text-3xl md:text-7xl font-semibold tracking-tighter leading-none mb-6 md:mb-8">{playlists.find(p => p.id === selectedPlaylistId)?.name}</h2>
                      <div className="flex items-center gap-3 md:gap-4 justify-center md:justify-start">
                        <Button 
                          onClick={() => {
                            const p = playlists.find(p => p.id === selectedPlaylistId);
                            if (p && p.songs.length > 0) playCollection(p.songs);
                          }} 
                          className="bg-white text-black hover:bg-primary hover:text-white rounded-full px-6 md:px-8 py-3 md:py-5 font-semibold uppercase tracking-normal text-[10px] md:text-xs flex items-center gap-2 transition-colors duration-200 shadow-xl"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Play All
                        </Button>
                        <Button onClick={() => setShowAddSongSearch(true)} variant="outline" className="border-2 border-white/5 text-white hover:bg-white/5 rounded-full px-6 md:px-8 py-3 md:py-5 font-semibold uppercase tracking-normal text-[10px] md:text-xs">Add Tracks</Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {playlists.find(p => p.id === selectedPlaylistId)?.songs.map((s, i) => (
                      <div key={s.id} onClick={() => playTrack(s)} className="flex items-center gap-4 md:gap-6 p-3 md:p-4 rounded-[1.5rem] hover:bg-white/5 transition-colors duration-200 cursor-pointer group">
                        <span className="w-6 text-base font-semibold text-slate-700 group-hover:text-primary transition-colors text-center hidden md:block">{i + 1}</span>
                        <img src={s.coverUrl || DEFAULT_COVER} className="w-16 h-16 md:w-14 md:h-14 rounded-xl object-cover shadow-lg" alt="" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white text-base md:text-base truncate leading-tight mb-1">{s.title}</h4>
                          <p className="text-sm md:text-[10px] font-bold text-slate-500 uppercase tracking-normal truncate">{s.artist}</p>
                        </div>
                        <span className="text-xs font-semibold text-slate-700 tabular-nums hidden md:block w-12 text-right">{s.duration}</span>
                        <button className="text-slate-600 hover:text-white p-2"><MoreHorizontal className="w-6 h-6" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>

    {/* Persistent Player Bar (YouTube Music Style) */}
    <AnimatePresence>
      {current && (
        <motion.div 
          initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
          className={`fixed bottom-20 md:bottom-0 left-0 right-0 h-20 md:h-24 bg-[#0a0a0a] border-t border-white/5 z-[120] px-4 md:px-10 items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)] ${isFullScreenPlayerOpen ? 'hidden md:flex' : 'flex'}`}
        >
          {/* Left: Controls */}
          <div className="flex items-center gap-4 md:gap-8 w-1/4">
            <button onClick={(e) => { e.stopPropagation(); playPrevious(); }} className="text-white hover:text-primary transition-colors duration-200 p-3 -m-3 group">
              <SkipBack className="w-6 h-6 md:w-8 md:h-8 fill-current group-active:scale-90 transition-transform" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} className="w-10 h-10 md:w-14 md:h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-colors duration-200 shadow-xl">
              {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" /> : <Play className="w-5 h-5 md:w-6 md:h-6 fill-current ml-0.5" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); playNext(); }} className="text-white hover:text-primary transition-colors duration-200 p-3 -m-3 group">
              <SkipForward className="w-6 h-6 md:w-8 md:h-8 fill-current group-active:scale-90 transition-transform" />
            </button>
            <span className="hidden md:block text-[11px] font-bold text-white/40 tabular-nums">
              {Math.floor(currentTime/60)}:{String(Math.floor(currentTime%60)).padStart(2,'0')} / {Math.floor(duration/60)}:{String(Math.floor(duration%60)).padStart(2,'0')}
            </span>
          </div>

          {/* Center: Track Details */}
          <div className="flex items-center justify-center gap-4 flex-1 min-w-0 px-10 cursor-pointer" onClick={() => setIsFullScreenPlayerOpen(true)}>
            <img src={current.coverUrl || DEFAULT_COVER} className="w-10 h-10 md:w-12 md:h-12 rounded-md object-cover shadow-xl" alt="" />
            <div className="text-center min-w-0">
              <h4 className="text-sm font-semibold text-white truncate mb-0.5">{current.title}</h4>
              <p className="text-[10px] font-bold text-white/40 truncate uppercase tracking-[0.1em]">{current.artist}</p>
            </div>
            <div className="hidden md:flex items-center gap-1 ml-4">
              <button onClick={(e) => e.stopPropagation()} className="text-white/40 hover:text-white p-2"><ThumbsDown className="w-4 h-4" /></button>
              <button onClick={(e) => e.stopPropagation()} className="text-white/40 hover:text-white p-2"><ThumbsUp className="w-4 h-4" /></button>
              <button onClick={(e) => e.stopPropagation()} className="text-white/40 hover:text-white p-2"><MoreVertical className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Right: Sound & Tools */}
          <div className="flex items-center justify-end gap-6 w-1/4">
            <div className="hidden lg:flex items-center gap-4 group/vol">
              <Volume2 className="w-5 h-5 text-white/40 group-hover/vol:text-white transition-colors" />
              <div className="w-24 h-1 bg-[#242424] rounded-full relative overflow-hidden">
                <div className="absolute h-full bg-white rounded-full" style={{ width: `${volume * 100}%` }} />
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => handleVolumeChange(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setRepeat(repeat === 'off' ? 'all' : 'off'); }} className={`transition-colors ${repeat !== 'off' ? 'text-primary' : 'text-white/40 hover:text-white'}`}><Repeat className="w-5 h-5" /></button>
            <button onClick={(e) => { e.stopPropagation(); setShuffle(!shuffle); }} className={`transition-colors ${shuffle ? 'text-primary' : 'text-white/40 hover:text-white'}`}><Shuffle className="w-5 h-5" /></button>
            <button onClick={(e) => { e.stopPropagation(); setIsFullScreenPlayerOpen(!isFullScreenPlayerOpen); }} className="text-white/40 hover:text-white transition-colors"><ChevronDown className={`w-6 h-6 transition-transform ${isFullScreenPlayerOpen ? 'rotate-180' : ''}`} /></button>
          </div>

          {/* Progress Bar (Global) */}
          <div className="absolute top-0 left-0 right-0 h-1 md:h-[2px] bg-[#242424] overflow-hidden">
            <div className="h-full bg-primary transition-colors duration-200" style={{ width: `${(currentTime/duration)*100}%` }} />
            <input 
              type="range" min="0" max={duration} step="1" value={currentTime} 
              onChange={(e) => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value) }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      {!isFullScreenPlayerOpen && (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#181818] border-t border-white/5 flex md:hidden items-center justify-around z-[55] px-6 pb-2">
          <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1.5 ${currentView === 'home' ? 'text-primary' : 'text-slate-500'}`}>
            <Home className={`w-7 h-7 ${currentView === 'home' ? 'fill-current' : ''}`} />
            <span className="text-[11px] font-semibold uppercase tracking-normal">Home</span>
          </button>
          <button onClick={() => setCurrentView('search')} className={`flex flex-col items-center gap-1.5 ${currentView === 'search' ? 'text-primary' : 'text-slate-500'}`}>
            <Search className="w-7 h-7" />
            <span className="text-[11px] font-semibold uppercase tracking-normal">Search</span>
          </button>
          <button onClick={() => setCurrentView('library')} className={`flex flex-col items-center gap-1.5 ${currentView === 'library' || currentView === 'playlist' ? 'text-primary' : 'text-slate-500'}`}>
            <ListMusic className={`w-7 h-7 ${currentView === 'library' || currentView === 'playlist' ? 'fill-current' : ''}`} />
            <span className="text-[11px] font-semibold uppercase tracking-normal">Playlists</span>
          </button>
          <button onClick={() => setCurrentView('favorites')} className={`flex flex-col items-center gap-1.5 ${currentView === 'favorites' ? 'text-primary' : 'text-slate-500'}`}>
            <Heart className={`w-7 h-7 ${currentView === 'favorites' ? 'fill-current' : ''}`} />
            <span className="text-[11px] font-semibold uppercase tracking-normal">Loved</span>
          </button>
        </nav>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showPlaylistSelectorModal && current && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPlaylistSelectorModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-slate-900 border border-white/10 p-10 rounded-2xl w-full max-w-sm shadow-md">
              <h3 className="text-2xl font-semibold mb-6 tracking-tighter">Add to Playlist</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                {playlists.length === 0 ? (
                  <p className="text-slate-500 font-bold text-center py-4">No playlists yet</p>
                ) : (
                  playlists.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => { addToPlaylist(current, p.id); setShowPlaylistSelectorModal(false); }}
                      className="w-full text-left p-4 bg-white/5 hover:bg-[#242424] rounded-2xl transition-colors font-semibold text-sm"
                    >
                      {p.name}
                    </button>
                  ))
                )}
              </div>
              <Button onClick={() => setShowPlaylistSelectorModal(false)} className="w-full mt-6 rounded-2xl h-14 bg-[#121212] border border-white/5 text-slate-400 font-semibold uppercase tracking-normal text-[10px]">Close</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-slate-900 border border-white/10 p-12 rounded-3xl w-full max-w-md shadow-md">
              <h3 className="text-3xl font-semibold mb-8 tracking-tighter">New Collection</h3>
              <input 
                autoFocus type="text" placeholder="Name your playlist" value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createPlaylist()}
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white outline-none focus:border-primary transition-colors duration-200 mb-8 font-bold"
              />
              <div className="flex gap-4">
                <Button onClick={() => setShowCreateModal(false)} variant="ghost" className="flex-1 rounded-2xl h-14 text-slate-500 font-bold uppercase tracking-normal text-[10px]">Cancel</Button>
                <Button onClick={createPlaylist} className="flex-1 bg-primary text-white rounded-2xl h-14 font-semibold uppercase tracking-normal text-[10px]">Create</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddSongSearch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddSongSearch(false)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="relative bg-slate-900 border border-white/10 p-10 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-md">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-semibold tracking-tighter">Find Tracks</h3>
                <button onClick={() => setShowAddSongSearch(false)} className="text-slate-500 hover:text-white"><X className="w-8 h-8" /></button>
              </div>
              <input 
                autoFocus type="text" placeholder="Search for songs or artists..." value={playlistSearchQuery}
                onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePlaylistSearch()}
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white outline-none focus:border-primary transition-colors duration-200 mb-8 font-bold"
              />
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                {searchingInPlaylist ? <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto my-10" /> : (
                  playlistSearchResults.map(s => (
                    <div key={s.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl hover:bg-[#242424] transition-colors duration-200 group">
                      <img src={s.coverUrl || DEFAULT_COVER} className="w-12 h-12 rounded-xl" alt="" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate leading-none mb-1">{s.title}</h4>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-normal truncate">{s.artist}</p>
                      </div>
                      <Button 
                        onClick={() => { addToPlaylist(s, selectedPlaylistId!); setShowAddSongSearch(false); }}
                        className="bg-white text-black hover:bg-primary hover:text-white rounded-xl px-6 py-2 text-[10px] font-semibold uppercase tracking-normal"
                      >Add</Button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modals and other global elements remain here */}
    </div>
  )
}
