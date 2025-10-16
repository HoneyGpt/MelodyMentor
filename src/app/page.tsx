'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Play, Heart, Sparkles, Music, Pause, Star, Volume2, ListMusic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import SongFloatingCard from '@/components/SongFloatingCard'

interface Song {
  id: string
  title: string
  artist: string
  album: string
  duration: string
  coverUrl: string
  preview: string
  isFavorite: boolean
  source: 'deezer' | 'jamendo' | 'popular' | 'itunes' | 'lastfm' | 'spotify' | 'soundcloud' | 'youtube' | 'bandcamp' | 'fallback'
  spotifyId?: string
  explicit?: boolean
  popularity?: number
  externalUrls?: string
}

export default function Harshify() {
  const [tracks, setTracks] = useState<Song[]>([])
  const [search, setSearch] = useState("")
  const [current, setCurrent] = useState<Song | null>(null)
  const [loading, setLoading] = useState(false)
  const [greeting, setGreeting] = useState('')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [currentView, setCurrentView] = useState<'all' | 'favorites'>('all')
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [isFloatingCardOpen, setIsFloatingCardOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('harshify-favorites')
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)))
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in search
      if (e.target instanceof HTMLInputElement) return
      
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, currentTime - 10)
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (audioRef.current) {
            audioRef.current.currentTime = Math.min(duration, currentTime + 10)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(prev => Math.min(1, prev + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(prev => Math.max(0, prev - 0.1))
          break
        case 'KeyF':
          e.preventDefault()
          if (current) {
            toggleFavorite(current.id)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [current, isPlaying, currentTime, duration])

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('harshify-favorites', JSON.stringify(Array.from(favorites)))
  }, [favorites])

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good Morning')
    else if (hour < 17) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')

    // Load default tracks
    searchTracks()
  }, [])

  const searchTracks = async () => {
    setLoading(true)
    try {
      const query = search.trim()
      
      // Use our API that fetches from Deezer
      const res = await fetch(`/api/songs${query ? `?search=${encodeURIComponent(query)}` : ''}`)
      const data = await res.json()
      
      // Update tracks with favorite status
      const tracksWithFavorites = data.songs.map((track: Song) => ({
        ...track,
        isFavorite: favorites.has(track.id)
      }))
      
      setTracks(tracksWithFavorites)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
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
    
    // Update track in current list
    setTracks(tracks.map(track => 
      track.id === songId ? { ...track, isFavorite: !track.isFavorite } : track
    ))
  }

  const playTrack = (track: Song) => {
    // Open floating card instead of direct playback
    setSelectedSong(track)
    setIsFloatingCardOpen(true)
  }

  const playPreview = (previewUrl: string) => {
    // Stop current playback
    stopCurrentPlayback()
    
    if (selectedSong) {
      setCurrent(selectedSong)
      setIsPlaying(true)
      
      // Use HTML5 audio for preview
      if (audioRef.current) {
        audioRef.current.src = previewUrl
        audioRef.current.play()
      }
    }
  }

  const stopCurrentPlayback = () => {
    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    
    setIsPlaying(false)
  }

  const togglePlayPause = () => {
    if (!current) return
    
    if (isPlaying) {
      stopCurrentPlayback()
    } else {
      if (audioRef.current) {
        audioRef.current.play()
      }
      setIsPlaying(true)
    }
  }

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime)
      }
      const handleLoadedMetadata = () => {
        setDuration(audio.duration)
      }
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

  // Handle audio end (legacy)
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      const handleEnded = () => {
        setIsPlaying(false)
      }
      audio.addEventListener('ended', handleEnded)
      return () => audio.removeEventListener('ended', handleEnded)
    }
  }, [current])

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'spotify':
        return <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-semibold">Spotify</span>
      case 'itunes':
        return <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-semibold">iTunes</span>
      case 'deezer':
        return <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-semibold">Deezer</span>
      case 'jamendo':
        return <span className="text-xs bg-teal-100 text-teal-600 px-2 py-1 rounded-full font-semibold">Jamendo</span>
      case 'popular':
        return <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full font-semibold">Popular</span>
      case 'lastfm':
        return <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">Last.fm</span>
      case 'soundcloud':
        return <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-semibold">SoundCloud</span>
      case 'youtube':
        return <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">YouTube</span>
      case 'bandcamp':
        return <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-semibold">Bandcamp</span>
      default:
        return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-semibold">Local</span>
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-[#FFE4E1] to-[#FFF0F5] relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 animate-bounce">
          <Music className="w-8 h-8 text-[#FFB6C1] opacity-60" />
        </div>
        <div className="absolute top-32 right-20 animate-pulse">
          <Heart className="w-6 h-6 text-[#FFD580] opacity-50" />
        </div>
        <div className="absolute bottom-20 left-1/4 animate-bounce" style={{ animationDelay: '1s' }}>
          <Sparkles className="w-7 h-7 text-[#FFB6C1] opacity-40" />
        </div>
        <div className="absolute top-1/2 right-1/3 animate-pulse" style={{ animationDelay: '0.5s' }}>
          <Music className="w-5 h-5 text-[#FFD580] opacity-50" />
        </div>
        <div className="absolute bottom-40 right-10 animate-bounce" style={{ animationDelay: '1.5s' }}>
          <Heart className="w-6 h-6 text-[#FFB6C1] opacity-60" />
        </div>
        <div className="absolute top-20 left-1/3 animate-pulse" style={{ animationDelay: '2s' }}>
          <Star className="w-4 h-4 text-[#FFD580] opacity-40" />
        </div>
        <div className="absolute bottom-32 left-16 animate-bounce" style={{ animationDelay: '2.5s' }}>
          <Sparkles className="w-5 h-5 text-[#FFB6C1] opacity-50" />
        </div>
        <div className="absolute top-2/3 right-16 animate-pulse" style={{ animationDelay: '3s' }}>
          <Star className="w-6 h-6 text-[#FFD580] opacity-30" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex justify-center items-center gap-2 mb-6">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-[#FFB6C1] to-[#FFD580] bg-clip-text text-transparent" style={{ fontFamily: 'cursive' }}>
              Harshify
            </h1>
            <span className="text-3xl">💛</span>
          </div>
          
          {/* Greeting */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-semibold bg-gradient-to-r from-[#FFB6C1] to-[#FFD580] bg-clip-text text-transparent mb-2" style={{ fontFamily: 'cursive' }}>
              {greeting}, Dear Listener 🎵
            </h2>
            <p className="text-[#3B3B3B] opacity-80">Ready to brighten your day with music?</p>
            <div className="text-xs text-[#3B3B3B] opacity-60 mt-2">
              💡 Keyboard shortcuts: Space (play/pause) • ← → (seek) • ↑ ↓ (volume) • F (favorite)
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex justify-center items-center gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#3B3B3B] opacity-60 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search your song..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
                className="pl-12 pr-4 py-3 rounded-full border-2 border-[#FFB6C1] bg-white/80 backdrop-blur-sm focus:border-[#FFD580] transition-all duration-300 shadow-lg"
              />
            </div>
            <Button
              onClick={searchTracks}
              className="bg-gradient-to-r from-[#FFB6C1] to-[#FFD580] hover:from-[#FFB6C1]/90 hover:to-[#FFD580]/90 text-white rounded-full px-6 py-3 font-semibold shadow-lg hover:scale-105 transition-all duration-300"
            >
              Search
            </Button>
          </div>
        </header>

        {/* View Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-lg">
            <Button
              variant={currentView === 'all' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('all')}
              className={`rounded-full px-6 py-2 font-medium transition-all duration-300 ${
                currentView === 'all' 
                  ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD580] text-white shadow-md' 
                  : 'text-[#3B3B3B] hover:bg-[#FFB6C1]/20'
              }`}
            >
              <ListMusic className="w-4 h-4 mr-2" />
              All Songs
            </Button>
            <Button
              variant={currentView === 'favorites' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('favorites')}
              className={`rounded-full px-6 py-2 font-medium transition-all duration-300 ${
                currentView === 'favorites' 
                  ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD580] text-white shadow-md' 
                  : 'text-[#3B3B3B] hover:bg-[#FFB6C1]/20'
              }`}
            >
              <Heart className="w-4 h-4 mr-2" />
              Favorites ({favorites.size})
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-10">
            <div className="inline-flex items-center gap-2 text-[#FFB6C1]">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFB6C1]"></div>
              <span className="text-lg font-medium">Loading beautiful tracks...</span>
            </div>
          </div>
        )}

        {/* Empty State for Favorites */}
        {!loading && currentView === 'favorites' && tracks.filter(track => track.isFavorite).length === 0 && (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-[#FFB6C1]/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#3B3B3B] mb-2">No favorites yet</h3>
            <p className="text-[#3B3B3B] opacity-70 mb-6">Start adding some songs to your favorites!</p>
            <Button
              onClick={() => setCurrentView('all')}
              className="bg-gradient-to-r from-[#FFB6C1] to-[#FFD580] hover:from-[#FFB6C1]/90 hover:to-[#FFD580]/90 text-white rounded-full px-6 py-3 font-semibold shadow-lg"
            >
              Browse All Songs
            </Button>
          </div>
        )}

        {/* Music Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-24">
          {(currentView === 'favorites' 
            ? tracks.filter(track => track.isFavorite) 
            : tracks
          ).map((track) => (
            <div
              key={track.id}
              className="group bg-white rounded-2xl shadow-lg p-4 hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer"
              onClick={() => playTrack(track)}
            >
              <div className="relative mb-4">
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className="w-full h-40 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="w-full h-40 bg-gradient-to-br from-[#FFB6C1] to-[#FFD580] rounded-2xl flex items-center justify-center hidden">
                  <Music className="w-16 h-16 text-white opacity-80" />
                </div>
                
                {/* Currently playing indicator */}
                {current?.id === track.id && (
                  <div className="absolute top-2 left-2 bg-[#FFD580] text-white rounded-full p-2 animate-pulse">
                    {isPlaying ? <Volume2 className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                  </div>
                )}
                
                {/* Source indicator */}
                <div className="absolute top-2 right-2">
                  {getSourceIcon(track.source)}
                </div>
                
                {/* Favorite Button */}
                <Button
                  size="sm"
                  className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-[#FFB6C1] rounded-full p-2 shadow-lg group-hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(track.id)
                  }}
                >
                  <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-current text-red-500' : ''}`} />
                </Button>
              </div>
              
              <h3 className="font-bold text-lg text-[#3B3B3B] mb-1 truncate">{track.title}</h3>
              <p className="text-sm text-[#3B3B3B] opacity-70 mb-1 truncate">{track.artist}</p>
              <p className="text-xs text-[#3B3B3B] opacity-50 mb-2 truncate">{track.album}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#3B3B3B] opacity-60">{track.duration}</span>
                <Play className="w-4 h-4 text-[#FFB6C1] group-hover:text-[#FFD580] transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* Now Playing Player */}
        {current && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-11/12 max-w-2xl z-50">
            <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img 
                    src={current.coverUrl} 
                    alt={current.album}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <div className="w-full h-full bg-gradient-to-br from-[#FFB6C1] to-[#FFD580] rounded-xl flex items-center justify-center hidden">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#3B3B3B]">{current.title}</h3>
                    {getSourceIcon(current.source)}
                  </div>
                  <p className="text-sm text-[#3B3B3B] opacity-70">{current.artist}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#FFB6C1] to-[#FFD580] hover:from-[#FFB6C1]/90 hover:to-[#FFD580]/90 text-white rounded-full p-3 shadow-lg"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-white/90 hover:bg-white text-[#FFB6C1] rounded-full p-3 shadow-lg"
                    onClick={() => toggleFavorite(current.id)}
                  >
                    <Heart className={`w-5 h-5 ${current.isFavorite ? 'fill-current text-red-500' : ''}`} />
                  </Button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#3B3B3B] opacity-70 w-10">
                    {formatTime(currentTime)}
                  </span>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleProgressChange}
                      className="w-full h-2 bg-[#FFB6C1]/30 rounded-full appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #FFB6C1 0%, #FFD580 ${(currentTime / (duration || 1)) * 100}%, #FFB6C1 30% ${(currentTime / (duration || 1)) * 100}%, #FFB6C1 30%)`
                      }}
                    />
                  </div>
                  <span className="text-xs text-[#3B3B3B] opacity-70 w-10">
                    {formatTime(duration)}
                  </span>
                </div>
                
                {/* Volume Control */}
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-[#FFB6C1]" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1 bg-[#FFB6C1]/30 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #FFB6C1 0%, #FFD580 ${volume * 100}%, #FFB6C1 30% ${volume * 100}%, #FFB6C1 30%)`
                    }}
                  />
                  <span className="text-xs text-[#3B3B3B] opacity-70 w-8">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {/* Hidden Audio Elements */}
        <audio ref={audioRef} className="hidden" />
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }
        
        input[type="range"]::-webkit-slider-track {
          background: inherit;
          height: 8px;
          border-radius: 4px;
        }
        
        input[type="range"]::-moz-range-track {
          background: inherit;
          height: 8px;
          border-radius: 4px;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          background: #FFD580;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          margin-top: -4px;
        }
        
        input[type="range"]::-moz-range-thumb {
          background: #FFD580;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          border: none;
        }
        
        input[type="range"]:hover::-webkit-slider-thumb {
          background: #FFB6C1;
          transform: scale(1.1);
        }
        
        input[type="range"]:hover::-moz-range-thumb {
          background: #FFB6C1;
          transform: scale(1.1);
        }
      `}</style>

      {/* Floating Song Card */}
      <SongFloatingCard
        song={selectedSong!}
        isOpen={isFloatingCardOpen && !!selectedSong}
        onClose={() => setIsFloatingCardOpen(false)}
        onPlay={playPreview}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  )
}