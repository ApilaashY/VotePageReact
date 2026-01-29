import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapSection.css';
import { Link } from 'react-router-dom';
import * as turf from '@turf/turf';

// Fix for default marker icon issues in React-Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom || map.getZoom());
    }, [center, zoom, map]);
    return null;
}

function MapBoundsHandler({ geoJsonData }) {
    const map = useMap();
    useEffect(() => {
        if (geoJsonData) {
            const bounds = L.geoJSON(geoJsonData).getBounds();
            map.fitBounds(bounds, { padding: [5, 5] });
        }
    }, [geoJsonData, map]);
    return null;
}

const MapSection = () => {
    const [inputValue, setInputValue] = useState('');
    const [address, setAddress] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [position, setPosition] = useState([43.4516, -80.4925]); // Default Kitchener position
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [selectedWard, setSelectedWard] = useState(null);
    const [zoom, setZoom] = useState(13);
    const markerRef = useRef(null);

    // Auto-open popup when position or ward changes
    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.openPopup();
        }
    }, [position, selectedWard]);

    // Fetch GeoJSON data
    useEffect(() => {
        fetch('/WardBoundaries.geojson')
            .then(res => res.json())
            .then(data => setGeoJsonData(data))
            .catch(err => console.error('Error loading GeoJSON:', err));
    }, []);

    // Debounce effect for fetching suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (inputValue.length < 3) {
                setSuggestions([]);
                return;
            }

            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputValue)}&addressdetails=1&limit=5&viewbox=-80.85,43.65,-80.25,43.25&bounded=1`
                );
                const data = await response.json();
                setSuggestions(data);
            } catch (err) {
                console.error('Failed to fetch suggestions', err);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [inputValue]);

    const handleSelectSuggestion = (suggestion) => {
        const { lat, lon, display_name } = suggestion;
        const newPos = [parseFloat(lat), parseFloat(lon)];
        setPosition(newPos);
        setAddress(display_name);
        setInputValue(display_name);
        setSuggestions([]);
        setZoom(16);

        // Find which ward this location is in
        if (geoJsonData) {
            const point = turf.point([parseFloat(lon), parseFloat(lat)]);
            let foundWard = null;

            for (const feature of geoJsonData.features) {
                if (turf.booleanPointInPolygon(point, feature)) {
                    foundWard = feature.properties?.Name;
                    break;
                }
            }
            setSelectedWard(foundWard);
        }
    };

    const getRegionColor = (feature) => {
        const name = feature.properties?.Name || "";
        if (name.includes("Kitchener")) return "hsl(210, 70%, 50%)"; // Blue
        if (name.includes("Waterloo")) return "hsl(340, 70%, 50%)";  // Pink/Red
        if (name.includes("Cambridge")) return "hsl(150, 70%, 40%)"; // Green
        if (name.includes("Wellesley")) return "hsl(30, 80%, 50%)";  // Orange
        if (name.includes("Wilmot")) return "hsl(270, 60%, 50%)";   // Purple
        if (name.includes("Woolwich")) return "hsl(190, 80%, 45%)"; // Teal
        if (name.includes("North")) return "hsl(60, 70%, 40%)";    // Olive
        return "#007bff"; // Default
    };

    return (
        <>
            <h2>Find Your Polling Station</h2>
                <div className="autocomplete-wrapper">
                    <input
                        type="text"
                        placeholder="Enter your address..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    {suggestions.length > 0 && (
                        <ul className="suggestions-list">
                            {suggestions.map((suggestion, index) => (
                                <li 
                                    key={index} 
                                    onClick={() => handleSelectSuggestion(suggestion)}
                                >
                                    {suggestion.display_name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

            <MapContainer center={position} zoom={zoom} scrollWheelZoom={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ChangeView center={position} zoom={zoom} />
                <MapBoundsHandler geoJsonData={geoJsonData} />
                {geoJsonData && (
                    <GeoJSON 
                        data={geoJsonData} 
                        style={(feature) => {
                            const color = getRegionColor(feature);
                            return {
                                color: color,
                                weight: 2,
                                fillColor: color,
                                fillOpacity: 0.2
                            };
                        }}
                        onEachFeature={(feature, layer) => {
                            layer.on({
                                click: (e) => {
                                    const { lat, lng } = e.latlng;
                                    setPosition([lat, lng]);
                                    const wardName = feature.properties?.Name;
                                    setSelectedWard(wardName);
                                    setAddress("Selected Region");
                                    setZoom(14); // Optional: zoom in a bit when clicking a region
                                    L.DomEvent.stopPropagation(e); // Prevent map click from closing popup immediately if that's an issue
                                }
                            });
                        }}
                    />
                )}
                <Marker 
                    position={position}
                    ref={markerRef}
                >
                    <Popup>
                        <div className="location-popup">
                            <strong>{address || 'Searched Location'}</strong>
                            {selectedWard && (
                                <Link to={`/region/${selectedWard.split(" ").join("-")}`}>
                                    <div className="ward-info">
                                        <p>City: <span>{selectedWard.split(' Ward')[0]}</span></p>
                                        <p>Ward: <span>{selectedWard.includes('Ward') ? selectedWard.split('Ward ')[1] : 'N/A'}</span></p>
                                    </div>
                                </Link>
                            )}
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>
        </>
    );
};

export default MapSection;
