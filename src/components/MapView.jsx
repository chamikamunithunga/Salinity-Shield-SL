import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Kalu Ganga river mouth coordinates (approximate)
const KALU_GANGA_MOUTH = [6.2833, 80.0833]
// Kethhena Water Intake coordinates (approximate)
const KETHHENA_INTAKE = [6.2900, 80.0900]

// Custom marker icon
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

export default function MapView({ currentRisk }) {
  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Danger':
        return '#ef4444' // red
      case 'Caution':
        return '#f59e0b' // yellow
      case 'Safe':
        return '#10b981' // green
      default:
        return '#6b7280' // gray
    }
  }

  const riskColor = getRiskColor(currentRisk)

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={KALU_GANGA_MOUTH}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Kethhena Water Intake Marker */}
        <Marker 
          position={KETHHENA_INTAKE}
          icon={createCustomIcon(riskColor)}
        >
          <Popup>
            <div className="text-center">
              <strong>Kethhena Water Intake</strong>
              <br />
              <span className="text-sm">Risk Level: {currentRisk}</span>
            </div>
          </Popup>
        </Marker>

        {/* Risk zone circle */}
        <Circle
          center={KETHHENA_INTAKE}
          radius={500}
          pathOptions={{
            color: riskColor,
            fillColor: riskColor,
            fillOpacity: 0.2,
            weight: 2,
          }}
        />
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 lg:p-4 z-[1000] border border-gray-200 max-w-[200px] lg:max-w-none">
        <h3 className="font-semibold text-gray-800 mb-2 text-xs lg:text-sm">Risk Level Legend</h3>
        <div className="space-y-1.5 lg:space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-red-500 border-2 border-white flex-shrink-0"></div>
            <span className="text-xs lg:text-sm text-gray-700">Red = Intrusion Likely</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-yellow-500 border-2 border-white flex-shrink-0"></div>
            <span className="text-xs lg:text-sm text-gray-700">Yellow = Caution</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-green-500 border-2 border-white flex-shrink-0"></div>
            <span className="text-xs lg:text-sm text-gray-700">Green = Safe Flow</span>
          </div>
        </div>
      </div>
    </div>
  )
}

