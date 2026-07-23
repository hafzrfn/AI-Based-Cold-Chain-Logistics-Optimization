import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapSelector.css';

// Fix default marker icons in Leaflet + Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons for origin (green), intermediate (orange), and destination (red)
const createIcon = (color, text = '') =>
  new L.DivIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      background: ${color};
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
    "><span style="transform: rotate(45deg);">${text}</span></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });

const originIcon = createIcon('#10b981', 'O');
const waypointIcon = (index) => createIcon('#f59e0b', String(index));
const destIcon = createIcon('#ef4444', 'D');

/**
 * Internal component that listens for map click events.
 */
function MapClickHandler({ waypoints, onSetWaypoints }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;

      // Reverse geocode to get location name
      let name = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=6&addressdetails=1`
        );
        const data = await response.json();
        if (data.address) {
          name =
            data.address.city ||
            data.address.town ||
            data.address.state ||
            data.address.country ||
            name;
        }
      } catch {
        // Fallback to coordinates
      }

      const location = { lat, lng, name };
      onSetWaypoints((prev) => [...prev, location]);
    },
  });

  return null;
}

/**
 * Interactive world map for selecting multiple waypoints (Milk Run).
 */
function MapSelector({ waypoints, onSetWaypoints, onSetDistance }) {
  const [distance, setDistance] = useState(null);
  const [polylinePositions, setPolylinePositions] = useState([]);
  const [optimizedOrder, setOptimizedOrder] = useState([]);

  // Calculate driving distance and optimized trip route when there are 2 or more waypoints
  useEffect(() => {
    let active = true;
    
    if (waypoints.length >= 2) {
      // Build coordinates string: lng,lat;lng,lat...
      const coordsString = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
      
      const isTrip = waypoints.length > 2;
      const url = isTrip
        ? `https://router.project-osrm.org/trip/v1/driving/${coordsString}?source=first&roundtrip=false&geometries=geojson`
        : `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
      
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (!active) return;
          const routes = isTrip ? data.trips : data.routes;
          if (routes && routes.length > 0) {
            const trip = routes[0];
            const distKm = trip.distance / 1000;
            
            setDistance(distKm.toFixed(0));
            if (onSetDistance) onSetDistance(distKm);

            // GeoJSON coordinates are [lng, lat], Leaflet wants [lat, lng]
            const coords = trip.geometry.coordinates.map((c) => [c[1], c[0]]);
            setPolylinePositions(coords);
            
            // Reorder waypoints based on OSRM optimization (only Trip API gives waypoints reordering)
            if (isTrip && data.waypoints) {
              const sortedIndices = data.waypoints
                .map((wp, i) => ({ ...wp, original_index: i }))
                .sort((a, b) => a.waypoint_index - b.waypoint_index)
                .map(wp => wp.original_index);
              setOptimizedOrder(sortedIndices);
            } else {
              // For 2 points, order is just [0, 1]
              setOptimizedOrder(waypoints.map((_, i) => i));
            }
          }
        })
        .catch((err) => {
          console.error("OSRM Routing Error:", err);
          if (!active) return;
          // Fallback to straight line logic if API fails
          let totalDist = 0;
          for (let i = 0; i < waypoints.length - 1; i++) {
             const from = L.latLng(waypoints[i].lat, waypoints[i].lng);
             const to = L.latLng(waypoints[i+1].lat, waypoints[i+1].lng);
             totalDist += from.distanceTo(to) / 1000;
          }
          
          setDistance(totalDist.toFixed(0));
          if (onSetDistance) onSetDistance(totalDist);
          
          setPolylinePositions(waypoints.map(wp => [wp.lat, wp.lng]));
          setOptimizedOrder(waypoints.map((_, i) => i));
        });
    } else {
      setDistance(null);
      setPolylinePositions([]);
      setOptimizedOrder([]);
      if (onSetDistance) onSetDistance(null);
    }
    
    return () => { active = false; };
  }, [waypoints, onSetDistance]);

  return (
    <div className="map-selector" id="map-selector">
      {/* Instruction bar */}
      <div className="map-instructions glass">
        {waypoints.length === 0 && <p>📍 Click on the map to set your <strong>origin</strong></p>}
        {waypoints.length === 1 && <p>📍 Click on the map to add a <strong>destination</strong></p>}
        {waypoints.length >= 2 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <p style={{ margin: 0 }}>
              ✅ Trip optimized! <strong>{waypoints.length} stops</strong>
              {distance && <span className="distance-badge">{Number(distance).toLocaleString()} km</span>}
            </p>
            <button 
              onClick={() => { setOptimizedOrder([]); setPolylinePositions([]); setDistance(null); onSetWaypoints([]); }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Location indicators */}
      <div className="map-locations" style={{ flexWrap: 'wrap', gap: '8px', padding: '12px' }}>
        {optimizedOrder.length > 0 ? (
          optimizedOrder.map((originalIndex, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div className="location-pill active" style={{ 
                background: i === 0 ? 'rgba(16, 185, 129, 0.2)' : 
                           i === optimizedOrder.length - 1 ? 'rgba(239, 68, 68, 0.2)' : 
                           'rgba(245, 158, 11, 0.2)',
                borderColor: i === 0 ? 'rgba(16, 185, 129, 0.5)' : 
                            i === optimizedOrder.length - 1 ? 'rgba(239, 68, 68, 0.5)' : 
                            'rgba(245, 158, 11, 0.5)',
                margin: 0
              }}>
                <span className="location-dot" style={{ 
                  background: i === 0 ? '#10b981' : 
                             i === optimizedOrder.length - 1 ? '#ef4444' : 
                             '#f59e0b' 
                }}></span>
                <span>{waypoints[originalIndex].name}</span>
              </div>
              {i < optimizedOrder.length - 1 && <span className="location-arrow" style={{ margin: '0 4px' }}>→</span>}
            </div>
          ))
        ) : (
          waypoints.map((wp, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div className="location-pill active" style={{ margin: 0 }}>
                <span className="location-dot origin-dot"></span>
                <span>{wp.name}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="leaflet-map"
        scrollWheelZoom={true}
        minZoom={2}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapClickHandler
          waypoints={waypoints}
          onSetWaypoints={onSetWaypoints}
        />

        {waypoints.map((wp, i) => {
           let icon = waypointIcon(i);
           if (i === 0) icon = originIcon;
           // If we have an optimized order, make the last one the destination icon
           if (optimizedOrder.length > 0 && i === optimizedOrder[optimizedOrder.length - 1]) {
             icon = destIcon;
           } else if (optimizedOrder.length === 0 && i > 0) {
             icon = waypointIcon(i);
           }
           
           return (
             <Marker key={i} position={[wp.lat, wp.lng]} icon={icon}>
               <Popup>
                 <strong>{i === 0 ? 'Origin' : 'Stop ' + i}:</strong> {wp.name}
               </Popup>
             </Marker>
           );
        })}

        {polylinePositions.length > 0 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: '#3b82f6',
              weight: 3,
              dashArray: '10 6',
              opacity: 0.8,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default MapSelector;
