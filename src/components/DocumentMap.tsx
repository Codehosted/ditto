import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Mock locations for required documents
const DOCUMENT_LOCATIONS = [
  {
    id: 1,
    title: "Department of Health",
    document: "Death Certificate",
    position: [40.7128, -74.0060] as [number, number], // Defaulting to NYC, can be dynamic
    address: "125 Worth St, New York, NY 10013",
    status: "Pending"
  },
  {
    id: 2,
    title: "County Clerk's Office",
    document: "Marriage License",
    position: [40.7142, -74.0059] as [number, number],
    address: "60 Centre St, New York, NY 10007",
    status: "Ready for Pickup"
  },
  {
    id: 3,
    title: "Smith & Associates Law Firm",
    document: "Last Will and Testament",
    position: [40.7580, -73.9855] as [number, number],
    address: "1500 Broadway, New York, NY 10036",
    status: "Action Required"
  }
];

export default function DocumentMap() {
  // Center of the map (average of locations or a specific city)
  const center: [number, number] = [40.7300, -73.9900];

  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-stone-200 shadow-sm relative z-0">
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {DOCUMENT_LOCATIONS.map((loc) => (
          <Marker key={loc.id} position={loc.position}>
            <Popup className="font-sans">
              <div className="p-1 space-y-2">
                <h3 className="font-semibold text-stone-900 text-sm">{loc.document}</h3>
                <p className="text-xs text-stone-600">{loc.title}</p>
                <p className="text-xs text-stone-500 font-light">{loc.address}</p>
                <div className="pt-2">
                  <span className={`text-[10px] uppercase tracking-widest font-medium px-2 py-1 rounded-full ${
                    loc.status === 'Ready for Pickup' ? 'bg-emerald-100 text-emerald-700' :
                    loc.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {loc.status}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
