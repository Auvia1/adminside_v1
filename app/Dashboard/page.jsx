// 'use client';

// import { useCallback, useEffect, useMemo, useState } from 'react';
// import {
//   Bell,
//   Building2,
//   MapPinned,
//   PhoneCall,
//   RotateCw,
//   Search,
//   Settings,
// } from 'lucide-react';
// import { Badge } from '../components/ui/badge';
// import { Button } from '../components/ui/button';
// import { Card } from '../components/ui/card';
// import ErrorMessage from '../components/ErrorMessage';
// import LoadingSpinner from '../components/LoadingSpinner';
// import NewClinicDialog from '../components/NewClinicDialog';
// import { apiGet } from '../lib/api';

// const statusVariantMap = {
//   trial: 'warning',
//   active: 'default',
//   past_due: 'warning',
//   suspended: 'danger',
//   canceled: 'danger',
// };

// function statusToLabel(status) {
//   return 'ACTIVE';
// }

// function getStatusVariant(status) {
//   return 'default';
// }

// function countFromMap(mapObject, key) {
//   return Number(mapObject?.[key] || 0);
// }

// export default function DashboardPage() {
//   const [dashboard, setDashboard] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');

//   const fetchDashboard = useCallback(async () => {
//     try {
//       setIsLoading(true);
//       setError('');

//       const response = await apiGet('/clinics/admin/stats');
//       if (!response?.success) {
//         throw new Error(response?.error || 'Failed to load dashboard');
//       }

//       setDashboard(response.data || {});
//     } catch (err) {
//       setError(err.message || 'Unable to fetch dashboard stats.');
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchDashboard();
//   }, [fetchDashboard]);

//   const totalClinics = Number(dashboard?.totalClinics || 0);
//   const totalPhoneNumbers = Number(dashboard?.totalPhoneNumbers || 0);
//   const statusBreakdown = dashboard?.statusBreakdown || {};
//   const planBreakdown = dashboard?.planBreakdown || {};
//   const activeClinics = totalClinics;
//   const trialClinics = countFromMap(statusBreakdown, 'trial');

//   const stats = [
//     {
//       label: 'Total Clinics',
//       value: totalClinics.toLocaleString(),
//       meta: 'Registered clinics',
//       icon: Building2,
//     },
//     {
//       label: 'Total Phone Numbers',
//       value: totalPhoneNumbers.toLocaleString(),
//       meta: 'Across all clinics',
//       icon: PhoneCall,
//     },
//     {
//       label: 'Active Clinics',
//       value: activeClinics.toLocaleString(),
//       meta: 'All clinics using our product',
//       icon: MapPinned,
//     },
//   ];

//   const recentClinics = useMemo(() => {
//     const clinics = Array.isArray(dashboard?.recentClinics)
//       ? dashboard.recentClinics
//       : [];

//     if (!searchTerm.trim()) {
//       return clinics;
//     }

//     const query = searchTerm.toLowerCase();
//     return clinics.filter((clinic) => {
//       return [clinic.name, clinic.email, clinic.phone, clinic.owner_name]
//         .filter(Boolean)
//         .some((field) => String(field).toLowerCase().includes(query));
//     });
//   }, [dashboard, searchTerm]);

//   const regionTags = Object.keys(planBreakdown).slice(0, 4);

//   return (
//     <div className="px-6 py-6">
//       <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
//           <p className="text-sm text-slate-500">Live clinic and phone-number overview.</p>
//         </div>

//         <div className="ml-auto flex items-center gap-3">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={fetchDashboard}
//             disabled={isLoading}
//             className="h-9"
//           >
//             <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
//             Refresh
//           </Button>
//           <button className="relative rounded-full p-2 text-slate-400 transition hover:scale-105 hover:bg-slate-100 hover:text-(--brand-primary)">
//             <Bell className="h-5 w-5" />
//             <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-(--brand-primary)" />
//           </button>
//           <button className="rounded-full p-2 text-slate-400 transition hover:scale-105 hover:bg-slate-100 hover:text-(--brand-primary)">
//             <Settings className="h-5 w-5" />
//           </button>
//           <div className="hidden h-6 w-px bg-slate-200 md:block" />
//           <NewClinicDialog />
//         </div>
//       </div>

