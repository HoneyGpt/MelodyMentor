import { useState, useEffect, useRef } from 'react'
import { Search, Play, Heart, Music, Pause, Star, ListMusic, Home, LogOut, Loader2, TrendingUp, SkipForward, SkipBack, Plus, Shuffle, Repeat, X, Library, Mic2, Bell, User, Settings, MoreHorizontal, Zap, Volume2, Volume1, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SongFloatingCard from '@/components/SongFloatingCard'
import { motion, AnimatePresence } from 'framer-motion'

interface Song {
  id: string
  title: string
  artist: string
  album: string
  duration: string
  coverUrl: string
  preview: string
  isFavorite: boolean
  source: string
}

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

  const playTrack = (song: Song) => {
    setCurrent(song)
    setIsPlaying(true)
    setIsFullScreenPlayerOpen(true)
    if (audioRef.current) {
      audioRef.current.src = song.preview
      audioRef.current.load()
      audioRef.current.play()
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

  const playNext = () => {
    if (queue.length === 0) return
    const index = queue.findIndex(s => s.id === current?.id)
    const nextIndex = (index + 1) % queue.length
    playTrack(queue[nextIndex])
  }

  const playPrevious = () => {
    if (queue.length === 0) return
    const index = queue.findIndex(s => s.id === current?.id)
    const prevIndex = (index - 1 + queue.length) % queue.length
    playTrack(queue[prevIndex])
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
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ${active ? 'bg-primary/20 text-primary shadow-lg shadow-primary/5' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
    >
      <Icon className={`w-6 h-6 ${active ? 'fill-current' : ''}`} />
      <span className="font-bold text-sm tracking-tight lg:block hidden">{label}</span>
    </button>
  )

  const SongCard = ({ song }: { song: Song }) => (
    <motion.div 
      whileHover={{ y: -8 }}
      className="group bg-white/5 p-4 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all cursor-pointer relative shadow-xl"
      onClick={() => {
        if (currentView === 'home') setQueue(trendingSongs);
        else if (currentView === 'search') setQueue(tracks);
        else if (currentView === 'favorites') setQueue(favorites);
        playTrack(song);
      }}
    >
      <div className="aspect-square bg-slate-800 rounded-[2rem] overflow-hidden mb-4 relative">
        <img src={song.coverUrl || DEFAULT_COVER} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all">
            <Play className="w-5 h-5 fill-current ml-1" />
          </div>
        </div>
      </div>
      <h4 className="font-black text-white text-sm truncate leading-none mb-2 px-1">{song.title}</h4>
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest truncate px-1">{song.artist}</p>
      <button 
        onClick={(e) => { e.stopPropagation(); toggleFavorite(song); }}
        className={`absolute top-6 right-6 p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all ${favorites.some(f => f.id === song.id) ? 'bg-rose-500 text-white' : 'bg-black/40 text-white hover:text-rose-500'}`}
      >
        <Heart className={`w-3.5 h-3.5 ${favorites.some(f => f.id === song.id) ? 'fill-current' : ''}`} />
      </button>
    </motion.div>
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
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-2xl shadow-primary/20">
            <Zap className="w-6 h-6 text-white fill-current" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter lg:block hidden">MelodyMentor</h1>
        </div>

        <div className="space-y-3 mb-12">
          <NavItem icon={Home} label="Home" active={currentView === 'home'} onClick={() => setCurrentView('home')} />
          <NavItem icon={Search} label="Search" active={currentView === 'search'} onClick={() => setCurrentView('search')} />
          <NavItem icon={Library} label="Library" active={currentView === 'library'} onClick={() => setCurrentView('library')} />
          <NavItem icon={Heart} label="Favorites" active={currentView === 'favorites'} onClick={() => setCurrentView('favorites')} />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between px-4 mb-6">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] lg:block hidden">Playlists</span>
            <button onClick={() => setShowCreateModal(true)} className="text-slate-500 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-1">
            {playlists.map(p => (
              <button 
                key={p.id}
                onClick={() => { setSelectedPlaylistId(p.id); setCurrentView('playlist'); }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedPlaylistId === p.id && currentView === 'playlist' ? 'bg-white/5 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={onBackToLanding}
          className="mt-auto flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-bold text-sm lg:block hidden">Exit Landing</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        <header className="flex items-center justify-between p-4 md:p-6 md:px-10 z-30">
          <div className="flex-1 max-w-2xl relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search tracks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-white/5 border border-white/5 rounded-[2rem] pl-12 pr-6 py-3 md:py-4 text-xs md:text-sm font-bold outline-none focus:bg-white/10 focus:border-primary/40 transition-all"
            />
          </div>
          <div className="flex items-center gap-3 md:gap-6 ml-4 md:ml-10">
            <button className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors">
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
            </button>
            <div className="flex items-center gap-4 pl-4 md:pl-6 border-l border-white/5">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/5 shadow-xl">
                <User className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-6 md:px-10 pb-40">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {currentView === 'home' && (
                <div className="space-y-12">
                  {/* Hero Section */}
                  {trendingSongs.length > 0 && (
                  <div className="relative h-64 md:h-80 rounded-[3rem] overflow-hidden group shadow-2xl">
                    <img src={trendingSongs[0]?.coverUrl} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent flex flex-col justify-center p-12">
                      <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-4">Trending Now</span>
                      <h2 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter leading-none">{trendingSongs[0]?.title}</h2>
                      <p className="text-slate-300 font-bold mb-8 flex items-center gap-2"><Mic2 className="w-4 h-4" /> {trendingSongs[0]?.artist}</p>
                      <Button onClick={() => { setQueue(trendingSongs); playTrack(trendingSongs[0]); }} className="bg-white text-black hover:bg-primary hover:text-white rounded-full px-10 py-7 font-black uppercase tracking-widest text-xs flex items-center gap-3 w-fit shadow-2xl transition-all">
                        <Play className="w-4 h-4 fill-current" /> Play Now
                      </Button>
                    </div>
                    </div>
                  )}

                  {/* Horizontal Charts */}
                  {topCharts.length > 0 && (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black tracking-tight">Top Charts</h3>
                        <button className="text-primary text-xs font-black uppercase tracking-widest hover:underline">See All</button>
                      </div>
                      <div className="flex gap-8 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
                        {topCharts.map(c => (
                          <div key={c.id} className="min-w-[180px] group cursor-pointer" onClick={() => loadTrending()}>
                            <div className="aspect-square rounded-[2.5rem] overflow-hidden mb-4 relative shadow-xl">
                              <img src={c.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-8 h-8 text-white fill-current" />
                              </div>
                            </div>
                            <h4 className="font-black text-sm truncate px-2">{c.title}</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate px-2">{c.subtitle}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Discovery Grid */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-7 h-7 text-primary" />
                      <h3 className="text-2xl font-black tracking-tight">Discovery</h3>
                    </div>
                    {loading ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        {[1,2,3,4,5].map(i => <div key={i} className="aspect-square bg-white/5 rounded-[2.5rem] animate-pulse" />)}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        {trendingSongs.map(s => <SongCard key={s.id} song={s} />)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentView === 'search' && (
                <div className="space-y-10 pt-4">
                  <h3 className="text-3xl font-black tracking-tighter">Search Results</h3>
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
                    <h3 className="text-3xl font-black tracking-tighter">Your Collections</h3>
                    <Button onClick={() => setShowCreateModal(true)} className="bg-primary/10 text-primary hover:bg-primary/20 rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest border border-primary/20">New Playlist</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Create New Card (Mobile Friendly) */}
                    <div onClick={() => setShowCreateModal(true)} className="md:hidden bg-white/5 border-2 border-dashed border-white/10 p-8 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-white hover:border-primary/40 transition-all">
                      <Plus className="w-12 h-12" />
                      <span className="font-black text-xs uppercase tracking-widest">Create Playlist</span>
                    </div>
                    {playlists.map(p => (
                      <div key={p.id} onClick={() => { setSelectedPlaylistId(p.id); setCurrentView('playlist'); }} className="bg-gradient-to-br from-indigo-600 to-primary p-10 rounded-[3rem] shadow-2xl cursor-pointer hover:scale-105 transition-transform group relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform"><Music className="w-32 h-32" /></div>
                        <Music className="w-12 h-12 text-white/50 mb-8" />
                        <h4 className="text-2xl font-black text-white mb-2">{p.name}</h4>
                        <p className="text-white/60 text-xs font-black uppercase tracking-widest">{p.songs.length} Tracks</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentView === 'favorites' && (
                <div className="space-y-10 pt-4">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-black tracking-tighter">Loved Tracks</h3>
                    {favorites.length > 0 && (
                      <Button onClick={() => playCollection(favorites)} className="bg-white text-black hover:bg-primary hover:text-white rounded-full px-8 py-4 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all">
                        <Play className="w-4 h-4 fill-current" /> Play All
                      </Button>
                    )}
                  </div>
                  {favorites.length === 0 ? (
                    <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-white/5">
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
                    <div className="w-32 h-32 md:w-56 md:h-56 bg-gradient-to-br from-primary to-indigo-700 rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-center shadow-2xl">
                      <Music className="w-16 h-16 md:w-28 md:h-28 text-white" />
                    </div>
                    <div className="text-center md:text-left">
                      <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 md:mb-4 block">Personal Playlist</span>
                      <h2 className="text-3xl md:text-7xl font-black tracking-tighter leading-none mb-6 md:mb-8">{playlists.find(p => p.id === selectedPlaylistId)?.name}</h2>
                      <div className="flex items-center gap-3 md:gap-4 justify-center md:justify-start">
                        <Button 
                          onClick={() => {
                            const p = playlists.find(p => p.id === selectedPlaylistId);
                            if (p && p.songs.length > 0) playCollection(p.songs);
                          }} 
                          className="bg-white text-black hover:bg-primary hover:text-white rounded-full px-6 md:px-8 py-3 md:py-5 font-black uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-2 transition-all shadow-xl"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Play All
                        </Button>
                        <Button onClick={() => setShowAddSongSearch(true)} variant="outline" className="border-2 border-white/5 text-white hover:bg-white/5 rounded-full px-6 md:px-8 py-3 md:py-5 font-black uppercase tracking-widest text-[10px] md:text-xs">Add Tracks</Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {playlists.find(p => p.id === selectedPlaylistId)?.songs.map((s, i) => (
                      <div key={s.id} onClick={() => playTrack(s)} className="flex items-center gap-4 md:gap-6 p-3 md:p-4 rounded-[1.5rem] hover:bg-white/5 transition-all cursor-pointer group">
                        <span className="w-6 text-base font-black text-slate-700 group-hover:text-primary transition-colors text-center hidden md:block">{i + 1}</span>
                        <img src={s.coverUrl || DEFAULT_COVER} className="w-16 h-16 md:w-14 md:h-14 rounded-xl object-cover shadow-lg" alt="" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-white text-base md:text-base truncate leading-tight mb-1">{s.title}</h4>
                          <p className="text-sm md:text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{s.artist}</p>
                        </div>
                        <span className="text-xs font-black text-slate-700 tabular-nums hidden md:block w-12 text-right">{s.duration}</span>
                        <button className="text-slate-600 hover:text-white p-2"><MoreHorizontal className="w-6 h-6" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Player Bar (Floating Island) */}
        {current && (
          <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }}
            className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-[calc(18rem+2rem)] md:right-10 z-50 bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-3 md:p-6 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)]"
            onClick={() => setIsFullScreenPlayerOpen(true)}
          >
            <div className="flex flex-col gap-2 md:gap-4">
              <div className="flex items-center gap-4 lg:gap-12">
                <div 
                  className="flex items-center gap-4 cursor-pointer min-w-0 flex-1 lg:flex-initial lg:w-72 group"
                >
                  <img src={current.coverUrl || DEFAULT_COVER} className="w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover shadow-2xl group-hover:scale-105 transition-transform" alt="" />
                  <div className="min-w-0">
                    <h5 className="font-black text-white text-base md:text-lg truncate tracking-tight leading-none mb-1">{current.title}</h5>
                    <p className="text-slate-400 text-xs md:text-xs font-bold uppercase tracking-widest truncate">{current.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 md:gap-8">
                  {/* Desktop Controls */}
                  <div className="hidden md:flex items-center gap-6">
                    <button onClick={() => setShuffle(!shuffle)} className={`transition-colors ${shuffle ? 'text-primary' : 'text-slate-600 hover:text-white'}`}><Shuffle className="w-4 h-4" /></button>
                    <button onClick={playPrevious} className="text-white/60 hover:text-white transition-colors"><SkipBack className="w-6 h-6 fill-current" /></button>
                    <button onClick={togglePlayPause} className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-2xl">
                      {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                    </button>
                    <button onClick={playNext} className="text-white/60 hover:text-white transition-colors"><SkipForward className="w-6 h-6 fill-current" /></button>
                    <button onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')} className={`transition-colors relative ${repeat !== 'off' ? 'text-primary' : 'text-slate-600 hover:text-white'}`}>
                      <Repeat className="w-4 h-4" />
                      {repeat === 'one' && <span className="absolute -top-1 -right-1 bg-primary text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center text-white">1</span>}
                    </button>
                  </div>

                  {/* Mobile Controls */}
                  <div className="md:hidden flex items-center gap-4">
                    <button onClick={playNext} className="text-white/60 p-2"><SkipForward className="w-8 h-8 fill-current" /></button>
                    <button onClick={togglePlayPause} className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl">
                      {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                    </button>
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-6 w-80 justify-end border-l border-white/5 pl-10">
                  {/* Sound Reducer (Volume Control) */}
                  <div className="flex items-center gap-4 group/vol">
                    <button onClick={toggleMute} className="text-slate-500 hover:text-white transition-colors">
                      {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : volume < 0.5 ? <Volume1 className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <div className="w-24 h-1.5 bg-white/10 rounded-full relative overflow-hidden cursor-pointer group/bar">
                      <div className="absolute h-full bg-primary rounded-full transition-all" style={{ width: `${isMuted ? 0 : volume * 100}%` }} />
                      <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={(e) => handleVolumeChange(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                  </div>
                  <button onClick={() => setCurrentView('library')} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"><ListMusic className="w-6 h-6 text-slate-500 hover:text-white" /></button>
                  <button className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"><MoreHorizontal className="w-6 h-6 text-slate-500 hover:text-white" /></button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-4 px-2">
                <span className="text-[10px] md:text-xs font-black text-slate-600 w-10 text-right tabular-nums">{Math.floor(currentTime/60)}:{String(Math.floor(currentTime%60)).padStart(2,'0')}</span>
                <div className="flex-1 h-1.5 md:h-2 bg-white/10 rounded-full relative overflow-hidden cursor-pointer group">
                  <div className="absolute h-full bg-primary rounded-full transition-all" style={{ width: `${(currentTime/duration)*100}%` }} />
                  <input type="range" min="0" max={duration} value={currentTime} onChange={(e) => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value) }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <span className="text-[10px] md:text-xs font-black text-slate-600 w-10 tabular-nums">{Math.floor(duration/60)}:{String(Math.floor(duration%60)).padStart(2,'0')}</span>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-slate-900/80 backdrop-blur-3xl border-t border-white/5 flex md:hidden items-center justify-around z-[55] px-6 pb-6">
        <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1.5 ${currentView === 'home' ? 'text-primary' : 'text-slate-500'}`}>
          <Home className={`w-7 h-7 ${currentView === 'home' ? 'fill-current' : ''}`} />
          <span className="text-[11px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => setCurrentView('search')} className={`flex flex-col items-center gap-1.5 ${currentView === 'search' ? 'text-primary' : 'text-slate-500'}`}>
          <Search className="w-7 h-7" />
          <span className="text-[11px] font-black uppercase tracking-widest">Search</span>
        </button>
        <button onClick={() => setCurrentView('library')} className={`flex flex-col items-center gap-1.5 ${currentView === 'library' || currentView === 'playlist' ? 'text-primary' : 'text-slate-500'}`}>
          <ListMusic className={`w-7 h-7 ${currentView === 'library' || currentView === 'playlist' ? 'fill-current' : ''}`} />
          <span className="text-[11px] font-black uppercase tracking-widest">Playlists</span>
        </button>
        <button onClick={() => setCurrentView('favorites')} className={`flex flex-col items-center gap-1.5 ${currentView === 'favorites' ? 'text-primary' : 'text-slate-500'}`}>
          <Heart className={`w-7 h-7 ${currentView === 'favorites' ? 'fill-current' : ''}`} />
          <span className="text-[11px] font-black uppercase tracking-widest">Loved</span>
        </button>
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {showPlaylistSelectorModal && current && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPlaylistSelectorModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-slate-900 border border-white/10 p-10 rounded-[3rem] w-full max-w-sm shadow-2xl">
              <h3 className="text-2xl font-black mb-6 tracking-tighter">Add to Playlist</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                {playlists.length === 0 ? (
                  <p className="text-slate-500 font-bold text-center py-4">No playlists yet</p>
                ) : (
                  playlists.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => { addToPlaylist(current, p.id); setShowPlaylistSelectorModal(false); }}
                      className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors font-black text-sm"
                    >
                      {p.name}
                    </button>
                  ))
                )}
              </div>
              <Button onClick={() => setShowPlaylistSelectorModal(false)} className="w-full mt-6 rounded-2xl h-14 bg-white/5 border border-white/5 text-slate-400 font-black uppercase tracking-widest text-[10px]">Close</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-slate-900 border border-white/10 p-12 rounded-[3.5rem] w-full max-w-md shadow-2xl">
              <h3 className="text-3xl font-black mb-8 tracking-tighter">New Collection</h3>
              <input 
                autoFocus type="text" placeholder="Name your playlist" value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createPlaylist()}
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white outline-none focus:border-primary transition-all mb-8 font-bold"
              />
              <div className="flex gap-4">
                <Button onClick={() => setShowCreateModal(false)} variant="ghost" className="flex-1 rounded-2xl h-14 text-slate-500 font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
                <Button onClick={createPlaylist} className="flex-1 bg-primary text-white rounded-2xl h-14 font-black uppercase tracking-widest text-[10px]">Create</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddSongSearch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddSongSearch(false)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="relative bg-slate-900 border border-white/10 p-10 rounded-[3.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black tracking-tighter">Find Tracks</h3>
                <button onClick={() => setShowAddSongSearch(false)} className="text-slate-500 hover:text-white"><X className="w-8 h-8" /></button>
              </div>
              <input 
                autoFocus type="text" placeholder="Search for songs or artists..." value={playlistSearchQuery}
                onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePlaylistSearch()}
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white outline-none focus:border-primary transition-all mb-8 font-bold"
              />
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                {searchingInPlaylist ? <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto my-10" /> : (
                  playlistSearchResults.map(s => (
                    <div key={s.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                      <img src={s.coverUrl || DEFAULT_COVER} className="w-12 h-12 rounded-xl" alt="" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-sm truncate leading-none mb-1">{s.title}</h4>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest truncate">{s.artist}</p>
                      </div>
                      <Button 
                        onClick={() => { addToPlaylist(s, selectedPlaylistId!); setShowAddSongSearch(false); }}
                        className="bg-white text-black hover:bg-primary hover:text-white rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest"
                      >Add</Button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Full Screen Mobile Player */}
      <AnimatePresence>
        {isFullScreenPlayerOpen && current && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[110] bg-slate-950 flex flex-col p-6 md:p-12"
          >
            {/* Dynamic Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/30 to-slate-950" />
            
            {/* Header Section */}
            <div className="relative z-10 flex items-center justify-between mb-10">
              <button onClick={() => setIsFullScreenPlayerOpen(false)} className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
                <X className="w-8 h-8" />
              </button>
              <div className="text-center">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Playing From</p>
                <p className="text-xs font-black text-white uppercase tracking-widest">{currentView === 'playlist' ? 'Your Playlist' : 'MelodyMentor'}</p>
              </div>
              <button className="p-2 -mr-2 text-white/70 hover:text-white">
                <MoreHorizontal className="w-8 h-8" />
              </button>
            </div>

            {/* Main Visual Content (Mobile: Col, Desktop: Row) */}
            <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 max-w-7xl mx-auto w-full min-h-0">
              
              {/* Left Side: Album Art Section (Large on Desktop) */}
              <div className="w-full md:w-1/2 flex items-center justify-center min-h-0">
                <div className="relative w-full max-w-[320px] md:max-w-none aspect-square shrink min-h-0">
                  <motion.img 
                    layoutId={`player-art-${current.id}`}
                    src={current.coverUrl || DEFAULT_COVER} 
                    className="w-full h-full rounded-[2.5rem] md:rounded-[4rem] shadow-[0_40px_150px_-30px_rgba(0,0,0,0.9)] object-cover border border-white/10 mx-auto" 
                    alt="" 
                  />
                </div>
              </div>

              {/* Right Side: Details, Controls & Lyrics */}
              <div className="w-full md:w-1/2 flex flex-col justify-center min-h-0">
                {/* Title & Artist Row */}
                <div className="flex items-center justify-between gap-6 mb-6 md:mb-12">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-tight mb-2 truncate">{current.title}</h2>
                    <p className="text-xl md:text-3xl font-bold text-white/40 truncate tracking-wide uppercase tracking-[0.1em]">{current.artist}</p>
                  </div>
                  <button onClick={() => setShowPlaylistSelectorModal(true)} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/10 flex items-center justify-center text-white/80 hover:bg-white/10 hover:border-white/30 transition-all active:scale-90 shrink-0">
                    <Plus className="w-8 h-8 md:w-10 md:h-10" />
                  </button>
                </div>

                {/* Progress Control Row */}
                <div className="mb-8 md:mb-14">
                  <div className="h-2 w-full bg-white/10 rounded-full relative mb-4 group cursor-pointer overflow-hidden">
                    <div className="absolute h-full bg-white rounded-full transition-all" style={{ width: `${(currentTime/duration)*100}%` }} />
                    <input type="range" min="0" max={duration} value={currentTime} onChange={(e) => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value) }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                  <div className="flex justify-between text-xs md:text-sm font-black text-white/30 tabular-nums tracking-[0.2em]">
                    <span>{Math.floor(currentTime/60)}:{String(Math.floor(currentTime%60)).padStart(2,'0')}</span>
                    <span>{Math.floor(duration/60)}:{String(Math.floor(duration%60)).padStart(2,'0')}</span>
                  </div>
                </div>

                {/* Playback Controls Row */}
                <div className="flex items-center justify-between gap-8 mb-10 md:mb-16">
                  <button onClick={() => setShuffle(!shuffle)} className={`transition-all p-3 ${shuffle ? 'text-primary' : 'text-white/20 hover:text-white/50'}`}>
                    <Shuffle className="w-8 h-8 md:w-10 md:h-10" />
                  </button>
                  <div className="flex items-center gap-10 md:gap-16">
                    <button onClick={playPrevious} className="text-white hover:scale-110 transition-transform active:scale-90">
                      <SkipBack className="w-12 h-12 md:w-16 md:h-16 fill-current" />
                    </button>
                    <button onClick={togglePlayPause} className="w-24 h-24 md:w-32 md:h-32 bg-white text-black rounded-full flex items-center justify-center shadow-[0_40px_80px_-20px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 transition-all">
                      {isPlaying ? <Pause className="w-12 h-12 md:w-16 md:h-16 fill-current" /> : <Play className="w-12 h-12 md:w-16 md:h-16 fill-current ml-1" />}
                    </button>
                    <button onClick={playNext} className="text-white hover:scale-110 transition-transform active:scale-90">
                      <SkipForward className="w-12 h-12 md:w-16 md:h-16 fill-current" />
                    </button>
                  </div>
                  <button className="text-white/20 hover:text-white/50 p-3">
                    <Mic2 className="w-8 h-8 md:w-10 md:h-10" />
                  </button>
                </div>

                {/* Lyrics Preview Block (Right Side on Desktop) */}
                <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] p-8 md:p-12 border border-white/5 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Real-time Lyrics</h4>
                    <div className="px-4 py-1.5 bg-primary/20 text-primary rounded-full text-[10px] font-black tracking-widest border border-primary/20">PREMIUM AI</div>
                  </div>
                  <p className="text-2xl md:text-4xl font-black text-white/50 leading-tight tracking-tight line-clamp-2 md:line-clamp-none italic">
                    Enjoying the vibe on <span className="text-white not-italic">MelodyMentor</span>...
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Brand Bar */}
            <div className="relative z-10 flex items-center justify-between max-w-lg mx-auto w-full mb-6 shrink-0">
              <div className="flex items-center gap-2 text-[#4f46e5] font-black uppercase tracking-[0.3em] text-[9px] md:text-[10px]">
                <Zap className="w-4 h-4 fill-current" />
                <span>Mentozy Soundcore</span>
              </div>
              <div className="flex items-center gap-6">
                <button className="text-white/30 hover:text-white/60"><LogOut className="w-5 h-5 -rotate-90" /></button>
                <button onClick={() => { setIsFullScreenPlayerOpen(false); setCurrentView('library'); }} className="text-white/30 hover:text-white/60"><ListMusic className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Lyrics Section */}
            <div className="relative z-10 max-w-lg mx-auto w-full bg-white/5 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 border border-white/10 shadow-2xl shrink-0">
              <div className="flex items-center justify-between mb-4 md:mb-8">
                <h4 className="text-[9px] md:text-[10px] font-black text-white/50 uppercase tracking-[0.4em]">Lyrics Preview</h4>
                <div className="px-2 py-0.5 bg-white/10 rounded-full text-[7px] md:text-[8px] font-black text-white/60 uppercase tracking-widest">BETA</div>
              </div>
              <p className="text-lg md:text-3xl font-black text-white/40 leading-relaxed tracking-tight line-clamp-2 md:line-clamp-none">
                High-fidelity audio streaming for <span className="text-white">MelodyMentor</span> by Mentozy...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
