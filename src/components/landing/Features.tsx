import { Search, Sparkles, Heart, Globe, Shield, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: <Search className="w-6 h-6" />,
    title: "Global Intelligence",
    description: "Search across every major music database with our proprietary AI indexing system."
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Tone Analysis",
    description: "Understand the emotional depth and technical structure of every track you discover."
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Privacy First",
    description: "Your listening habits and favorites are yours alone. Secure, private, and encrypted."
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Borderless Catalog",
    description: "Access regional exclusives and underground hits from around the globe in high fidelity."
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Ultra-Low Latency",
    description: "Experience zero-buffer streaming and instant search results with our global edge nodes."
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Smart Library",
    description: "An intuitive collection that learns your preferences and organizes itself automatically."
  }
]

export default function Features() {
  return (
    <section id="features" className="py-32 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-sm font-bold text-accent uppercase tracking-[0.3em] mb-4">Core Ecosystem</h2>
          <p className="text-4xl md:text-5xl font-extrabold text-primary mb-6">
            Everything you need for the <span className="text-accent">perfect listening</span> experience.
          </p>
          <p className="text-xl text-slate-500">
            Smart Tones provides a comprehensive suite of tools for music professionals and enthusiasts alike.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-10 rounded-[2rem] bg-slate-50 border border-slate-100 hover:border-accent/30 hover:bg-white hover:shadow-2xl transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-all">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-primary mb-4">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed text-lg">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