//       {error ? (
//         <ErrorMessage
//           message={error}
//           onDismiss={() => setError('')}
//           className="mb-4"
//         />
//       ) : null}

//       <div className="grid gap-4 md:grid-cols-3">
//         {stats.map((item) => {
//           const Icon = item.icon;
//           return (
//             <Card
//               key={item.label}
//               className="p-4 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
//             >
//               <div className="flex items-center justify-between">
//                 <p className="text-xs font-semibold text-slate-400">{item.label}</p>
//                 <span className="grid h-8 w-8 place-items-center rounded-xl bg-(--brand-primary)/10 text-(--brand-primary)">
//                   <Icon className="h-4 w-4" />
//                 </span>
//               </div>
//               <div className="mt-3 flex flex-col gap-1">
//                 <p className="text-2xl font-semibold text-slate-800">{item.value}</p>
//                 <span className="text-xs text-slate-400">{item.meta}</span>
//               </div>
//             </Card>
//           );
//         })}
//       </div>

//       <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
//         <Card className="relative overflow-hidden p-4">
//           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(235,178,168,0.9),rgba(185,142,153,0.6),rgba(143,115,134,0.6))]" />
//           <div className="relative">
//             <div className="flex items-center justify-between gap-3">
//               <h2 className="text-sm font-semibold text-slate-700">Plan Distribution</h2>
//               <Badge className="bg-white/80 text-slate-600">LIVE</Badge>
//             </div>

//             <div className="mt-4 grid gap-2 sm:grid-cols-2">
//               {Object.entries(planBreakdown).length ? (
//                 Object.entries(planBreakdown).map(([plan, count]) => (
//                   <div
//                     key={plan}
//                     className="rounded-xl bg-white/75 px-3 py-2 text-sm text-slate-700 shadow-sm"
//                   >
//                     <p className="font-semibold">{plan}</p>
//                     <p className="text-xs text-slate-500">{Number(count || 0).toLocaleString()} clinics</p>
//                   </div>
//                 ))
//               ) : (
//                 <div className="rounded-xl bg-white/75 px-3 py-2 text-sm text-slate-600 shadow-sm">
//                   Plan data unavailable
//                 </div>
//               )}
//             </div>

//             <div className="mt-6 flex flex-wrap gap-2">
//               {regionTags.length ? (
//                 regionTags.map((region) => (
//                   <span
//                     key={region}
//                     className="rounded-full bg-white/70 px-4 py-1 text-[11px] font-semibold text-slate-500 shadow"
//                   >
//                     {region.toUpperCase()}
//                   </span>
//                 ))
//               ) : (
//                 <span className="rounded-full bg-white/70 px-4 py-1 text-[11px] font-semibold text-slate-500 shadow">
//                   NO PLAN TAGS
//                 </span>
//               )}
//             </div>
//           </div>
//         </Card>

//         <Card className="p-4">
//           <div className="flex items-center justify-between">
//             <p className="text-xs font-semibold text-slate-500">RECENT CLINICS</p>
//             <Button
//               variant="ghost"
//               size="sm"
//               className="h-8 w-8 p-0 text-slate-400 transition hover:scale-105"
//             >
//               <Settings className="h-4 w-4" />
//             </Button>
//           </div>

//           <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
//             <Search className="h-4 w-4" />
//             <input
//               value={searchTerm}
//               onChange={(event) => setSearchTerm(event.target.value)}
//               placeholder="Search recent clinics"
//               className="w-full bg-transparent text-sm text-slate-600 outline-none"
//             />
//           </div>

