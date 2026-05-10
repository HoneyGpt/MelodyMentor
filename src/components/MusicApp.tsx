import { useState, useEffect, useRef } from 'react'
import { Search, Play, Heart, Sparkles, Music, Pause, Star, Volume2, ListMusic, Home, LayoutGrid, Settings, LogOut, ChevronRight, Mic2, Loader2, TrendingUp, Bell, PlayCircle, Globe, Zap, SkipForward, SkipBack, Plus, Shuffle, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

interface Chart {
  id: string
  title: string
  image: string
  subtitle: string
  type: string
}

interface MusicAppProps {
  onBackToLanding: () => void
}

const DEFAULT_COVER = "/placeholder.png";

// Professional Skeleton Loader
const CardSkeleton = () => (
  <div className="p-4 bg-white border border-slate-100 rounded-[2.5rem] animate-pulse">
    <div className="aspect-square rounded-[1.8rem] bg-slate-100 mb-4" />
    <div className="h-5 bg-slate-100 rounded-full w-3/4 mb-2" />
    <div className="h-3 bg-slate-100 rounded-full w-1/2" />
  </div>
);

export default function MusicApp({ onBackToLanding }: MusicAppProps) {
  const [tracks, setTracks] = useState<Song[]>([])
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([])
  const [topCharts, setTopCharts] = useState<Chart[]>([])
  const [search, setSearch] = useState("")
  const [current, setCurrent] = useState<Song | null>(null)
  const [loading, setLoading] = useState(false)
  const [greeting, setGreeting] = useState('')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isPlaying, setIsPlaying] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState<'off' | 'one' | 'all'>('off')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentView, setCurrentView] = useState<'trending' | 'favorites' | 'playlist' | 'queue'>('trending')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [queue, setQueue] = useState<Song[]>([])
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [isFloatingCardOpen, setIsFloatingCardOpen] = useState(false)
  const [resolvingStream, setResolvingStream] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const savedFavorites = localStorage.getItem('melody-mentor-favorites')
    if (savedFavorites) {
      try {
        setFavorites(new Set(JSON.parse(savedFavorites) || []))
      } catch (e) {
        setFavorites(new Set())
      }
    }

    const savedPlaylists = localStorage.getItem('melody-mentor-playlists')
    if (savedPlaylists) {
      try {
        setPlaylists(JSON.parse(savedPlaylists) || [])
      } catch (e) {
        setPlaylists([])
      }
    }
    
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good Morning')
    else if (hour < 17) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')

    loadTrending()
  }, [])

  useEffect(() => {
    localStorage.setItem('melody-mentor-favorites', JSON.stringify(Array.from(favorites)))
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
          { src: current.coverUrl || DEFAULT_COVER, sizes: '512x512', type: 'image/png' },
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        audioRef.current?.play();
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
      navigator.mediaSession.setActionHandler('nexttrack', playNext);
    }
  }, [current]);

  const loadTrending = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/modules?language=english,hindi`)
      const data = await res.json()
      
      const trendingWithFavorites = (data.trending || []).map((track: Song) => ({
        ...track,
        isFavorite: favorites.has(track.id)
      }))
      
      setTrendingSongs(trendingWithFavorites)
      setTopCharts(data.charts || [])
      setTracks(trendingWithFavorites)
      
      if (queue.length === 0) setQueue(trendingWithFavorites)
    } catch (err) {
      console.error(err)
    } finally {
      setTimeout(() => setLoading(false), 300)
    }
  }

  const loadChart = async (chartId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/playlist?id=${chartId}`)
      const data = await res.json()
      const tracksWithFavorites = data.songs.map((track: Song) => ({
        ...track,
        isFavorite: favorites.has(track.id)
      }))
      setTracks(tracksWithFavorites)
      setCurrentView('trending')
      if (tracksWithFavorites.length > 0) {
        setQueue(tracksWithFavorites)
        playTrack(tracksWithFavorites[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const searchTracks = async () => {
    if (!search.trim()) {
      loadTrending()
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/songs?search=${encodeURIComponent(search.trim())}`)
      const data = await res.json()
      const tracksWithFavorites = data.songs.map((track: Song) => ({
        ...track,
        isFavorite: favorites.has(track.id)
      }))
      setTracks(tracksWithFavorites)
      setCurrentView('trending') // Switch to main grid to show search results
    } catch (err) {
      console.error(err)
    } finally {
      setTimeout(() => setLoading(false), 300)
    }
  }

  const toggleFavorite = (songId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(songId)) {
      newFavorites.delete(songId)
    } else {
      newFavorites.add(songId)
    }
    setFavorites(newFavorites)
    setTracks(tracks.map(track => 
      track.id === songId ? { ...track, isFavorite: !track.isFavorite } : track
    ))
  }

  const createPlaylist = () => {
    const name = prompt("Enter playlist name:")
    if (name) {
      const newPlaylist: Playlist = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        songs: []
      }
      setPlaylists([...playlists, newPlaylist])
    }
  }

  const addToPlaylist = (playlistId: string, song: Song) => {
    setPlaylists(playlists.map(p => {
      if (p.id === playlistId && !p.songs.find(s => s.id === song.id)) {
        return { ...p, songs: [...p.songs, song] }
      }
      return p
    }))
  }

  const addToQueue = (song: Song) => {
    if (!queue.find(s => s.id === song.id)) {
      setQueue([...queue, song])
    }
  }

  const addToPlayNext = (song: Song) => {
    // If already in queue, remove it first to re-insert
    const filteredQueue = queue.filter(s => s.id !== song.id)
    if (!current) {
      setQueue([song, ...filteredQueue])
    } else {
      const currentIndex = filteredQueue.findIndex(s => s.id === current.id)
      const newQueue = [...filteredQueue]
      newQueue.splice(currentIndex + 1, 0, song)
      setQueue(newQueue)
    }
  }

  const playNext = () => {
    if (!current || queue.length === 0) return
    
    if (repeat === 'one') {
      audioRef.current!.currentTime = 0
      audioRef.current!.play()
      return
    }

    let nextIndex
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length)
    } else {
      const currentIndex = queue.findIndex(s => s.id === current.id)
      nextIndex = currentIndex + 1
      if (nextIndex >= queue.length) {
        if (repeat === 'all') nextIndex = 0
        else return
      }
    }
    playTrack(queue[nextIndex])
  }

  const playPrevious = () => {
    if (!current || queue.length === 0) return
    const currentIndex = queue.findIndex(s => s.id === current.id)
    let prevIndex = currentIndex - 1
    if (prevIndex < 0) {
      if (repeat === 'all') prevIndex = queue.length - 1
      else prevIndex = 0
    }
    playTrack(queue[prevIndex])
  }

  const playTrack = (track: Song) => {
    setSelectedSong(track)
    // If not in queue, add it
    if (!queue.find(s => s.id === track.id)) {
      setQueue([...queue, track])
    }
    playPreview(track.preview, track)
  }

  const playPreview = async (previewUrl: string, trackOverride?: Song) => {
    const trackToPlay = trackOverride || selectedSong
    if (audioRef.current && trackToPlay) {
      let finalUrl = previewUrl;

      // With JioSaavn, previewUrl is the direct MP3 link, so we skip stream resolution

      audioRef.current.pause()
      audioRef.current.src = finalUrl
      audioRef.current.load()
      
      try {
        await audioRef.current.play()
        setCurrent(trackToPlay)
        setIsPlaying(true)
      } catch (err) {
        console.error("Playback failed:", err)
        setIsPlaying(false)
      }
    }
  }

  const togglePlayPause = () => {
    if (!current) return
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      audioRef.current?.play()
      setIsPlaying(true)
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
      const handleLoadedMetadata = () => setDuration(audio.duration)
      const handleEnded = () => {
        if (repeat === 'one') {
          audio.currentTime = 0
          audio.play()
        } else {
          playNext()
        }
      }
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('ended', handleEnded)
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('ended', handleEnded)
      }
    }
  }, [current, queue, repeat, shuffle])

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-black flex font-sans selection:bg-primary/30 overflow-x-hidden text-white">
      {/* Sidebar - Fixed & Clean */}
      <aside className="w-20 lg:w-72 bg-slate-950 text-white hidden md:flex flex-col py-10 px-6 fixed h-full z-40">
        <div className="flex items-center gap-4 mb-16 px-2 cursor-pointer" onClick={onBackToLanding}>
          <div className="bg-primary p-2.5 rounded-2xl shadow-lg shadow-primary/20">
            <Music className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl hidden lg:block tracking-tighter leading-none">MelodyMentor</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:block mt-1">by Mentozy</span>
          </div>
        </div>

        <nav className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
          {[
            { icon: <TrendingUp className="w-5 h-5" />, label: 'Trending', active: currentView === 'trending', onClick: () => setCurrentView('trending') },
            { icon: <Heart className="w-5 h-5" />, label: 'Library', active: currentView === 'favorites', onClick: () => setCurrentView('favorites') },
            { icon: <ListMusic className="w-5 h-5" />, label: 'Queue', active: currentView === 'queue', onClick: () => setCurrentView('queue') },
          ].map((item, i) => (
            <button 
              key={i}
              onClick={item.onClick}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${item.active ? 'bg-primary text-white font-black shadow-xl shadow-primary/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
              <span className="transition-colors">{item.icon}</span>
              <span className="hidden lg:block">{item.label}</span>
            </button>
          ))}

          <div className="pt-8 pb-4">
             <div className="flex items-center justify-between px-4 mb-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hidden lg:block">Playlists</span>
                <button onClick={createPlaylist} className="text-slate-500 hover:text-primary transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
             </div>
             <div className="space-y-2">
                {playlists.map(playlist => (
                  <button 
                    key={playlist.id}
                    onClick={() => {
                      setSelectedPlaylistId(playlist.id);
                      setCurrentView('playlist');
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${currentView === 'playlist' && selectedPlaylistId === playlist.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="hidden lg:block truncate">{playlist.name}</span>
                  </button>
                ))}
             </div>
          </div>
        </nav>

        <button 
          onClick={onBackToLanding}
          className="w-full flex items-center gap-4 p-4 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden lg:block">Exit Landing</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-20 lg:ml-72 p-4 md:p-12 pb-40 md:pb-48">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-10 mb-8 md:mb-16">
            <div className="space-y-2">
              <p className="text-primary font-black uppercase tracking-[0.4em] text-[8px] md:text-[10px]">{greeting}</p>
              <h2 className="text-3xl md:text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none">Melody <span className="text-slate-600">Trending</span></h2>
            </div>
            
            <div className="relative w-full lg:max-w-xl">
              <div className="relative flex items-center gap-4 bg-slate-900 p-2 rounded-[2rem] border border-white/5 focus-within:border-primary transition-all">
                <div className="pl-5"><Search className="w-5 h-5 text-slate-500" /></div>
                <input 
                  type="text" 
                  placeholder="Artists, songs, or podcasts"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
                  className="flex-1 py-3 bg-transparent outline-none text-white font-bold placeholder:text-slate-600"
                />
                <Button 
                  onClick={searchTracks}
                  className="bg-primary text-white rounded-[1.5rem] px-5 py-4 md:px-8 md:py-6 font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-indigo-700 shadow-lg shadow-primary/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                </Button>
              </div>
            </div>
          </header>

          {/* Home Discovery (Trending & Charts) */}
          {!loading && !search.trim() && currentView === 'trending' && (
            <div className="space-y-16">
              <section>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-2 md:p-3 rounded-2xl text-primary">
                      <Zap className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                    </div>
                    <h3 className="text-xl md:text-3xl font-black text-white tracking-tight">Trending Now</h3>
                  </div>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar -mx-4 px-4 snap-x">
                  {trendingSongs.map((track, i) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="min-w-[160px] md:min-w-[280px] snap-start"
                      onClick={() => playTrack(track)}
                    >
                      <Card className="p-3 md:p-4 bg-slate-900 border border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] cursor-pointer hover:bg-slate-800 transition-all duration-500 group">
                        <div className="relative aspect-square rounded-xl md:rounded-[1.8rem] overflow-hidden mb-3 md:mb-4">
                          <img src={track.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="w-12 h-12 text-white fill-current" />
                          </div>
                        </div>
                        <h4 className="font-black text-white text-sm md:text-base truncate">{track.title}</h4>
                        <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest truncate">{track.artist}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-500/20 p-2 md:p-3 rounded-2xl text-amber-500">
                      <Star className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                    </div>
                    <h3 className="text-xl md:text-3xl font-black text-white tracking-tight">Top Charts</h3>
                  </div>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar -mx-4 px-4 snap-x">
                  {topCharts.map((chart, i) => (
                    <motion.div
                      key={chart.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.3 }}
                      className="min-w-[200px] snap-start"
                      onClick={() => loadChart(chart.id)}
                    >
                      <div className="group cursor-pointer">
                        <div className="relative aspect-square rounded-[2.5rem] overflow-hidden mb-4 shadow-lg border border-slate-100">
                          <img src={chart.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-60" />
                          <div className="absolute bottom-6 left-6 right-6">
                            <h4 className="text-white font-black text-lg leading-tight">{chart.title}</h4>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Search Results / Library / Queue View */}
          {(loading || search.trim() || currentView !== 'trending') && (
            <div className="space-y-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/20 p-2 md:p-3 rounded-2xl text-primary">
                    <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h3 className="text-xl md:text-3xl font-black text-white tracking-tight">
                    {currentView === 'favorites' ? 'Library' : 
                     currentView === 'queue' ? 'Play Queue' :
                     currentView === 'playlist' ? (playlists.find(p => p.id === selectedPlaylistId)?.name || 'Playlist') :
                     search.trim() ? `Search Results: ${search}` : 'Trending Hits'}
                  </h3>
                </div>
              </div>

              {loading ? (
                <div className="grid gap-4 md:gap-10 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
                </div>
              ) : (
                <div className="grid gap-4 md:gap-10 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <AnimatePresence>
                    {(currentView === 'favorites' 
                      ? tracks.filter(t => t.isFavorite) 
                      : currentView === 'queue' ? queue
                      : currentView === 'playlist' ? (playlists.find(p => p.id === selectedPlaylistId)?.songs || [])
                      : tracks
                    ).map((track, i) => (
                      <motion.div
                        key={track.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.05 }}
                        className="group"
                        onClick={() => playTrack(track)}
                      >
                        <Card className="p-3 md:p-4 bg-slate-900 border border-white/5 rounded-2xl md:rounded-[2.5rem] cursor-pointer hover:bg-slate-800 transition-all duration-500 overflow-hidden relative h-full flex flex-col">
                          <div className="relative aspect-square rounded-xl md:rounded-[1.8rem] overflow-hidden mb-3 md:mb-5 bg-slate-800 flex-shrink-0">
                            <img 
                              src={track.coverUrl || DEFAULT_COVER} 
                              alt={track.title} 
                              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                              onError={(e) => {(e.target as HTMLImageElement).src = DEFAULT_COVER;}}
                            />
                            <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-[2px]">
                              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary shadow-2xl">
                                <Play className="w-8 h-8 fill-current ml-1" />
                              </div>
                            </div>
                            <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg z-10">
                              #{i + 1}
                            </div>
                            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                              <Button
                                size="icon"
                                variant="ghost"
                                className={`rounded-full w-10 h-10 shadow-xl ${track.isFavorite ? 'bg-primary text-white' : 'bg-white text-slate-400 hover:text-primary'}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleFavorite(track.id)
                                }}
                              >
                                <Heart className={`w-5 h-5 ${track.isFavorite ? 'fill-current' : ''}`} />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="rounded-full w-10 h-10 bg-white text-slate-400 hover:text-primary shadow-xl"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  addToPlayNext(track)
                                }}
                                title="Play Next"
                              >
                                <ListMusic className="w-5 h-5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 md:gap-4 mb-1">
                              <h4 className="font-black text-white text-sm md:text-lg truncate tracking-tight">{track.title}</h4>
                              <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">{track.duration}</span>
                            </div>
                            <p className="text-slate-500 font-bold text-[10px] md:text-xs truncate uppercase tracking-widest leading-none">{track.artist}</p>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && currentView === 'favorites' && tracks.filter(t => t.isFavorite).length === 0 && (
            <div className="text-center py-40 bg-slate-900 rounded-[2.5rem] md:rounded-[4rem] border border-white/5 relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.05),transparent_70%)]" />
               <div className="relative z-10">
                 <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
                   <Heart className="w-8 h-8 md:w-10 md:h-10 text-slate-700" />
                 </div>
                 <h3 className="text-2xl md:text-3xl font-black text-white mb-4 tracking-tight">Your library is empty.</h3>
                 <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium text-base md:text-lg">Add songs to your library to see them here.</p>
                 <Button onClick={() => {setCurrentView('trending'); loadTrending();}} className="bg-primary text-white rounded-full px-12 py-7 font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform">Explore Trending</Button>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Premium Player Bar */}
      {current && (
        <>
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-[4.5rem] md:bottom-6 left-2 right-2 md:left-[calc(5rem+1.5rem)] lg:left-[calc(18rem+1.5rem)] z-50 bg-slate-900/90 backdrop-blur-xl p-2 md:p-6 rounded-xl md:rounded-[2.5rem] shadow-2xl border border-white/10"
          >
            <div className="flex items-center gap-2 md:gap-6">
              <div 
                onClick={() => { setSelectedSong(current); setIsFloatingCardOpen(true); }}
                className="flex items-center gap-3 md:gap-4 min-w-0 flex-1 md:flex-initial md:min-w-[200px] md:max-w-[300px] cursor-pointer group"
              >
                <img src={current.coverUrl || DEFAULT_COVER} className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform" alt="" />
                <div className="min-w-0 flex-1">
                  <h5 className="font-black text-white truncate text-xs md:text-lg tracking-tight leading-none mb-1">{current.title}</h5>
                  <p className="text-slate-500 truncate font-bold text-[9px] md:text-xs uppercase tracking-[0.1em]">{current.artist}</p>
                </div>
              </div>
              
              <div className="flex md:flex-1 flex-col gap-1 md:gap-3 px-0 md:px-10">
                <div className="flex items-center justify-end md:justify-center gap-2 md:gap-8">
                  <Button 
                    onClick={() => setShuffle(!shuffle)} 
                    variant="ghost" 
                    size="icon"
                    className={`hidden md:flex transition-colors ${shuffle ? 'text-primary' : 'text-slate-600 hover:text-white'}`}
                  >
                    <Shuffle className="w-5 h-5" />
                  </Button>
                  
                  <Button onClick={playPrevious} variant="ghost" size="icon" className="text-slate-500 hover:text-white hidden md:flex"><SkipBack className="w-6 h-6 fill-current" /></Button>
                  
                  <Button 
                    size="icon" 
                    onClick={togglePlayPause} 
                    className="bg-white text-slate-950 hover:bg-slate-200 rounded-full w-9 h-9 md:w-14 md:h-14 shadow-2xl transition-all active:scale-95 flex-shrink-0"
                    disabled={resolvingStream}
                  >
                    {resolvingStream ? <Loader2 className="w-4 h-4 md:w-6 md:h-6 animate-spin text-primary" /> : (isPlaying ? <Pause className="w-4 h-4 md:w-6 md:h-6 fill-current" /> : <Play className="w-4 h-4 md:w-6 md:h-6 fill-current ml-1" />)}
                  </Button>
                  
                  <Button onClick={playNext} variant="ghost" size="icon" className="text-slate-500 hover:text-white"><SkipForward className="w-5 h-5 md:w-6 md:h-6 fill-current" /></Button>
                  
                  <Button 
                    onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')} 
                    variant="ghost" 
                    size="icon"
                    className={`hidden md:flex transition-colors relative ${repeat !== 'off' ? 'text-primary' : 'text-slate-600 hover:text-white'}`}
                  >
                    <Repeat className="w-5 h-5" />
                    {repeat === 'one' && <span className="absolute -top-1 -right-1 bg-primary text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center text-white border-2 border-slate-950">1</span>}
                  </Button>
                </div>
                <div className="hidden md:flex items-center gap-4 px-2">
                  <span className="text-[10px] font-black text-slate-600 tabular-nums w-10 text-right">{formatTime(currentTime)}</span>
                  <div className="flex-1 relative h-1 bg-white/10 rounded-full group overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-primary rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                    <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => { if (audioRef.current) audioRef.current.currentTime = parseFloat(e.target.value); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                  <span className="text-[10px] font-black text-slate-600 tabular-nums w-10">{formatTime(duration)}</span>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center gap-6 min-w-[100px] justify-end border-l border-white/10 pl-6">
                <Button 
                  onClick={() => setCurrentView(currentView === 'queue' ? 'trending' : 'queue')}
                  variant="ghost" 
                  className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'queue' ? 'text-primary' : 'text-slate-500 hover:text-white'}`}
                >
                  <ListMusic className="w-5 h-5" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em]">Queue</span>
                </Button>
              </div>
            </div>
            {/* Mobile Progress Bar (Mini) */}
            <div className="md:hidden absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
               <div className="h-full bg-white transition-all" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
            </div>
          </motion.div>

          {/* Mobile Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black/95 backdrop-blur-lg border-t border-white/5 flex md:hidden items-center justify-around z-[60] px-4">
            {[
              { icon: <Home className="w-6 h-6" />, label: 'Home', active: currentView === 'trending', onClick: () => setCurrentView('trending') },
              { icon: <Search className="w-6 h-6" />, label: 'Search', active: false, onClick: () => { setCurrentView('trending'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { icon: <ListMusic className="w-6 h-6" />, label: 'Library', active: currentView === 'favorites' || currentView === 'playlist', onClick: () => setCurrentView('favorites') },
            ].map((item, i) => (
              <button 
                key={i} 
                onClick={item.onClick}
                className={`flex flex-col items-center gap-1 transition-colors ${item.active ? 'text-white' : 'text-slate-500'}`}
              >
                {item.icon}
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            ))}
          </nav>
        </>
      )}

      <audio ref={audioRef} />
      <SongFloatingCard
        song={selectedSong!}
        isOpen={isFloatingCardOpen && !!selectedSong}
        onClose={() => setIsFloatingCardOpen(false)}
        onPlay={(url) => playPreview(url, selectedSong!)}
        onToggleFavorite={toggleFavorite}
        onAddToQueue={addToQueue}
        onAddToPlayNext={addToPlayNext}
        onAddToPlaylist={addToPlaylist}
        playlists={playlists}
      />
    </div>
  )
}
