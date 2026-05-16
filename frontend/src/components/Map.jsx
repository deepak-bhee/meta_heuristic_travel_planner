import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { useMemo, useState, useEffect } from 'react';
import { api } from '../services/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

export default function Map({ itinerary, city }) {
  const [locations, setLocations] = useState([]);
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  useEffect(() => {
    const fetchLocs = async () => {
      const allLocs = await api.getLocations(city);
      setLocations(allLocs);
    };
    if (city) fetchLocs();
  }, [city]);

  const mapData = useMemo(() => {
    if (!itinerary || !locations.length) return { markers: [], path: [] };
    
    const markers = [];
    const path = [];
    
    // Flatten all schedules
    const schedules = itinerary.flatMap(day => day.schedule);
    
    schedules.forEach((item, index) => {
      const locData = locations.find(l => l.name === item.location);
      if (locData) {
        const point = { lat: locData.lat, lng: locData.lng };
        markers.push({ ...point, label: (index + 1).toString(), title: item.location });
        path.push(point);
      }
    });

    return { markers, path };
  }, [itinerary, locations]);

  const center = mapData.markers.length > 0 
    ? mapData.markers[0] 
    : { lat: 18.944, lng: 72.823 }; // Fallback Mumbai

  if (!isLoaded) return <div className="w-full h-full bg-slate-800 animate-pulse rounded-xl"></div>;

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-white/10 shadow-2xl">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        options={{
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
          ],
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        {mapData.markers.map((marker, i) => (
          <Marker 
            key={i} 
            position={marker} 
            label={{ text: marker.label, color: 'white', fontWeight: 'bold' }}
            title={marker.title}
          />
        ))}
        {mapData.path.length > 1 && (
          <Polyline
            path={mapData.path}
            options={{
              strokeColor: '#3b82f6',
              strokeOpacity: 0.8,
              strokeWeight: 4,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
