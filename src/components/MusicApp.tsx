import { useState, useEffect, useRef } from 'react'
import { Search, Play, Heart, Sparkles, Music, Pause, Star, Volume2, ListMusic, Home, LayoutGrid, Settings, LogOut, ChevronRight, Mic2, Loader2, TrendingUp, Bell, PlayCircle, Globe, Zap } from 'lucide-react'
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
  const [search, setSearch] = useState("")
  const [current, setCurrent] = useState<Song | null>(null)
  const [loading, setLoading] = useState(false)
  const [greeting, setGreeting] = useState('')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentView, setCurrentView] = useState<'trending' | 'favorites'>('trending')
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [isFloatingCardOpen, setIsFloatingCardOpen] = useState(false)
  const [resolvingStream, setResolvingStream] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const savedFavorites = localStorage.getItem('melody-mentor-favorites')
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)))
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
    }
  }, [current]);

  const loadTrending = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/songs?search=top global trending 2024 hits`)
      const data = await res.json()
      const tracksWithFavorites = data.songs.map((track: Song) => ({
        ...track,
        isFavorite: favorites.has(track.id)
      }))
      setTracks(tracksWithFavorites)
    } catch (err) {
      console.error(err)
    } finally {
      setTimeout(() => setLoading(false), 300)
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

  const playTrack = (track: Song) => {
    setSelectedSong(track)
    setIsFloatingCardOpen(true)
    // Play immediately when clicking the card
    playPreview(track.preview, track)
  }

  const playPreview = async (previewUrl: string, trackOverride?: Song) => {
    const trackToPlay = trackOverride || selectedSong
    if (audioRef.current && trackToPlay) {
      let finalUrl = previewUrl;

      if (trackToPlay.source === 'youtube') {
        setResolvingStream(true);
        try {
          console.log(`Resolving stream for: ${trackToPlay.title} (${previewUrl})`);
          const res = await fetch(`/api/stream?id=${previewUrl}`);
          const data = await res.json();
          if (data.url) {
            finalUrl = data.url;
            console.log("Stream resolved successfully");
          } else {
            throw new Error("Empty URL returned from server");
          }
        } catch (e) {
          console.error("Failed to resolve stream:", e);
          setResolvingStream(false);
          return;
        }
        setResolvingStream(false);
      }

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
        setIsPlaying(false)
        setCurrentTime(0)
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
  }, [current])

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans selection:bg-primary/30 overflow-x-hidden">
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

        <nav className="space-y-4 flex-1">
          {[
            { icon: <TrendingUp className="w-5 h-5" />, label: 'Trending', active: currentView === 'trending', onClick: () => setCurrentView('trending') },
            { icon: <Heart className="w-5 h-5" />, label: 'Library', active: currentView === 'favorites', onClick: () => setCurrentView('favorites') },
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
      <main className="flex-1 md:ml-20 lg:ml-72 p-6 md:p-12 pb-48">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-16">
            <div className="space-y-2">
              <p className="text-primary font-black uppercase tracking-[0.4em] text-[10px]">{greeting}</p>
              <h2 className="text-5xl lg:text-7xl font-black text-slate-950 tracking-tighter leading-none">Melody <span className="text-slate-300">Trending</span></h2>
            </div>
            
            <div className="relative w-full lg:max-w-xl">
              <div className="relative flex items-center gap-4 bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 focus-within:border-primary transition-all">
                <div className="pl-5"><Search className="w-5 h-5 text-slate-300" /></div>
                <input 
                  type="text" 
                  placeholder="Explore trending music..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
                  className="flex-1 py-3 bg-transparent outline-none text-slate-900 font-bold"
                />
                <Button 
                  onClick={searchTracks}
                  className="bg-primary text-white rounded-[1.5rem] px-8 py-6 font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-lg shadow-primary/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                </Button>
              </div>
            </div>
          </header>

          {/* Unified Grid - Focusing solely on Trending by default */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 p-3 rounded-2xl text-primary">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-black text-slate-950 tracking-tight">
                {currentView === 'favorites' ? 'Library' : search.trim() ? `Search Results: ${search}` : 'Trending Hits'}
              </h3>
            </div>
            <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-full border border-slate-100 shadow-sm">
               <Zap className="w-4 h-4 text-primary fill-current animate-pulse" />
               <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Unrestricted Streaming</span>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence>
                {(currentView === 'favorites' 
                  ? tracks.filter(t => t.isFavorite) 
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
                    <Card className="p-4 bg-white border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.02)] rounded-[2.5rem] cursor-pointer group-hover:border-primary/30 group-hover:shadow-2xl transition-all duration-500 overflow-hidden relative h-full flex flex-col">
                      <div className="relative aspect-square rounded-[1.8rem] overflow-hidden mb-5 bg-slate-50 flex-shrink-0">
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
                        {/* Rank Badge for trending feel */}
                        <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                          #{i + 1}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4 mb-1">
                          <h4 className="font-black text-slate-900 text-lg truncate tracking-tight">{track.title}</h4>
                          <span className="text-[10px] font-black text-slate-300 whitespace-nowrap mt-1.5">{track.duration}</span>
                        </div>
                        <p className="text-slate-400 font-bold text-xs truncate uppercase tracking-widest leading-none">{track.artist}</p>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className={`absolute top-6 right-6 rounded-full w-10 h-10 transition-all ${track.isFavorite ? 'bg-primary text-white shadow-lg' : 'bg-white/90 text-slate-300 hover:text-primary'}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(track.id)
                        }}
                      >
                        <Heart className={`w-5 h-5 ${track.isFavorite ? 'fill-current' : ''}`} />
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Empty State */}
          {!loading && currentView === 'favorites' && tracks.filter(t => t.isFavorite).length === 0 && (
            <div className="text-center py-40 bg-white rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.03),transparent_70%)]" />
               <div className="relative z-10">
                 <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8">
                   <Heart className="w-10 h-10 text-slate-200" />
                 </div>
                 <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Your library is empty.</h3>
                 <p className="text-slate-400 mb-10 max-w-sm mx-auto font-medium text-lg">Archive your favorite trending hits to build your personal collection.</p>
                 <Button onClick={() => {setCurrentView('trending'); loadTrending();}} className="bg-primary text-white rounded-2xl px-12 py-7 font-black text-sm uppercase tracking-widest hover:bg-slate-800 shadow-2xl">Explore Trending</Button>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Premium Player Bar */}
      {current && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-[calc(5rem+1.5rem)] lg:left-[calc(18rem+1.5rem)] z-50 bg-slate-950/95 backdrop-blur-xl p-4 md:p-6 rounded-[2.5rem] shadow-2xl border border-white/10"
        >
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 min-w-[200px] max-w-[300px]">
              <img src={current.coverUrl || DEFAULT_COVER} className="w-14 h-14 rounded-2xl object-cover shadow-lg border border-white/5" alt="" />
              <div className="min-w-0 flex-1">
                <h5 className="font-black text-white truncate text-lg tracking-tight leading-none mb-1">{current.title}</h5>
                <p className="text-slate-500 truncate font-bold text-xs uppercase tracking-[0.2em]">{current.artist}</p>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center justify-center gap-8">
                <Button variant="ghost" className="text-slate-600 hover:text-white hidden sm:flex"><Star className="w-5 h-5" /></Button>
                <Button 
                  size="icon" 
                  onClick={togglePlayPause} 
                  className="bg-white text-slate-950 hover:bg-slate-200 rounded-2xl w-14 h-14 shadow-2xl transition-all"
                  disabled={resolvingStream}
                >
                  {resolvingStream ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : (isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />)}
                </Button>
                <Button variant="ghost" className="text-slate-600 hover:text-white hidden sm:flex"><Volume2 className="w-5 h-5" /></Button>
              </div>
              <div className="flex items-center gap-4 px-2">
                <span className="text-[10px] font-black text-slate-600 tabular-nums w-10 text-right">{formatTime(currentTime)}</span>
                <div className="flex-1 relative h-1 bg-white/10 rounded-full group overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-primary rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                  <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => { if (audioRef.current) audioRef.current.currentTime = parseFloat(e.target.value); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <span className="text-[10px] font-black text-slate-600 tabular-nums w-10">{formatTime(duration)}</span>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center gap-3 min-w-[150px] justify-end border-l border-white/10 pl-6">
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Mode</p>
                 <div className="flex items-center gap-1.5 justify-end">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span className="text-xs font-bold text-white uppercase tracking-tighter">Trending</span>
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <audio ref={audioRef} />
      <SongFloatingCard
        song={selectedSong!}
        isOpen={isFloatingCardOpen && !!selectedSong}
        onClose={() => setIsFloatingCardOpen(false)}
        onPlay={(url) => playPreview(url, selectedSong!)}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  )
}
