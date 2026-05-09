import { Zap, ArrowRight, Music, Play, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface HeroProps {
  onStartListening: () => void
}

export default function Hero({ onStartListening }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-white">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-2/3 h-full bg-indigo-50/50 -skew-x-12 translate-x-24" />
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-rose-400/5 rounded-full blur-[100px]" />
      
      <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full mb-8 border border-indigo-100">
            <Zap className="w-4 h-4 text-primary fill-current" />
            <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">Ad-Free Music for Everyone</span>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black text-slate-900 leading-[0.95] mb-8 tracking-tighter">
            Play Any Song, <br />
            <span className="text-primary italic">Anywhere.</span>
          </h1>
          
          <p className="text-xl text-slate-500 mb-12 max-w-lg leading-relaxed font-medium">
            MelodyMentor by Mentozy gives you access to millions of tracks, curated playlists, and full albums. No subscription, no ads, no limits.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5">
            <Button 
              onClick={onStartListening}
              className="bg-primary text-white rounded-[1.5rem] px-12 py-9 text-xl font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center gap-4 group"
            >
              Start Playing <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Button>
            <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <p className="text-sm font-bold text-slate-600 leading-tight">No Credit Card <br />Required</p>
            </div>
          </div>

          <div className="mt-16 flex items-center gap-6">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-md">
                  <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="User" />
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <p className="text-sm text-slate-900 font-black">Join 5 Million+ Listeners</p>
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((i) => <span key={i}>★</span>)}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <div className="relative z-10 bg-white p-6 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-50">
            <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-slate-900 relative group">
              <img 
                src="https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=800" 
                alt="MelodyMentor Experience" 
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
              <div className="absolute bottom-10 left-10 right-10">
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/20">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-xl">
                    <Music className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-white font-black text-2xl tracking-tight">Now Playing</p>
                    <p className="text-indigo-100 font-bold opacity-80 italic">The Mentozy Session</p>
                  </div>
                  <div className="ml-auto w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-lg cursor-pointer hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl" />
        </motion.div>
      </div>
    </section>
  )
}
