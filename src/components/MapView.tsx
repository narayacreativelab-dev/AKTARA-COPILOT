import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Maximize2, 
  MapPin, 
  Compass, 
  Layers, 
  Users, 
  BookOpen, 
  Sparkles, 
  Building2, 
  ExternalLink,
  Navigation,
  CheckCircle,
  Eye
} from 'lucide-react';
import { School } from '../types';

interface MapViewProps {
  schools: School[];
  selectedSchool: School | null;
  onSelectSchool: (school: School) => void;
  onOpenPitch: (school: School) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  schools,
  selectedSchool,
  onSelectSchool,
  onOpenPitch
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [activeFilterStatus, setActiveFilterStatus] = useState<'ALL' | 'Negeri' | 'Swasta'>('ALL');
  const [showRadius, setShowRadius] = useState(false);
  const circleRadiusRef = useRef<L.Circle | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create map centered on Garut / West Java
      const map = L.map(mapContainerRef.current, {
        center: [-7.2178, 107.8992],
        zoom: 12,
        zoomControl: false,
        attributionControl: false
      });

      // Add CartoDB Positron clean white tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Add Zoom Control on top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Create Layer Group for markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when schools or active filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const filtered = schools.filter(s => {
      if (activeFilterStatus === 'ALL') return true;
      return s.status === activeFilterStatus;
    });

    if (filtered.length === 0) return;

    const bounds = L.latLngBounds([]);

    filtered.forEach(school => {
      const isNegeri = school.status === 'Negeri';
      const color = isNegeri ? '#16A34A' : '#D4AF37'; // Emerald Green vs Classic Gold
      const secondaryColor = isNegeri ? '#DCFCE7' : '#FAF3DA';
      const textColor = isNegeri ? '#15803D' : '#947518';
      const isSelected = selectedSchool?.id === school.id;

      // Custom Leaflet DivIcon
      const iconHtml = `
        <div style="
          width: ${isSelected ? '36px' : '30px'};
          height: ${isSelected ? '36px' : '30px'};
          border-radius: 50%;
          background: ${color};
          border: ${isSelected ? '3px solid #0D5C75' : '2px solid white'};
          box-shadow: ${isSelected ? '0 0 0 3px rgba(212,175,55,0.4), 0 4px 10px rgba(0,0,0,0.3)' : '0 3px 8px rgba(0,0,0,0.2)'};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: ${isSelected ? '12px' : '10px'};
          cursor: pointer;
          transition: transform 0.2s;
        " class="hover:scale-110">
          ${school.type === 'SMK' ? 'K' : 'A'}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'aktara-map-marker',
        iconSize: [isSelected ? 36 : 30, isSelected ? 36 : 30],
        iconAnchor: [isSelected ? 18 : 15, isSelected ? 18 : 15],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([school.latitude, school.longitude], { icon: customIcon });

      // Popup Content Looker Studio BI Style
      const popupContent = document.createElement('div');
      popupContent.className = 'p-3.5 text-slate-800 font-sans max-w-xs';
      popupContent.innerHTML = `
        <div class="border-b border-slate-100 pb-2 mb-2">
          <div class="flex items-center gap-1.5 mb-1.5">
            <span style="background-color: ${secondaryColor}; color: ${textColor};" class="px-2 py-0.5 rounded text-[10px] font-bold">
              ${school.type} ${school.status}
            </span>
            <span class="text-[10px] font-semibold text-slate-500">NPSN: ${school.npsn}</span>
            <span class="ml-auto text-[10px] font-extrabold text-[#B38E22] bg-[#FAF3DA] border border-[#F2E3B1] px-1.5 py-0.5 rounded">
              Fit: ${school.aktaraCompatibility.fitScore}%
            </span>
          </div>
          <h4 class="font-bold text-sm text-slate-900 leading-tight">${school.name}</h4>
          <p class="text-[11px] text-slate-500 mt-0.5">${school.subDistrict}, ${school.cityDistrict}</p>
        </div>

        <div class="space-y-1.5 text-xs mb-3">
          <div class="flex justify-between items-center text-slate-600">
            <span>Total Siswa:</span>
            <span class="font-bold text-slate-900">${school.totalStudents.toLocaleString('id-ID')} Siswa</span>
          </div>
          <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
            <div style="width: ${(school.maleStudents / school.totalStudents) * 100}%" class="bg-[#0D5C75] h-full" title="Putra"></div>
            <div style="width: ${(school.femaleStudents / school.totalStudents) * 100}%" class="bg-[#D4AF37] h-full" title="Putri"></div>
          </div>
          <div class="flex justify-between text-[10px] text-slate-400">
            <span>👦 Putra: ${school.maleStudents}</span>
            <span>👧 Putri: ${school.femaleStudents}</span>
          </div>
          <div class="text-[11px] text-slate-600 line-clamp-1 mt-1">
            <span class="font-medium text-slate-700">Jurusan:</span> ${school.majors?.map(m => m.name).slice(0, 2).join(', ')}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
          <button id="btn-dossier-${school.id}" class="w-full py-1.5 px-2 bg-[#0D5C75] hover:bg-[#07394A] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs">
            Lihat Dossier
          </button>
          <button id="btn-pitch-${school.id}" class="w-full py-1.5 px-2 bg-[#FAF3DA] hover:bg-[#F5EACB] text-[#947518] border border-[#F2E3B1] rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer">
            AI Pitch
          </button>
        </div>
      `;

      // Attach button event listeners
      popupContent.querySelector(`#btn-dossier-${school.id}`)?.addEventListener('click', () => {
        onSelectSchool(school);
      });
      popupContent.querySelector(`#btn-pitch-${school.id}`)?.addEventListener('click', () => {
        onOpenPitch(school);
      });

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        onSelectSchool(school);
      });

      markersLayer.addLayer(marker);
      bounds.extend([school.latitude, school.longitude]);
    });

    // Auto-fit bounds if schools exist
    if (filtered.length > 0 && !selectedSchool) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [schools, activeFilterStatus, selectedSchool]);

  // Center on selected school if clicked externally
  useEffect(() => {
    if (selectedSchool && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedSchool.latitude, selectedSchool.longitude], 15, {
        duration: 1.2
      });
    }
  }, [selectedSchool]);

  // Handle Hub centering presets
  const focusHub = (lat: number, lng: number, zoom = 13) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1 });
    }
  };

  // Toggle radius circle from Garut Hub
  const toggleRadius = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (showRadius && circleRadiusRef.current) {
      map.removeLayer(circleRadiusRef.current);
      circleRadiusRef.current = null;
      setShowRadius(false);
    } else {
      // 6KM radius from AKTARA Garut Center (-7.2178, 107.8992)
      const circle = L.circle([-7.2178, 107.8992], {
        color: '#0D5C75',
        fillColor: '#0D5C75',
        fillOpacity: 0.12,
        radius: 6000 // 6km
      }).addTo(map);
      circleRadiusRef.current = circle;
      setShowRadius(true);
    }
  };

  return (
    <div className="relative w-full h-[620px] rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-100">
      
      {/* Map Element Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Header Bar Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 bg-white/95 backdrop-blur-xs p-1.5 rounded-lg border border-slate-200/80 shadow-md">
        
        {/* Status Filter Buttons */}
        <button
          onClick={() => setActiveFilterStatus('ALL')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeFilterStatus === 'ALL'
              ? 'bg-[#0D5C75] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Semua ({schools.length})
        </button>

        <button
          onClick={() => setActiveFilterStatus('Negeri')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeFilterStatus === 'Negeri'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Negeri ({schools.filter(s => s.status === 'Negeri').length})</span>
        </button>

        <button
          onClick={() => setActiveFilterStatus('Swasta')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeFilterStatus === 'Swasta'
              ? 'bg-[#D4AF37] text-slate-900 font-bold'
              : 'text-slate-600 hover:bg-[#FAF3DA] hover:text-[#947518]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
          <span>Swasta ({schools.filter(s => s.status === 'Swasta').length})</span>
        </button>

      </div>

      {/* Floating Hub Shortcut Presets */}
      <div className="absolute bottom-4 left-3 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs p-1.5 rounded-lg border border-slate-200 shadow-md text-xs font-medium">
        <span className="text-slate-400 px-1 font-semibold flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-[#0D5C75]" /> Focus:
        </span>
        
        <button
          onClick={() => focusHub(-7.2178, 107.8992, 13)}
          className="px-2 py-1 hover:bg-[#EBF4F7] text-slate-700 hover:text-[#0D5C75] rounded transition-colors cursor-pointer"
        >
          📍 Garut Central
        </button>

        <button
          onClick={() => focusHub(-6.9200, 107.6150, 13)}
          className="px-2 py-1 hover:bg-[#EBF4F7] text-slate-700 hover:text-[#0D5C75] rounded transition-colors cursor-pointer"
        >
          📍 Bandung Raya
        </button>

        <button
          onClick={() => focusHub(-7.3300, 108.2200, 13)}
          className="px-2 py-1 hover:bg-[#EBF4F7] text-slate-700 hover:text-[#0D5C75] rounded transition-colors cursor-pointer"
        >
          📍 Tasikmalaya
        </button>

        <button
          onClick={toggleRadius}
          className={`px-2 py-1 rounded transition-colors cursor-pointer ${
            showRadius ? 'bg-[#0D5C75] text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          ⭕ Radius 6KM
        </button>
      </div>

      {/* Floating Legend */}
      <div className="absolute bottom-4 right-3 z-10 bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-slate-200 shadow-md text-xs space-y-1.5">
        <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
          <Layers className="w-3 h-3 text-[#0D5C75]" /> Legend
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white shadow-xs"></div>
          <span className="text-slate-700 font-medium">SMK / SMA Negeri</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-[#D4AF37] border border-white shadow-xs"></div>
          <span className="text-slate-700 font-medium">SMK / SMA Swasta</span>
        </div>
        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
          Klik pin untuk membuka intelligence dossier
        </div>
      </div>

    </div>
  );
};
