import { Music, Zap } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-32">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-20 mb-20">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tighter leading-none">
                  MelodyMentor
                </span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">by Mentozy</span>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed text-lg mb-10 max-w-sm">
              Unlimited songs and limitless entertainment with absolutely no ads. The future of music is here, and it's powered by Mentozy.
            </p>
            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full w-fit">
              <Zap className="w-4 h-4 text-primary fill-current" />
              <span className="text-xs font-black uppercase tracking-widest">100% Ad-Free Platform</span>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-black mb-8 tracking-tight">MelodyMentor</h4>
            <ul className="space-y-4 text-slate-400 font-bold">
              {['Features', 'Discovery', 'Trending', 'Mobile App'].map((item) => (
                <li key={item}><a href="#" className="hover:text-primary transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-black mb-8 tracking-tight">Legal & Privacy</h4>
            <ul className="space-y-4 text-slate-400 font-bold">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Help Center'].map((item) => (
                <li key={item}><a href="#" className="hover:text-primary transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-500 text-sm font-bold">
          <p>© 2026 MelodyMentor by Mentozy. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="uppercase tracking-[0.2em] text-[10px]">Global Servers Online</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
