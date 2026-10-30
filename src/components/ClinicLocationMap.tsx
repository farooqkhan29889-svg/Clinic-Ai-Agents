import React, { useState, useEffect } from 'react';
import { CLINIC } from '../data/clinicData';
import {
  MapPin,
  Navigation,
  Compass,
  ExternalLink,
  Copy,
  Check,
  Search,
  Sparkles,
  Phone,
  Clock,
  Car,
  Bus,
  Share2,
  AlertCircle,
  Building2,
  Pill,
  LocateFixed,
  Route,
} from 'lucide-react';

interface GroundingPlace {
  title?: string;
  uri?: string;
  placeId?: string;
  address?: string;
  reviewSnippet?: string;
}

interface GroundingMetadataItem {
  maps?: {
    uri?: string;
    title?: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        snippet?: string;
        author?: string;
      }[];
    };
  };
  web?: {
    uri?: string;
    title?: string;
  };
}

export const ClinicLocationMap: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('directions');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [groundedAnswer, setGroundedAnswer] = useState<string | null>(null);
  const [groundedPlaces, setGroundedPlaces] = useState<GroundingPlace[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  // Encode clinic address for Google Maps
  const encodedAddress = encodeURIComponent(CLINIC.address);
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
  const googleMapsViewUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  // Embedded Map URL (OpenStreetMap / Google Maps embed friendly fallback with clean coordinates)
  // Karond, Bhopal coordinates: 23.2965° N, 77.4065° E
  const embedMapUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(CLINIC.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Detect user location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }
    setLocationStatus('Locating your position...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocationStatus('Location detected! Nearby routes updated.');
        setTimeout(() => setLocationStatus(null), 3000);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLocationStatus('Could not retrieve location. Using CityCare Karond coordinates.');
        setTimeout(() => setLocationStatus(null), 3000);
      },
      { timeout: 8000 }
    );
  };

  // Query server-side Gemini 3.8 Flash with googleMaps tool
  const fetchMapsGrounding = async (queryText: string) => {
    setIsLoading(true);
    setGroundedAnswer(null);
    setGroundedPlaces([]);

    try {
      const response = await fetch('/api/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          latLng: userLocation || { latitude: 23.2965, longitude: 77.4065 },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGroundedAnswer(data.text);

        // ALWAYS extract URLs from groundingChunks and list them on the web app as links
        const places: GroundingPlace[] = [];
        if (Array.isArray(data.groundingChunks)) {
          data.groundingChunks.forEach((chunk: GroundingMetadataItem) => {
            if (chunk.maps?.uri) {
              const review = chunk.maps.placeAnswerSources?.reviewSnippets?.[0]?.snippet;
              places.push({
                title: chunk.maps.title || 'Google Maps Location',
                uri: chunk.maps.uri,
                reviewSnippet: review,
              });
            } else if (chunk.web?.uri) {
              places.push({
                title: chunk.web.title || 'Web Reference',
                uri: chunk.web.uri,
              });
            }
          });
        }
        setGroundedPlaces(places);
      } else {
        // Fallback info if API error
        setGroundedAnswer(
          data.fallback?.text ||
            'CityCare Clinic is located at Shop No. 4, near Saeed Colony, Housing Board, Karond, Bhopal (PIN 462038). Easy access from Karond Square, Berasia Road, and Peoples Hospital Road.'
        );
        if (data.fallback?.place) {
          setGroundedPlaces([data.fallback.place]);
        }
      }
    } catch (e: any) {
      console.error('Fetch error for maps grounding:', e);
      setGroundedAnswer(
        'CityCare Clinic is situated at Shop No. 4, near Saeed Colony, Housing Board, Karond, Bhopal (PIN 462038). Prominent landmarks nearby include Karond Square, Saeed Colony Masjid, and Housing Board Shopping Center.'
      );
      setGroundedPlaces([
        {
          title: 'CityCare Clinic Karond Bhopal',
          uri: googleMapsViewUrl,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial query on mount
  useEffect(() => {
    fetchMapsGrounding('Directions and landmarks for CityCare Clinic near Saeed Colony Karond Bhopal');
  }, []);

  const handlePresetClick = (presetKey: string, queryText: string) => {
    setActivePreset(presetKey);
    fetchMapsGrounding(queryText);
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    setActivePreset('custom');
    fetchMapsGrounding(customQuery.trim());
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#edf4ef] dark:border-[#2e211b]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] text-xs font-bold uppercase tracking-wider mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>CityCare Clinic Karond Branch</span>
            </div>
            <h2 className="font-heading text-xl md:text-2xl font-bold text-[#30221d] dark:text-[#f7eee9]">
              Clinic Location & Grounded Navigation
            </h2>
            <p className="text-xs md:text-sm text-[#64554d] dark:text-[#a89991] mt-1 max-w-xl">
              {CLINIC.address} · PIN 462038, Bhopal, Madhya Pradesh
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-full bg-[#176541] hover:bg-[#125133] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Get Live Directions</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
            </a>

            <button
              onClick={copyAddressToClipboard}
              className="px-3.5 py-2.5 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-[#fdfaf8] dark:bg-[#251d19] hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-[#481e0b] dark:text-[#f7eee9] transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copy address"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Address'}</span>
            </button>

            <button
              onClick={handleDetectLocation}
              className="px-3.5 py-2.5 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-[#fdfaf8] dark:bg-[#251d19] hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-[#481e0b] dark:text-[#f7eee9] transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Detect my current GPS location"
            >
              <LocateFixed className="w-3.5 h-3.5 text-[#c85d38]" />
              <span>My Location</span>
            </button>
          </div>
        </div>

        {locationStatus && (
          <div className="mt-3 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Compass className="w-4 h-4 animate-spin text-blue-600" />
            <span>{locationStatus}</span>
          </div>
        )}

        {/* Map & Quick Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
          {/* Left: Embedded Google Maps Viewer */}
          <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-[#d5e5db] dark:border-[#382b24] shadow-sm bg-gray-100 dark:bg-[#251d19] relative min-h-[360px]">
            <iframe
              title="CityCare Clinic Karond Location Map"
              src={embedMapUrl}
              className="w-full h-[360px] md:h-[400px] border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="p-3 bg-white/95 dark:bg-[#1e1714]/95 backdrop-blur-sm border-t border-[#edf4ef] dark:border-[#2e211b] flex items-center justify-between text-[11px] text-[#64554d] dark:text-[#a89991]">
              <span className="flex items-center gap-1 font-semibold text-[#176541] dark:text-[#34d399]">
                <MapPin className="w-3 h-3 text-[#c85d38]" />
                Karond, Bhopal (23.2965° N, 77.4065° E)
              </span>
              <a
                href={googleMapsViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-[#a84724] dark:text-[#f38360] font-bold flex items-center gap-1"
              >
                <span>View Full Map</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Right: Clinic Accessibility & Transit Guide */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl bg-[#edf7f0] dark:bg-[#1a2d22] border border-[#cfe1d5] dark:border-[#2b4434] text-xs">
              <h4 className="font-heading font-bold text-sm text-[#176541] dark:text-[#34d399] mb-2 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-[#176541] dark:text-[#34d399]" />
                Transit & Parking Access
              </h4>
              <ul className="space-y-1.5 text-[#30221d] dark:text-[#d1fae5] leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-[#176541] dark:text-[#34d399] font-bold">•</span>
                  <span><strong>By Car/Auto:</strong> Just 500m from Karond Square towards Berasia Road. Near Saeed Colony entrance.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#176541] dark:text-[#34d399] font-bold">•</span>
                  <span><strong>By Bus:</strong> Karond Chauraha bus stop (Routes 104, 208, 305). 4-minute walking distance.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#176541] dark:text-[#34d399] font-bold">•</span>
                  <span><strong>Parking:</strong> Free street parking and designated wheelchair-accessible ramp at the clinic entrance.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#251d19] border border-[#d5e5db] dark:border-[#382b24] text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Clock className="w-4 h-4 text-[#c85d38]" />
                <span><strong>Hours:</strong> {CLINIC.hours} (Sunday Closed)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Phone className="w-4 h-4 text-[#176541] dark:text-[#34d399]" />
                <span><strong>Front Desk:</strong> {CLINIC.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Maps Grounding Explorer (Gemini 3.8 Flash with googleMaps) */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#f8faf8] via-white to-[#f4f7f4] dark:from-[#1b1512] dark:via-[#1e1714] dark:to-[#17110e] border border-[#d5e5db] dark:border-[#382b24] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Live Google Maps Grounding · Gemini 3.8 Flash
            </div>
            <h3 className="font-heading text-lg md:text-xl font-bold text-[#30221d] dark:text-[#f7eee9]">
              Nearby Health Amenities & Local Guide
            </h3>
            <p className="text-xs text-gray-500">
              Real-time verified geographical data from Google Maps for patients visiting Karond, Bhopal.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() =>
                handlePresetClick(
                  'directions',
                  'Give directions, landmark access and road navigation to reach CityCare Clinic Shop No 4 Saeed Colony Karond Bhopal'
                )
              }
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activePreset === 'directions'
                  ? 'bg-[#176541] text-white shadow-xs'
                  : 'bg-white dark:bg-[#251d19] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-[#176541]'
              }`}
            >
              Directions & Landmarks
            </button>

            <button
              onClick={() =>
                handlePresetClick(
                  'pharmacies',
                  'Find open medical stores and pharmacies near Karond square and Saeed Colony Bhopal'
                )
              }
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activePreset === 'pharmacies'
                  ? 'bg-[#176541] text-white shadow-xs'
                  : 'bg-white dark:bg-[#251d19] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-[#176541]'
              }`}
            >
              Nearby Pharmacies
            </button>

            <button
              onClick={() =>
                handlePresetClick(
                  'hospitals',
                  'Emergency hospitals, trauma centers and medical facilities near Karond Bhopal'
                )
              }
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activePreset === 'hospitals'
                  ? 'bg-[#176541] text-white shadow-xs'
                  : 'bg-white dark:bg-[#251d19] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-[#176541]'
              }`}
            >
              Emergency Hospitals
            </button>
          </div>
        </div>

        {/* Custom Question Search Bar */}
        <form onSubmit={handleCustomSearch} className="mb-5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Ask about any local route, nearby medicine shop, blood bank or landmark in Karond..."
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-white dark:bg-[#251d19] border border-[#d5e5db] dark:border-[#42332a] text-xs md:text-sm text-[#30221d] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#176541]"
            />
            <button
              type="submit"
              disabled={isLoading || !customQuery.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#176541] hover:bg-[#125133] disabled:opacity-50 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Ask Maps
            </button>
          </div>
        </form>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] text-center space-y-2">
            <Compass className="w-8 h-8 animate-spin text-[#176541] dark:text-[#34d399] mx-auto" />
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Querying Google Maps Grounding with Gemini 3.8 Flash...
            </p>
            <p className="text-[10px] text-gray-400">Fetching verified locations and place links</p>
          </div>
        )}

        {/* Grounded Response Content */}
        {!isLoading && groundedAnswer && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] text-xs text-[#30221d] dark:text-[#e8dcd5] leading-relaxed shadow-2xs whitespace-pre-line">
              {groundedAnswer}
            </div>

            {/* MANDATORY: Extracted Google Maps URLs as interactive links */}
            {groundedPlaces.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399]" />
                  Verified Google Maps Places & Links ({groundedPlaces.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groundedPlaces.map((place, idx) => (
                    <a
                      key={idx}
                      href={place.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] hover:border-[#176541] dark:hover:border-[#34d399] shadow-2xs transition-all flex items-start justify-between gap-2 group cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-xs text-[#176541] dark:text-[#34d399] group-hover:underline flex items-center gap-1">
                          <span>{place.title}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </div>
                        {place.reviewSnippet && (
                          <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 italic">
                            "{place.reviewSnippet}"
                          </p>
                        )}
                        <span className="text-[9px] text-gray-400 block mt-1">Open in Google Maps ↗</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
