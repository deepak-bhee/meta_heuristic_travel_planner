import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, MapPin, AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Map from '../components/Map';

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state || !state.result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center space-y-4">
          <p className="text-slate-400">No results found.</p>
          <button onClick={() => navigate('/plan')} className="text-blue-400 hover:text-blue-300">
            Go back to planner
          </button>
        </div>
      </div>
    );
  }

  const { result, form } = state;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col h-screen">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur border-b border-white/5 py-4 px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/plan')}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Your Optimized Itinerary</h1>
            <p className="text-sm text-slate-400">
              {form.city} • {result.total_travel_time} • {result.total_distance}
            </p>
          </div>
        </div>
        
        {result.warnings?.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-full text-sm font-medium border border-amber-500/20">
            <AlertTriangle className="w-4 h-4" />
            {result.warnings.length} Warning(s)
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar / Timeline */}
        <div className="w-full md:w-1/3 lg:w-96 bg-slate-800/30 overflow-y-auto border-r border-white/5 p-6 space-y-8">
          
          {result.warnings?.length > 0 && (
            <div className="space-y-2">
              {result.warnings.map((warn, i) => (
                <div key={i} className="flex gap-2 text-sm text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p>{warn}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-6">
            {result.itinerary.map(day => (
              <div key={day.day} className="space-y-6">
                <h2 className="text-lg font-semibold text-emerald-400 sticky top-0 bg-slate-900/90 py-2 backdrop-blur z-10">
                  Day {day.day}
                </h2>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:to-emerald-500">
                  {day.schedule.map((item, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-blue-500 text-white shadow shrink-0 absolute left-0 md:left-1/2 -translate-x-1/2 z-10 font-bold text-sm">
                        {i + 1}
                      </div>
                      
                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] ml-auto md:ml-0 group-odd:md:ml-auto group-odd:md:mr-0 group-even:md:mr-auto group-even:md:ml-0 bg-slate-800/80 p-4 rounded-xl border border-white/5 hover:bg-slate-700/80 transition-colors shadow-lg relative">
                        {/* Connecting arrow */}
                        <div className="absolute top-5 -left-2 md:group-even:-left-2 md:group-odd:-right-2 md:group-odd:left-auto w-4 h-4 bg-slate-800/80 border-t border-l border-white/5 transform -rotate-45 md:group-odd:rotate-[135deg]"></div>
                        
                        <div className="relative z-10">
                          <h3 className="font-semibold text-white mb-1">{item.location}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                            <Clock className="w-4 h-4" />
                            {item.arrival_time} - {item.departure_time}
                          </div>
                          <div className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            {item.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map View */}
        <div className="hidden md:block flex-1 bg-slate-900 relative">
          <Map itinerary={result.itinerary} city={form.city} />
        </div>
      </div>
    </div>
  );
}
