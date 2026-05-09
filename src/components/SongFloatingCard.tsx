import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Heart, X, Share2, Info, ListMusic, Volume2, Sparkles, Clock, Globe, Shield, TrendingUp, Zap } from 'lucide-react'
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

interface SongFloatingCardProps {
  song: Song
  isOpen: boolean
  onClose: () => void
  onPlay: (previewUrl: string) => void
  onToggleFavorite: (songId: string) => void
}

export default function SongFloatingCard({ song, isOpen, onClose, onPlay, onToggleFavorite }: SongFloatingCardProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'analytics'>('details')

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
            className="relative w-full max-w-4xl bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col md:flex-row border border-white/20"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-8 right-8 z-20 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 hover:bg-primary hover:text-white transition-all shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Left: Visual & Controls */}
            <div className="w-full md:w-2/5 p-10 bg-slate-50 flex flex-col items-center justify-center border-r border-slate-100">
              <div className="relative group w-full max-w-[300px] aspect-square rounded-[3rem] overflow-hidden shadow-2xl mb-10">
                <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{song.source}</p>
                </div>
              </div>

              <div className="flex gap-4 w-full">
                <Button 
                  onClick={() => onPlay(song.preview)}
                  className="flex-1 bg-primary text-white rounded-[1.5rem] py-8 text-lg font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <Play className="w-6 h-6 fill-current" /> Play Now
                </Button>
                <Button
                  onClick={() => onToggleFavorite(song.id)}
                  variant="outline"
                  className={`w-20 rounded-[1.5rem] border-2 transition-all ${song.isFavorite ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-slate-200 text-slate-300 hover:border-rose-500 hover:text-rose-500'}`}
                >
                  <Heart className={`w-6 h-6 ${song.isFavorite ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Right: Info & Tabs */}
            <div className="flex-1 p-10 md:p-14">
              <header className="mb-12">
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4">
                  <TrendingUp className="w-4 h-4" /> MelodyMentor Insight
                </div>
                <h2 className="text-5xl font-black text-slate-900 mb-2 leading-[1.1] tracking-tighter">{song.title}</h2>
                <p className="text-xl text-slate-400 font-bold italic">by {song.artist}</p>
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
