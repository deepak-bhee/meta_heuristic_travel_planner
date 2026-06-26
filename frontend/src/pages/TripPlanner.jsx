import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { api } from '../services/api';
import { MapPin, Calendar, Settings, ChevronRight, Loader2, Search, Sparkles } from 'lucide-react';
import Map from '../components/Map';

const libraries = ['places'];

export default function TripPlanner() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState({ cities: true, locations: false, submit: false });
  const [error, setError] = useState(null);

  const [autocomplete, setAutocomplete] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

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
          setForm((f) => ({ ...f, city: data[0] }));
        }
      } catch (err) {
        setError('Failed to load cities');
      } finally {
        setLoading((l) => ({ ...l, cities: false }));
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!form.city) {
        setLocations([]);
        return;
      }
      setLoading((l) => ({ ...l, locations: true }));
      try {
        let backendLocations = [];
        try {
          backendLocations = await api.getLocations(form.city);
        } catch (e) {
          // Ignore backend errors, we can fallback entirely to Google
        }

        if (isLoaded) {
          const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
          placesService.textSearch(
            { query: `top tourist attractions in ${form.city}` },
            (results, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                const googleLocs = results.slice(0, 16).map((place) => ({
                  name: place.name,
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                  rating: place.rating || 4.0,
                  open_time: '08:00',
                  close_time: '20:00',
                  visit_duration: 60,
                  mandatory: false
                }));

                const allLocs = [...backendLocations];
                googleLocs.forEach((gLoc) => {
                  if (!allLocs.some((l) => l.name === gLoc.name)) {
                    allLocs.push(gLoc);
                  }
                });
                setLocations(allLocs);
              } else {
                setLocations(backendLocations);
              }
              setLoading((l) => ({ ...l, locations: false }));
            }
          );
        } else {
          setLocations(backendLocations);
          setLoading((l) => ({ ...l, locations: false }));
        }
      } catch (err) {
        setLocations([]);
        setLoading((l) => ({ ...l, locations: false }));
      }
    };
    fetchLocations();
  }, [form.city, isLoaded]);

  const handleLocationToggle = (locObj) => {
    setForm((f) => {
      const isSelected = f.selectedLocations.some((l) => l.name === locObj.name);
      if (isSelected) {
        return { ...f, selectedLocations: f.selectedLocations.filter((n) => n.name !== locObj.name) };
      }
      return { ...f, selectedLocations: [...f.selectedLocations, locObj] };
    });
  };

  const handlePlaceSelect = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      const newLoc = {
        name: place.name,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        rating: place.rating || 4.0,
        open_time: '08:00',
        close_time: '20:00',
        visit_duration: 60,
        mandatory: false
      };

      setForm((f) => {
        const isSelected = f.selectedLocations.some((l) => l.name === newLoc.name);
        if (isSelected) return f;
        return { ...f, selectedLocations: [...f.selectedLocations, newLoc] };
      });
    }
  };

  const handleAutoPlan = async () => {
    if (locations.length === 0) return;

    const placesNeeded = parseInt(form.days) * 4;
    const sortedLocs = [...locations].sort((a, b) => b.rating - a.rating);
    const selected = sortedLocs.slice(0, placesNeeded);

    setForm((f) => ({ ...f, selectedLocations: selected }));

    setLoading((l) => ({ ...l, submit: true }));
    setError(null);
    try {
      const response = await api.predictItinerary({
        city: form.city,
        days: parseInt(form.days),
        preference: form.preference,
        locations: selected
      });
      navigate('/results', { state: { result: response, form: { ...form, selectedLocations: selected } } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to auto-generate itinerary');
      setLoading((l) => ({ ...l, submit: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.selectedLocations.length === 0) {
      setError('Please select at least one location');
      return;
    }

    setLoading((l) => ({ ...l, submit: true }));
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
      setLoading((l) => ({ ...l, submit: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 px-6 pb-12 pt-20 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          <div className="rounded-[1.75rem] border border-white/10 bg-linear-to-r from-blue-500/15 via-slate-800/70 to-emerald-500/10 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-300">
                  <Sparkles className="h-4 w-4" /> Smart trip builder
                </div>
                <h1 className="text-3xl font-semibold text-white">Plan your trip in a few elegant steps</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                  Choose a city, pick a few favorite stops, and let the planner turn it into an optimized route with a polished visual map.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-right">
                <p className="text-sm text-slate-400">Ready for</p>
                <p className="text-xl font-semibold text-white">{form.days} day{form.days > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6 rounded-[1.75rem] border border-white/10 bg-slate-800/50 p-6">
              <div className="mb-6 flex items-center gap-2 border-b border-white/5 pb-4 text-xl font-semibold text-white">
                <Settings className="text-blue-400" />
                <h2>Trip parameters</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <MapPin className="h-4 w-4" /> City
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    disabled={loading.cities}
                  >
                    {loading.cities ? <option>Loading...</option> : cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Calendar className="h-4 w-4" /> Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.days}
                    onChange={(e) => setForm({ ...form, days: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Settings className="h-4 w-4" /> Preference
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.preference}
                    onChange={(e) => setForm({ ...form, preference: e.target.value })}
                  >
                    <option value="time">Time optimized</option>
                    <option value="distance">Distance optimized</option>
                    <option value="scenic">Scenic / rating</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6 rounded-[1.75rem] border border-white/10 bg-slate-800/50 p-6">
              <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2 text-xl font-semibold text-white">
                  <MapPin className="text-emerald-400" />
                  <h2>Select locations</h2>
                </div>
                <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">
                  {form.selectedLocations.length} selected
                </span>
              </div>

              {isLoaded && (
                <div className="mb-6 relative">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Search className="h-4 w-4" /> Search for any place
                  </label>
                  <Autocomplete onLoad={setAutocomplete} onPlaceChanged={handlePlaceSelect}>
                    <input
                      type="text"
                      placeholder="Search Google Maps to add a stop"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                      }}
                    />
                  </Autocomplete>
                </div>
              )}

              {form.selectedLocations.filter((loc) => !locations.some((l) => l.name === loc.name)).length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-medium text-emerald-400">Custom selected places:</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {form.selectedLocations
                      .filter((loc) => !locations.some((l) => l.name === loc.name))
                      .map((loc, idx) => (
                        <div key={`custom-${idx}`} className="relative rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 shadow-[0_0_15px_rgba(37,99,235,0.15)]">
                          <button type="button" className="absolute right-2 top-2 text-slate-400 hover:text-white" onClick={() => handleLocationToggle(loc)}>
                            ✕
                          </button>
                          <h3 className="pr-6 font-medium text-white">{loc.name}</h3>
                          <span className="mt-2 inline-flex w-max rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-400">
                            ★ {loc.rating}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {loading.locations ? (
                <div className="flex justify-center py-12 text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <>
                  <h3 className="mb-3 text-sm font-medium text-slate-300">Recommended for {form.city}:</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {locations.map((loc) => (
                      <div
                        key={loc.name}
                        onClick={() => handleLocationToggle(loc)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${form.selectedLocations.some((l) => l.name === loc.name)
                          ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(37,99,235,0.15)]'
                          : 'border-slate-700 bg-slate-900 hover:border-slate-500'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-medium text-white">{loc.name}</h3>
                          <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-400">
                            ★ {loc.rating}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400">
                          <span>{loc.open_time} - {loc.close_time}</span>
                          <span>{loc.visit_duration} mins</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={handleAutoPlan}
                disabled={loading.submit || locations.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-purple-600 to-purple-500 px-4 py-4 text-lg font-semibold text-white shadow-lg transition hover:from-purple-500 hover:to-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading.submit ? <Loader2 className="h-5 w-5 animate-spin" /> : '✨ Auto-plan my trip'}
              </button>
              <button
                type="submit"
                disabled={loading.submit || form.selectedLocations.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-500 px-4 py-4 text-lg font-semibold text-white shadow-lg transition hover:from-blue-500 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading.submit ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating itinerary...</>
                ) : (
                  <>Generate optimized itinerary <ChevronRight className="h-5 w-5" /></>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-hidden rounded-[1.75rem] border border-white/10 shadow-2xl">
            <Map
              selectedLocations={form.selectedLocations}
              cityCenter={locations.length > 0 ? { lat: locations[0].lat, lng: locations[0].lng } : null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
