import { Link } from 'react-router-dom';
import { MapPin, Clock, Navigation } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
      <div className="max-w-4xl w-full space-y-12 text-center">
        {/* Hero Section */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            AI-Powered Optimization
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Smart Travel Itineraries
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Experience the future of travel planning. Our Meta-Heuristic ML model optimizes your routes, saving you time and hassle.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 pt-8">
          {[
            {
              icon: <Clock className="w-8 h-8 text-blue-400" />,
              title: "Time Optimized",
              desc: "Save hours of travel time with ML-predicted optimal routes."
            },
            {
              icon: <MapPin className="w-8 h-8 text-emerald-400" />,
              title: "Smart Discovery",
              desc: "Discover perfectly sequenced locations based on your preferences."
            },
            {
              icon: <Navigation className="w-8 h-8 text-purple-400" />,
              title: "Real-time Ready",
              desc: "Adaptive scheduling built for the realities of modern travel."
            }
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300">
              <div className="bg-slate-800/50 w-16 h-16 rounded-xl flex items-center justify-center mb-6 mx-auto">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Action */}
        <div className="pt-12">
          <Link
            to="/plan"
            className="group relative inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full overflow-hidden transition-all shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:shadow-[0_0_60px_rgba(37,99,235,0.5)] hover:-translate-y-1"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Planning
              <Navigation className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-blue-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>
      </div>
    </div>
  );
}
