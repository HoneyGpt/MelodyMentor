import { Zap, ArrowRight, Music, Play, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface HeroProps {
  onStartListening: () => void
}

export default function Hero({ onStartListening }: HeroProps) {
  return (
    <section className="relative min-h-screen pt-24 pb-20 overflow-hidden bg-[#fffbeb]">
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          
          {/* Left Stats Column */}
          <div className="hidden lg:flex flex-col gap-6 w-72 shrink-0">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#4f46e5] rounded-[3rem] p-8 text-white h-full relative overflow-hidden shadow-2xl shadow-indigo-100"
            >
              <div className="relative z-10">
                <h3 className="text-5xl font-black mb-2">15M+</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 leading-tight">Global <br /> Music Library</p>
              </div>
              <div className="absolute top-8 right-8 w-16 h-16 border border-white/20 rounded-full flex items-center justify-center opacity-30">
                <Music className="w-6 h-6 text-white" />
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#fed7aa] rounded-[3rem] p-8 text-[#9a3412] h-full shadow-lg shadow-orange-100"
            >
              <h3 className="text-5xl font-black mb-2">100%</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 leading-tight">Zero Ads <br /> Always Free</p>
            </motion.div>
          </div>

          {/* Main Hero Center */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex-1 bg-white rounded-[4rem] p-10 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center gap-12 shadow-[0_40px_80px_-15px_rgba(79,70,229,0.1)]"
          >
            <div className="flex-1 relative z-10 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full mb-8 border border-indigo-100">
                <Zap className="w-4 h-4 text-[#4f46e5] fill-current" />
                <span className="text-[10px] font-black text-[#4f46e5] uppercase tracking-[0.2em]">POWERED BY MENTOZY</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tighter">
                Music for the <br /> <span className="text-[#4f46e5]">Next Generation.</span>
              </h1>
              <p className="text-lg text-slate-500 mb-12 max-w-sm leading-relaxed font-medium">
                MelodyMentor brings you unlimited high-fidelity music, curated by Mentozy for a seamless listening experience.
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                <Button 
                  onClick={onStartListening}
                  className="bg-[#4f46e5] text-white rounded-full px-12 py-8 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-[#4338ca] transition-all hover:-translate-y-1"
                >
                  Start Listening
                </Button>
                <button onClick={onStartListening} className="flex items-center gap-4 group">
                  <div className="w-14 h-14 rounded-full border-2 border-slate-100 flex items-center justify-center text-[#4f46e5] group-hover:bg-[#4f46e5] group-hover:text-white transition-all">
                    <Play className="w-5 h-5 fill-current ml-1" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Session</span>
                </button>
              </div>
            </div>

            <div className="flex-1 relative">
              <img src="/landing/hero_brand.png" className="w-full h-auto relative z-10 drop-shadow-[0_35px_35px_rgba(0,0,0,0.1)]" alt="Mentozy Brand Hero" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-100 rounded-full blur-[100px] opacity-40" />
            </div>
          </motion.div>
        </div>

        {/* Bottom Cards */}
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-[#fb923c] rounded-[4rem] p-12 text-white flex items-center gap-10 overflow-hidden group shadow-2xl shadow-orange-100"
          >
            <div className="flex-1 min-w-0">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6 opacity-80">Mentozy Ecosystem</h4>
              <p className="text-base font-black leading-tight mb-8">Integrated with the Mentozy student network for exclusive content and social features.</p>
              <div className="flex gap-4">
                <Button onClick={onStartListening} variant="secondary" className="bg-white/20 hover:bg-white/40 text-white border-none rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest">Learn More</Button>
              </div>
            </div>
            <div className="w-48 h-48 rounded-[3rem] overflow-hidden shadow-2xl shrink-0 border-4 border-white/20">
              <img src="/landing/service.png" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-slate-900 rounded-[4rem] p-12 text-white flex items-center gap-10 overflow-hidden group shadow-2xl"
          >
            <div className="w-48 h-48 rounded-[3rem] overflow-hidden shadow-2xl shrink-0 border-4 border-white/10">
              <img src="/landing/event.png" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6 opacity-80">Melody Features</h4>
              <p className="text-base font-black leading-tight mb-8">High-fidelity audio streaming with smart queue management and personal collections.</p>
              <div className="flex justify-end gap-4 opacity-50">
                <span className="text-[10px] font-black uppercase tracking-widest italic">MelodyMentor v1.0</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
