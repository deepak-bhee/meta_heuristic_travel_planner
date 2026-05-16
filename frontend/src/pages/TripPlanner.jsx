import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { MapPin, Calendar, Settings, ChevronRight, Loader2 } from 'lucide-react';

export default function TripPlanner() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState({ cities: true, locations: false, submit: false });
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    city: '',
    days: 1,
    preference: 'time',
    selectedLocations: []
  });

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const data = await api.getCities();
        setCities(data);
        if (data.length > 0) {
          setForm(f => ({ ...f, city: data[0] }));
        }
      } catch (err) {
        setError('Failed to load cities');
      } finally {
        setLoading(l => ({ ...l, cities: false }));
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    if (!form.city) return;
    const fetchLocations = async () => {
      setLoading(l => ({ ...l, locations: true }));
      try {
        const data = await api.getLocations(form.city);
        setLocations(data);
        setForm(f => ({ ...f, selectedLocations: [] }));
      } catch (err) {
        setError(`Failed to load locations for ${form.city}`);
      } finally {
        setLoading(l => ({ ...l, locations: false }));
      }
    };
    fetchLocations();
  }, [form.city]);

  const handleLocationToggle = (locName) => {
    setForm(f => {
      const isSelected = f.selectedLocations.includes(locName);
      if (isSelected) {
        return { ...f, selectedLocations: f.selectedLocations.filter(n => n !== locName) };
      } else {
        return { ...f, selectedLocations: [...f.selectedLocations, locName] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.selectedLocations.length === 0) {
      setError('Please select at least one location');
      return;
    }

    setLoading(l => ({ ...l, submit: true }));
    setError(null);
    try {
      const response = await api.predictItinerary({
        city: form.city,
        days: parseInt(form.days),
        preference: form.preference,
        locations: form.selectedLocations
      });
      navigate('/results', { state: { result: response, form } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate itinerary');
      setLoading(l => ({ ...l, submit: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pt-20 px-6 pb-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Plan Your Trip</h1>
          <p className="text-slate-400">Configure your preferences to get an AI-optimized itinerary.</p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Settings Card */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 space-y-6">
            <div className="flex items-center gap-2 text-xl font-semibold mb-6 pb-4 border-b border-white/5">
              <Settings className="text-blue-400" />
              <h2>Trip Parameters</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> City
                </label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.city}
                  onChange={e => setForm({...form, city: e.target.value})}
                  disabled={loading.cities}
                >
                  {loading.cities ? <option>Loading...</option> : cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Days
                </label>
                <input 
                  type="number" 
                  min="1" max="14"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.days}
                  onChange={e => setForm({...form, days: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Preference
                </label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.preference}
                  onChange={e => setForm({...form, preference: e.target.value})}
                >
                  <option value="time">Time Optimized</option>
                  <option value="distance">Distance Optimized</option>
                  <option value="scenic">Scenic / Rating</option>
                </select>
              </div>
            </div>
          </div>

          {/* Locations Card */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 space-y-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2 text-xl font-semibold">
                <MapPin className="text-emerald-400" />
                <h2>Select Locations</h2>
              </div>
              <span className="text-sm bg-slate-700 px-3 py-1 rounded-full text-slate-300">
                {form.selectedLocations.length} selected
              </span>
            </div>

            {loading.locations ? (
              <div className="flex justify-center py-12 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {locations.map(loc => (
                  <div 
                    key={loc.name}
                    onClick={() => handleLocationToggle(loc.name)}
                    className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 flex flex-col gap-2
                      ${form.selectedLocations.includes(loc.name) 
                        ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.15)]' 
                        : 'bg-slate-900 border-slate-700 hover:border-slate-500'}
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-white">{loc.name}</h3>
                      <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                        ★ {loc.rating}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 flex gap-4">
                      <span>{loc.open_time} - {loc.close_time}</span>
                      <span>{loc.visit_duration} mins</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading.submit || form.selectedLocations.length === 0}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold text-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.submit ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating Itinerary...</>
            ) : (
              <>Generate Optimized Itinerary <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
