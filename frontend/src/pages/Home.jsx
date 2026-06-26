import { Link } from 'react-router-dom';
import { MapPin, Clock, Navigation, Sparkles, Compass, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#0f172a_50%,_#111827_100%)] px-6 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_30px_90px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-10 lg:p-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-300">
                <Sparkles className="h-4 w-4" />
                AI-powered trip orchestration
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Discover your next trip with <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">WanderAI</span>
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-400">
                  Build memorable itineraries with intelligent routing, smart stop selection, and a map that feels alive in real time.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/plan"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 px-6 py-3 font-semibold text-white transition hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(37,99,235,0.3)]"
                >
                  Start planning
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="/plan"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-slate-300 transition hover:border-blue-400/30 hover:text-white"
                >
                  Explore features
                </a>
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-800/70 p-4">
                  <div className="text-2xl font-semibold text-white">4.9/5</div>
                  <p className="text-sm text-slate-400">Trip satisfaction</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-800/70 p-4">
                  <div className="text-2xl font-semibold text-white">15+</div>
                  <p className="text-sm text-slate-400">Smart stops</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-800/70 p-4">
                  <div className="text-2xl font-semibold text-white">Live</div>
                  <p className="text-sm text-slate-400">Interactive maps</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-slate-800/70 p-5 shadow-2xl">
              <div className="rounded-[1.25rem] border border-white/10 bg-slate-900/80 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-300">Trip preview</p>
                    <h2 className="text-xl font-semibold text-white">Your route, designed elegantly</h2>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 p-2 text-emerald-400">
                    <Compass className="h-5 w-5" />
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    ['Optimized flow', 'Balanced timing and route efficiency'],
                    ['Live map controls', 'Switch between roadmap and satellite'],
                    ['Smart recommendations', 'Tailored from your preferences']
                  ].map(([title, desc]) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-slate-800/80 p-3">
                      <p className="font-medium text-white">{title}</p>
                      <p className="mt-1 text-sm text-slate-400">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: <Clock className="h-8 w-8 text-blue-400" />,
              title: 'Time optimized',
              desc: 'Save hours with AI-friendly sequencing for each day of your journey.'
            },
            {
              icon: <MapPin className="h-8 w-8 text-emerald-400" />,
              title: 'Smart discovery',
              desc: 'Surface the spots that fit your interests and pace without overwhelming you.'
            },
            {
              icon: <Navigation className="h-8 w-8 text-purple-400" />,
              title: 'Live-ready',
              desc: 'Enjoy a polished planner with a map that supports both street and satellite modes.'
            }
          ].map((feature, index) => (
            <div key={index} className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-slate-800/70">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
