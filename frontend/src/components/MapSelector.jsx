import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapSelector.css';

// Fix default marker icons in Leaflet + Vite
// (Leaflet's default marker images don't load properly with bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons for origin (green) and destination (red)
const createIcon = (color) =>
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
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });

const originIcon = createIcon('#10b981');
const destIcon = createIcon('#ef4444');

/**
 * Internal component that listens for map click events.
 * First click sets origin, second sets destination.
 */
function MapClickHandler({ origin, destination, onSetOrigin, onSetDestination }) {
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
        // Fallback to coordinates if reverse geocoding fails
      }

      const location = { lat, lng, name };

      if (!origin) {
        onSetOrigin(location);
      } else if (!destination) {
        onSetDestination(location);
      } else {
        // Reset: start a new selection
        onSetOrigin(location);
        onSetDestination(null);
      }
    },
  });

  return null;
}

/**
 * Interactive world map for selecting origin and destination.
 * Users click on the map to place markers.
 *
 * @param {object|null} origin - Origin location { lat, lng, name }
 * @param {object|null} destination - Destination location { lat, lng, name }
 * @param {function} onSetOrigin - Callback when origin is set
 * @param {function} onSetDestination - Callback when destination is set
 */
function MapSelector({ origin, destination, onSetOrigin, onSetDestination }) {
  const [distance, setDistance] = useState(null);

  // Calculate distance when both markers are placed
  useEffect(() => {
    if (origin && destination) {
      const from = L.latLng(origin.lat, origin.lng);
      const to = L.latLng(destination.lat, destination.lng);
      const dist = from.distanceTo(to) / 1000; // Convert to km
      setDistance(dist.toFixed(0));
    } else {
      setDistance(null);
    }
  }, [origin, destination]);

  // Line between origin and destination
  const polylinePositions =
    origin && destination
      ? [
          [origin.lat, origin.lng],
          [destination.lat, destination.lng],
        ]
      : [];

  return (
    <div className="map-selector" id="map-selector">
      {/* Instruction bar */}
      <div className="map-instructions glass">
        {!origin && <p>📍 Click on the map to set your <strong>origin</strong></p>}
        {origin && !destination && (
          <p>📍 Click on the map to set your <strong>destination</strong></p>
        )}
        {origin && destination && (
          <p>
            ✅ Route set! <strong>{origin.name}</strong> → <strong>{destination.name}</strong>
            {distance && <span className="distance-badge">{Number(distance).toLocaleString()} km</span>}
          </p>
        )}
      </div>

      {/* Location indicators */}
      <div className="map-locations">
        <div className={`location-pill ${origin ? 'active' : ''}`}>
          <span className="location-dot origin-dot"></span>
          <span>{origin ? origin.name : 'Origin'}</span>
        </div>
        <span className="location-arrow">→</span>
        <div className={`location-pill ${destination ? 'active' : ''}`}>
          <span className="location-dot dest-dot"></span>
          <span>{destination ? destination.name : 'Destination'}</span>
        </div>
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
          origin={origin}
          destination={destination}
          onSetOrigin={onSetOrigin}
          onSetDestination={onSetDestination}
        />

        {origin && (
          <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
            <Popup>
              <strong>Origin:</strong> {origin.name}
            </Popup>
          </Marker>
        )}

        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
            <Popup>
              <strong>Destination:</strong> {destination.name}
            </Popup>
          </Marker>
        )}

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
