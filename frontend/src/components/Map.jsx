import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useMemo, useState, useEffect } from 'react';
import { Navigation, Route, Layers3, Map as MapIcon } from 'lucide-react';

const libraries = ['places'];

const containerStyle = {
  width: '100%',
  height: '100%'
};

const mapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#172554' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#475569' }]
  }
];

export default function Map({ itinerary, selectedLocations, cityCenter }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  const [mapType, setMapType] = useState('roadmap');
  const [directions, setDirections] = useState(null);

  const mapData = useMemo(() => {
    if (!selectedLocations || !selectedLocations.length) return { markers: [] };

    const markers = [];

    if (itinerary && itinerary.length > 0) {
      const schedules = itinerary.flatMap((day) => day.schedule);

      schedules.forEach((item, index) => {
        const locData = selectedLocations.find((l) => l.name === item.location);
        if (locData) {
          const point = { lat: locData.lat, lng: locData.lng };
          markers.push({ ...point, label: (index + 1).toString(), title: item.location });
        }
      });
    } else {
      selectedLocations.forEach((loc) => {
        markers.push({ lat: loc.lat, lng: loc.lng, title: loc.name });
      });
    }

    return { markers };
  }, [itinerary, selectedLocations]);

  useEffect(() => {
    if (!isLoaded || mapData.markers.length < 2 || !itinerary || itinerary.length === 0) {
      setDirections(null);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    const origin = mapData.markers[0];
    const destination = mapData.markers[mapData.markers.length - 1];
    const waypoints = mapData.markers.slice(1, -1).map((marker) => ({
      location: marker,
      stopover: true
    }));

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error(`Error fetching directions: ${status}`);
        }
      }
    );
  }, [isLoaded, mapData.markers, itinerary]);

  const center = mapData.markers.length > 0
    ? mapData.markers[0]
    : (cityCenter || { lat: 18.944, lng: 72.823 });

  const totalStops = mapData.markers.length;

  if (loadError) {
    return (
      <div className="w-full h-full rounded-3xl border border-white/10 bg-slate-950/80 flex flex-col items-center justify-center text-center px-6 text-slate-300">
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 mb-4">
          <Navigation className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Map unavailable</h3>
        <p className="mt-2 text-sm text-slate-400">Add a Google Maps API key to unlock the live map and satellite view.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full rounded-3xl border border-white/10 bg-slate-950/80 animate-pulse flex items-center justify-center text-slate-400">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-full border-2 border-blue-500/40 border-t-blue-400 animate-spin" />
          <p>Loading map experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
      <div className="absolute left-4 top-4 z-10 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Route className="w-4 h-4 text-emerald-400" />
          {itinerary?.length ? 'Optimized route' : 'Preview mode'}
        </div>
        <p className="mt-1 text-xs text-slate-400">{totalStops} stop{totalStops === 1 ? '' : 's'} ready to explore</p>
      </div>

      <div className="absolute right-4 top-4 z-10 flex gap-2 rounded-2xl border border-white/10 bg-slate-950/80 p-1.5 backdrop-blur">
        <button
          type="button"
          onClick={() => setMapType('roadmap')}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${mapType === 'roadmap' ? 'bg-blue-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <MapIcon className="w-4 h-4" /> Roadmap
        </button>
        <button
          type="button"
          onClick={() => setMapType('satellite')}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${mapType === 'satellite' ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <Layers3 className="w-4 h-4" /> Satellite
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Navigation className="w-4 h-4 text-blue-400" />
          {mapType === 'satellite' ? 'Satellite layer' : 'Street map layer'}
        </div>
        <p className="mt-1 text-xs text-slate-400">Switch views to inspect your stops from above or on the ground.</p>
      </div>

      <div className="absolute bottom-4 right-4 z-10 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <div className="h-2.5 w-2.5 rounded-full bg-sky-400" />
          Optimized route
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          Planned stops
        </div>
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        options={{
          styles: mapStyles,
          mapTypeId: mapType,
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          mapTypeControl: false,
          gestureHandling: 'greedy'
        }}
      >
        {mapData.markers.map((marker, i) => (
          <Marker
            key={`${marker.title}-${i}`}
            position={marker}
            label={marker.label ? { text: marker.label, color: 'white', fontWeight: 'bold' } : undefined}
            title={marker.title}
          />
        ))}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#38bdf8',
                strokeOpacity: 0.9,
                strokeWeight: 4
              }
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