//           {isLoading ? (
//             <LoadingSpinner size="sm" text="Loading latest clinics..." />
//           ) : (
//             <div className="mt-4 space-y-3">
//               {recentClinics.length ? (
//                 recentClinics.map((clinic) => {
//                   const status = 'active';
//                   return (
//                     <div
//                       key={clinic.id}
//                       className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
//                     >
//                       <div className="flex items-center gap-3">
//                         <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
//                           <Building2 className="h-4 w-4" />
//                         </span>
//                         <div>
//                           <p className="text-sm font-semibold text-slate-700">{clinic.name}</p>
//                           <p className="text-xs text-slate-400">
//                             {clinic.subscription_plan || 'trial'} • {clinic.phone || 'No phone'}
//                           </p>
//                         </div>
//                       </div>
//                       <Badge variant={getStatusVariant(status)}>
//                         {statusToLabel(status)}
//                       </Badge>
//                     </div>
//                   );
//                 })
//               ) : (
//                 <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
//                   No clinics match your search.
//                 </div>
//               )}
//             </div>
//           )}

//           <div className="mt-5">
//             <Button
//               variant="outline"
//               className="h-10 w-full rounded-xl text-xs font-semibold transition hover:-translate-y-0.5"
//               onClick={fetchDashboard}
//             >
//               REFRESH DASHBOARD DATA
//             </Button>
//           </div>
//         </Card>
//       </div>
//     </div>
//   );
// }


'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Building2,
  MapPin,
  MapPinned,
  PhoneCall,
  RotateCw,
  Search,
  Settings,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import NewClinicDialog from '../components/NewClinicDialog';
import { apiGet } from '../lib/api';

// ─── Config ────────────────────────────────────────────────────────────────
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const MAP_API_BASE = 'http://localhost:4002/api';

// ─── Helpers ───────────────────────────────────────────────────────────────
function statusToLabel() {
  return 'ACTIVE';
}

function getStatusVariant() {
  return 'default';
}

function countFromMap(mapObject, key) {
  return Number(mapObject?.[key] || 0);
}

// ─── Google Maps loader (singleton) ────────────────────────────────────────
let googleMapsPromise = null;

