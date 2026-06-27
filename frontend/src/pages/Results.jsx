import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, MapPin, AlertTriangle, ArrowLeft, CheckCircle2, Compass, Route, PanelRightOpen, X } from 'lucide-react';
import Map from '../components/Map';

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);
  const [shareStatus, setShareStatus] = useState('');

  const cityLocation = state?.form?.selectedLocations?.[0] || { lat: 18.944, lng: 72.823 };

  useEffect(() => {
    if (!state || !state.result) return;

    const fetchWeather = async () => {
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${cityLocation.lat}&longitude=${cityLocation.lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&current_weather=true&timezone=auto&forecast_days=4`
        );

        if (!response.ok) {
          throw new Error('Weather service unavailable');
        }

        const data = await response.json();
        setWeatherData(data);
      } catch (error) {
        setWeatherError('Unable to load weather data');
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, [state, cityLocation.lat, cityLocation.lng]);

  if (!state || !state.result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="space-y-4 text-center">
          <p className="text-slate-400">No results found.</p>
          <button onClick={() => navigate('/plan')} className="text-blue-400 hover:text-blue-300">
            Go back to planner
          </button>
        </div>
      </div>
    );
  }

  const { result, form } = state;
  const totalStops = result.itinerary.reduce((count, day) => count + day.schedule.length, 0);
  const totalDays = result.itinerary.length;

  const shareTrip = () => {
    if (!state || !state.result || !state.form) return;

    // Build a full human-readable itinerary string
    const lines = [];
    lines.push(`🗺️ WanderAI Trip — ${state.form.city}`);
    lines.push(`📅 ${totalDays} day${totalDays > 1 ? 's' : ''} • ${totalStops} stops • ${result.total_travel_time}`);
    lines.push('');

    result.itinerary.forEach((day) => {
      lines.push(`── Day ${day.day} ──`);
      day.schedule.forEach((item, i) => {
        lines.push(`  ${i + 1}. ${item.location}  [${item.arrival_time} – ${item.departure_time}]  ${item.status === 'skipped' ? '⚠️ skipped' : '✅'}`);
      });
      lines.push('');
    });

    lines.push(`Generated with WanderAI Meta-Heuristic Travel Planner`);
    const fullText = lines.join('\n');

    // Reliable copy — works on HTTP + all browsers via textarea trick
    const copyViaTextarea = (text) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    };

    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      // Native share on mobile
      navigator.share({ title: `WanderAI trip to ${state.form.city}`, text: fullText })
        .then(() => setShareStatus('✅ Trip shared!'))
        .catch(() => setShareStatus('❌ Share cancelled'));
    } else if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(fullText)
        .then(() => setShareStatus('📋 Full itinerary copied to clipboard!'))
        .catch(() => {
          const ok = copyViaTextarea(fullText);
          setShareStatus(ok ? '📋 Itinerary copied to clipboard!' : '❌ Copy failed — please copy manually');
        });
    } else {
      const ok = copyViaTextarea(fullText);
      setShareStatus(ok ? '📋 Itinerary copied to clipboard!' : '❌ Copy failed — please copy manually');
    }

    setTimeout(() => setShareStatus(''), 4000);
  };

  const itineraryPanel = (
    <div className="space-y-6">
      <div className="mb-6 grid gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Route className="h-4 w-4 text-blue-400" /> Days
          </div>
          <p className="mt-2 text-xl font-semibold text-white">{totalDays}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MapPin className="h-4 w-4 text-emerald-400" /> Stops
          </div>
          <p className="mt-2 text-xl font-semibold text-white">{totalStops}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Compass className="h-4 w-4 text-purple-400" /> Travel
          </div>
          <p className="mt-2 text-xl font-semibold text-white">{result.total_travel_time}</p>
        </div>
      </div>

      {result.warnings?.length > 0 && (
        <div className="mb-6 space-y-2">
          {result.warnings.map((warn, i) => (
            <div key={i} className="flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>{warn}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {result.itinerary.map((day) => (
          <div key={day.day} className="space-y-6">
            <h2 className="sticky top-0 z-10 bg-slate-900/90 py-2 text-lg font-semibold text-emerald-400 backdrop-blur">
              Day {day.day}
            </h2>
            <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-linear-to-b before:from-blue-500 before:to-emerald-500 md:before:mx-auto md:before:translate-x-0">
              {day.schedule.map((item, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="absolute left-0 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-4 border-slate-900 bg-blue-500 text-sm font-bold text-white shadow md:left-1/2">
                    {i + 1}
                  </div>

                  <div className="ml-auto w-[calc(100%-3rem)] rounded-xl border border-white/5 bg-slate-800/80 p-4 shadow-lg transition hover:bg-slate-700/80 md:w-[calc(50%-2rem)] md:ml-0 md:group-even:mr-auto md:group-odd:ml-auto">
                    <div className="relative z-10">
                      <h3 className="font-semibold text-white">{item.location}</h3>
                      <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="h-4 w-4" />
                        {item.arrival_time} - {item.departure_time}
                      </div>
                      <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${item.status === 'skipped' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {item.status === 'skipped' ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
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
  );

  return (
    <div className="flex h-screen min-h-screen flex-col bg-slate-900">
      <header className="z-10 flex shrink-0 items-center justify-between border-b border-white/5 bg-slate-800/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/plan')} className="rounded-full p-2 text-slate-300 transition hover:bg-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white">Your optimized itinerary</h1>
            <p className="text-sm text-slate-400">
              {form.city} • {result.total_travel_time} • {result.total_distance}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {result.warnings?.length > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              {result.warnings.length} warning{result.warnings.length > 1 ? 's' : ''}
            </div>
          )}
          <button
            type="button"
            onClick={shareTrip}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:border-blue-300 hover:bg-blue-500/15"
          >
            <Route className="h-4 w-4 text-blue-300" />
            Share trip
          </button>
        </div>
      </header>

      {shareStatus && (
        <div className="bg-slate-800/80 border border-white/10 text-sm text-slate-200 mx-6 my-4 rounded-full py-3 px-4 shadow-lg backdrop-blur md:mx-10">
          {shareStatus}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden w-full overflow-y-auto border-r border-white/5 bg-slate-800/30 p-6 md:block md:w-1/3 lg:w-96">
          {itineraryPanel}
        </div>

        <div className="relative flex-1 bg-slate-900">
          <Map itinerary={result.itinerary} selectedLocations={form.selectedLocations} />

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/85 px-4 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur md:hidden"
          >
            <PanelRightOpen className="h-4 w-4" />
            Itinerary
          </button>
        </div>
      </div>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 md:hidden" onClick={() => setIsDrawerOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 max-h-[82vh] overflow-y-auto rounded-t-[1.75rem] border border-white/10 bg-slate-900 p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-800/70 px-3 py-3 backdrop-blur">
              <h2 className="text-lg font-semibold text-white">Trip itinerary</h2>
              <button type="button" onClick={() => setIsDrawerOpen(false)} className="rounded-full p-2 text-slate-300 transition hover:bg-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            {itineraryPanel}
          </div>
        </div>
      )}
    </div>
  );
}
