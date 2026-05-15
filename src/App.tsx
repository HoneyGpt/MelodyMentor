import { useState, useEffect } from 'react'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import Footer from '@/components/landing/Footer'
import { Headphones } from 'lucide-react'
import MusicApp from '@/components/MusicApp'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function App() {
  const [showApp, setShowApp] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [showApp])

  useEffect(() => {
    // Check session on mount to skip landing for signed-in users
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setShowApp(true)
      })
    }
  }, [])

  return (
    <main className="min-h-screen bg-white selection:bg-primary/20 overflow-x-hidden">
      <AnimatePresence>
        {!showApp ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-[#0f172a] text-white py-3.5 text-center relative z-[60] border-b border-white/5">
              <div className="container mx-auto px-6 flex items-center justify-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold tracking-tight">
                  Experience MelodyMentor on your phone. 
                  <a href="/base.apk" download className="text-primary hover:text-indigo-400 ml-2 transition-colors inline-flex items-center gap-1.5">
                    Download mobile app of us <span className="text-lg">→</span>
                  </a>
                </p>
              </div>
            </div>
            <Navbar onStartListening={() => setShowApp(true)} />
            <Hero onStartListening={() => setShowApp(true)} />
            
            <section id="about" className="py-32 bg-slate-50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
              <div className="container mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
                <div className="order-2 md:order-1">
                  <div className="relative">
                    <div className="bg-white p-4 rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(79,70,229,0.1)] relative z-10 border border-slate-100">
                      <img 
                        src="https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=800" 
                        alt="Music Experience" 
                        className="rounded-[2.5rem] w-full h-auto"
                      />
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                    <span className="text-sm font-bold text-primary">MelodyMentor by Mentozy</span>
                  </div>
                  <h2 className="text-5xl font-black text-slate-900 mb-8 leading-[1.1]">
                    Unlimited songs. <br />
                    Limitless entertainment. <br />
                    <span className="text-primary">Zero Ads.</span>
                  </h2>
                  <p className="text-xl text-slate-500 mb-10 leading-relaxed">
                    Experience music the way it was meant to be. MelodyMentor brings you the world's largest catalog with premium features available to everyone, for free. No interruptions, just pure sound.
                  </p>
                  <button 
                    onClick={() => setShowApp(true)}
                    className="bg-primary text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center gap-3 group"
                  >
                    Start Listening Now <span className="group-hover:translate-x-2 transition-transform">→</span>
                  </button>
                </div>
              </div>
            </section>

            <Features />
            
            <section className="py-32 relative overflow-hidden bg-primary">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent_70%)]" />
              <div className="container mx-auto px-6 relative z-10 text-center text-white">
                <h2 className="text-5xl md:text-6xl font-black mb-8 leading-tight">Your music, your rules.</h2>
                <p className="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto leading-relaxed">
                  Join millions of users on MelodyMentor and discover why we're the fastest growing music community. Limitless entertainment starts here.
                </p>
                <button 
                  onClick={() => setShowApp(true)}
                  className="bg-white text-primary px-12 py-6 rounded-2xl text-xl font-black shadow-2xl hover:scale-105 transition-all active:scale-95"
                >
                  Get Started for Free
                </button>
              </div>
            </section>

            <Footer />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <MusicApp onBackToLanding={() => setShowApp(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