function loadGoogleMaps(apiKey) {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google.maps);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => {
      googleMapsPromise = null;
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

// ─── ClinicMap component ────────────────────────────────────────────────────
function ClinicMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  const [mapState, setMapState] = useState('loading'); // 'loading' | 'ready' | 'error' | 'no-key'
  const [clinicCount, setClinicCount] = useState(0);

  const planColors = {
    Enterprise: '#6366f1',
    Growth: '#10b981',
    Starter: '#f59e0b',
    trial: '#94a3b8',
  };

  const initMap = useCallback(async () => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapState('no-key');
      return;
    }

    try {
      const maps = await loadGoogleMaps(GOOGLE_MAPS_API_KEY);

      // Create map centered on India
      const map = new maps.Map(mapRef.current, {
        center: { lat: 22.5, lng: 80 },
        zoom: 5,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControlOptions: {
          position: maps.ControlPosition.RIGHT_CENTER,
        },
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e4f0' }] },
          { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f5f5f0' }] },
          { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e8d9c8' }] },
        ],
      });

      mapInstanceRef.current = map;
      infoWindowRef.current = new maps.InfoWindow();

      // Fetch clinic coordinates
      const res = await fetch(`${MAP_API_BASE}/clinics/all-with-coordinates`);
      const result = await res.json();

      if (!result.success || !Array.isArray(result.data)) {
        setMapState('ready'); // map is fine, just no data
        return;
      }

      const clinics = result.data;
      setClinicCount(clinics.length);

      // Clear old markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      const bounds = new maps.LatLngBounds();

      clinics.forEach((clinic) => {
        const lat = parseFloat(clinic.latitude);
        const lng = parseFloat(clinic.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const position = { lat, lng };
        const plan = clinic.subscription_plan || 'trial';
        const color = planColors[plan] || '#94a3b8';

        // Custom SVG pin
        const svgPin = `
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24S32 26 32 16C32 7.163 24.837 0 16 0z"
              fill="${color}" stroke="white" stroke-width="2"/>
            <circle cx="16" cy="16" r="6" fill="white" opacity="0.9"/>
          </svg>`;

        const marker = new maps.Marker({
          position,
          map,
          title: clinic.name,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgPin),
            scaledSize: new maps.Size(32, 40),
            anchor: new maps.Point(16, 40),
          },
        });

        marker.addListener('click', () => {
          infoWindowRef.current.setContent(`
            <div style="font-family: system-ui, sans-serif; padding: 4px 2px; min-width: 180px;">
              <p style="font-weight: 700; font-size: 14px; margin: 0 0 4px;">${clinic.name}</p>
              <p style="font-size: 12px; color: #64748b; margin: 0 0 2px;">
                ${clinic.city || ''}${clinic.state ? `, ${clinic.state}` : ''}
              </p>
              ${clinic.phone ? `<p style="font-size: 12px; color: #64748b; margin: 0 0 2px;">📞 ${clinic.phone}</p>` : ''}
              <span style="
                display:inline-block;
                margin-top:6px;
                padding: 2px 8px;
                border-radius: 999px;
                background: ${color}22;
                color: ${color};
                font-size: 11px;
                font-weight: 600;
              ">${plan.toUpperCase()}</span>
            </div>
          `);
          infoWindowRef.current.open(map, marker);
        });

        markersRef.current.push(marker);
        bounds.extend(position);
      });

      if (clinics.length > 0) {
        map.fitBounds(bounds, { padding: 40 });
        // Don't zoom in too close for single marker
        const listener = maps.event.addListener(map, 'idle', () => {
          if (map.getZoom() > 14) map.setZoom(14);
          maps.event.removeListener(listener);
        });
      }

      setMapState('ready');
    } catch (err) {
      console.error('Map error:', err);
      setMapState('error');
    }
  }, []);

  useEffect(() => {
    initMap();
  }, [initMap]);

  return (
    <div className="relative h-full w-full min-h-[320px]">
      {/* Map container */}
      <div ref={mapRef} className="absolute inset-0 rounded-xl overflow-hidden" />

      {/* Loading overlay */}
      {mapState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-xl">
          <LoadingSpinner size="sm" text="Loading map..." />
        </div>
      )}

      {/* No API key state */}
      {mapState === 'no-key' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl gap-3 p-6 text-center">
          <div className="h-10 w-10 rounded-xl bg-slate-200 grid place-items-center text-slate-400">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Google Maps API Key Missing</p>
            <p className="text-xs text-slate-400 mt-1">
              Add <code className="bg-slate-200 px-1 rounded text-slate-600">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your <code className="bg-slate-200 px-1 rounded text-slate-600">.env.local</code>
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {mapState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 rounded-xl gap-2 p-6 text-center">
          <p className="text-sm font-semibold text-red-600">Failed to load map</p>
          <button
            onClick={initMap}
            className="text-xs text-red-500 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Clinic count badge — shown when map is ready */}
      {mapState === 'ready' && clinicCount > 0 && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 shadow text-xs font-semibold text-slate-700 backdrop-blur-sm">
          <MapPinned className="h-3.5 w-3.5 text-(--brand-primary)" />
          {clinicCount} clinic{clinicCount !== 1 ? 's' : ''} mapped
        </div>
      )}

      {/* Legend */}
      {mapState === 'ready' && (
        <div className="absolute bottom-3 left-3 flex flex-col gap-1 rounded-xl bg-white/90 px-3 py-2 shadow backdrop-blur-sm">
          {Object.entries(planColors).map(([plan, color]) => (
            <div key={plan} className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              {plan.charAt(0).toUpperCase() + plan.slice(1)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await apiGet('/clinics/admin/stats');
      if (!response?.success) {
        throw new Error(response?.error || 'Failed to load dashboard');
      }

      setDashboard(response.data || {});
    } catch (err) {
      setError(err.message || 'Unable to fetch dashboard stats.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const totalClinics = Number(dashboard?.totalClinics || 0);
  const totalPhoneNumbers = Number(dashboard?.totalPhoneNumbers || 0);
  const activeClinics = totalClinics;

  const stats = [
    {
      label: 'Total Clinics',
      value: totalClinics.toLocaleString(),
      meta: 'Registered clinics',
      icon: Building2,
    },
    {
      label: 'Total Phone Numbers',
      value: totalPhoneNumbers.toLocaleString(),
      meta: 'Across all clinics',
      icon: PhoneCall,
    },
    {
      label: 'Active Clinics',
      value: activeClinics.toLocaleString(),
      meta: 'All clinics using our product',
      icon: MapPinned,
    },
  ];

  const recentClinics = useMemo(() => {
    const clinics = Array.isArray(dashboard?.recentClinics)
      ? dashboard.recentClinics
      : [];

    if (!searchTerm.trim()) return clinics;

    const query = searchTerm.toLowerCase();
    return clinics.filter((clinic) =>
      [clinic.name, clinic.email, clinic.phone, clinic.owner_name]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query))
    );
  }, [dashboard, searchTerm]);

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Live clinic and phone-number overview.</p>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboard}
            disabled={isLoading}
            className="h-9"
          >
            <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <button className="relative rounded-full p-2 text-slate-400 transition hover:scale-105 hover:bg-slate-100 hover:text-(--brand-primary)">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-(--brand-primary)" />
          </button>
          <button className="rounded-full p-2 text-slate-400 transition hover:scale-105 hover:bg-slate-100 hover:text-(--brand-primary)">
            <Settings className="h-5 w-5" />
          </button>
          <div className="hidden h-6 w-px bg-slate-200 md:block" />
          <NewClinicDialog />
        </div>
      </div>

      {/* Error banner */}
      {error ? (
        <ErrorMessage
          message={error}
          onDismiss={() => setError('')}
          className="mb-4"
        />
      ) : null}

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.label}
              className="p-4 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400">{item.label}</p>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-(--brand-primary)/10 text-(--brand-primary)">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-1">
                <p className="text-2xl font-semibold text-slate-800">{item.value}</p>
                <span className="text-xs text-slate-400">{item.meta}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bottom row: Map + Recent Clinics */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">

        {/* ── Google Maps card (replaces Plan Distribution) ── */}
        <Card className="overflow-hidden p-4" style={{ minHeight: 360 }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Clinic Locations</h2>
              <p className="text-xs text-slate-400">All registered clinics on the map</p>
            </div>
            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">LIVE</Badge>
          </div>

          {/* Map fills remaining height */}
          <div className="relative rounded-xl overflow-hidden" style={{ height: 'calc(100% - 52px)', minHeight: 280 }}>
            <ClinicMap />
          </div>
        </Card>

        {/* ── Recent Clinics card ── */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">RECENT CLINICS</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 transition hover:scale-105"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
            <Search className="h-4 w-4" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search recent clinics"
              className="w-full bg-transparent text-sm text-slate-600 outline-none"
            />
          </div>

          {isLoading ? (
            <LoadingSpinner size="sm" text="Loading latest clinics..." />
          ) : (
            <div className="mt-4 space-y-3">
              {recentClinics.length ? (
                recentClinics.map((clinic) => (
                  <div
                    key={clinic.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{clinic.name}</p>
                        <p className="text-xs text-slate-400">
                          {clinic.subscription_plan || 'trial'} • {clinic.phone || 'No phone'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant()}>
                      {statusToLabel()}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                  No clinics match your search.
                </div>
              )}
            </div>
          )}

          <div className="mt-5">
            <Button
              variant="outline"
              className="h-10 w-full rounded-xl text-xs font-semibold transition hover:-translate-y-0.5"
              onClick={fetchDashboard}
            >
              REFRESH DASHBOARD DATA
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}