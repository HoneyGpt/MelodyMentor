import { useState, useEffect } from 'react'
import { Music, Menu, X, ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface NavbarProps {
  onStartListening: () => void
}

export default function Navbar({ onStartListening }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          <div className="bg-primary p-2.5 rounded-2xl shadow-lg shadow-indigo-200 transition-transform group-hover:scale-110">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">
              MelodyMentor
            </span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">by Mentozy</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="text-slate-600 hover:text-primary font-bold transition-colors">Features</a>
          <div className="flex items-center gap-2 text-indigo-400 bg-indigo-50 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
            <Zap className="w-3 h-3 fill-current" /> No Ads
          </div>
          <Button 
            onClick={onStartListening}
            className="bg-primary text-white rounded-2xl px-8 py-3 font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
          >
            Open App
          </Button>
        </div>

        <button className="md:hidden text-slate-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white border-b border-slate-100 overflow-hidden shadow-2xl"
          >
            <div className="flex flex-col p-8 gap-6">
              <a href="#features" className="text-xl font-bold text-slate-900">Features</a>
              <div className="flex items-center gap-3 text-primary font-black uppercase tracking-widest">
                <Zap className="w-5 h-5 fill-current" /> Ad-Free Experience
              </div>
              <Button 
                onClick={() => {
                  onStartListening()
                  setMobileMenuOpen(false)
                }}
                className="bg-primary text-white rounded-2xl w-full py-6 text-lg font-bold"
              >
                Start Listening <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
