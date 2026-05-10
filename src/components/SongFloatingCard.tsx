import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Heart, X, Share2, Info, ListMusic, Volume2, Sparkles, Clock, Globe, Shield, TrendingUp, Zap, Plus, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

interface SongFloatingCardProps {
  song: Song
  isOpen: boolean
  onClose: () => void
  onPlay: (previewUrl: string) => void
  onToggleFavorite: (songId: string) => void
  onAddToQueue: (song: Song) => void
  onAddToPlayNext: (song: Song) => void
  onAddToPlaylist: (playlistId: string, song: Song) => void
  playlists: Playlist[]
}

export default function SongFloatingCard({ song, isOpen, onClose, onPlay, onToggleFavorite, onAddToQueue, onAddToPlayNext, onAddToPlaylist, playlists }: SongFloatingCardProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'analytics'>('details')
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false)

  if (!song) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="relative w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] bg-slate-900 rounded-[2rem] md:rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row border border-white/5 text-white m-4"
          >
            {/* Close Button */}
             <button
              onClick={onClose}
              className="absolute top-6 right-6 md:top-8 md:right-8 z-20 w-10 h-10 md:w-12 md:h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-primary transition-all shadow-lg"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {/* Left: Visual & Controls */}
            <div className="w-full md:w-2/5 p-8 md:p-10 bg-black flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5">
              <div className="relative group w-full max-w-[280px] md:max-w-[300px] aspect-square rounded-2xl md:rounded-[3rem] overflow-hidden shadow-2xl mb-8 md:mb-10">
                <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="flex flex-col gap-4 w-full">
                <Button 
                  onClick={() => onPlay(song.preview)}
                  className="w-full bg-primary text-white rounded-[1.5rem] py-8 text-lg font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <Play className="w-6 h-6 fill-current" /> Play Now
                </Button>
                
                <div className="flex gap-3 md:gap-4">
                  <Button
                    onClick={() => onToggleFavorite(song.id)}
                    variant="outline"
                    title="Favorite"
                    className={`flex-1 h-14 md:h-16 rounded-xl md:rounded-[1.2rem] border-2 transition-all ${song.isFavorite ? 'bg-rose-500 border-rose-500 text-white' : 'bg-transparent border-white/10 text-slate-500 hover:border-rose-500 hover:text-rose-500'}`}
                  >
                    <Heart className={`w-6 h-6 ${song.isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    onClick={() => onAddToQueue(song)}
                    variant="outline"
                    title="Add to Queue"
                    className="flex-1 h-14 md:h-16 rounded-xl md:rounded-[1.2rem] border-2 bg-transparent border-white/10 text-slate-500 hover:border-primary hover:text-primary transition-all"
                  >
                    <ListMusic className="w-6 h-6" />
                  </Button>
                  <Button
                    onClick={() => onAddToPlayNext(song)}
                    variant="outline"
                    title="Play Next"
                    className="flex-1 h-14 md:h-16 rounded-xl md:rounded-[1.2rem] border-2 bg-transparent border-white/10 text-slate-500 hover:border-primary hover:text-primary transition-all"
                  >
                    <SkipForward className="w-6 h-6" />
                  </Button>
                </div>

                <div className="relative">
                  <Button
                    onClick={() => setShowPlaylistSelector(!showPlaylistSelector)}
                    variant="outline"
                    className="w-full h-14 md:h-16 rounded-xl md:rounded-[1.2rem] border-2 bg-transparent border-white/10 text-slate-500 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Add to Playlist
                  </Button>

                  <AnimatePresence>
                    {showPlaylistSelector && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-30"
                      >
                        {playlists.length === 0 ? (
                          <div className="p-4 text-xs font-bold text-slate-500 text-center">No playlists created</div>
                        ) : (
                          playlists.map(p => (
                            <button
                              key={p.id}
                              onClick={() => {
                                onAddToPlaylist(p.id, song);
                                setShowPlaylistSelector(false);
                              }}
                              className="w-full p-4 text-left text-xs font-black text-white hover:bg-slate-700 transition-colors border-b border-white/5 last:border-0"
                            >
                              {p.name}
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Right: Details & Info */}
            <div className="flex-1 p-6 md:p-14 overflow-y-auto no-scrollbar bg-slate-900/50 backdrop-blur-sm">
              <header className="mb-8 md:mb-10">
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4">
                  <TrendingUp className="w-4 h-4" /> MelodyMentor Insight
                </div>
                <h2 className="text-3xl md:text-6xl font-black text-white mb-2 leading-[1.1] tracking-tighter">{song.title}</h2>
                <p className="text-lg md:text-2xl text-slate-500 font-bold">by {song.artist}</p>
              </header>

              {/* Tabs */}
              <div className="flex gap-10 border-b border-slate-100 mb-10">
                {['details', 'analytics'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`pb-4 text-xs font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === tab ? 'text-primary' : 'text-slate-300 hover:text-slate-500'}`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div layoutId="activeTabDetails" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[240px]">
                {activeTab === 'details' ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3 text-slate-400 mb-3">
                        <Clock className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Duration</span>
                      </div>
                      <p className="text-2xl font-black text-slate-900">{song.duration}</p>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3 text-slate-400 mb-3">
                        <Globe className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Global Reach</span>
                      </div>
                      <p className="text-2xl font-black text-slate-900">100%</p>
                    </div>
                    <div className="col-span-2 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3 text-slate-400 mb-3">
                        <Zap className="w-4 h-4 text-primary fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Playback Status</span>
                      </div>
                      <p className="text-2xl font-black text-slate-900">Unrestricted Ad-Free Access</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {[
                      { label: "Melody Precision", value: 98, color: "bg-primary" },
                      { label: "Emotional Impact", value: 92, color: "bg-rose-500" },
                      { label: "Production Quality", value: 85, color: "bg-violet-500" }
                    ].map((stat, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-3">
                          <span className="text-sm font-black text-slate-900 uppercase tracking-widest">{stat.label}</span>
                          <span className="text-sm font-black text-primary">{stat.value}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.value}%` }}
                            transition={{ duration: 1.5, ease: "circOut", delay: i * 0.1 }}
                            className={`h-full rounded-full ${stat.color} shadow-lg`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="mt-14 pt-10 border-t border-slate-100 flex items-center justify-between">
                <div className="flex gap-4">
                  <Button variant="ghost" className="text-slate-400 hover:text-primary gap-3 font-bold">
                    <Share2 className="w-5 h-5" /> Share
                  </Button>
                  <Button variant="ghost" className="text-slate-400 hover:text-primary gap-3 font-bold">
                    <ListMusic className="w-5 h-5" /> Add to Library
                  </Button>
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                  MelodyMentor v1.0
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
