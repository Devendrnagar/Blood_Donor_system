import { useEffect, useRef, useState } from 'react';

interface Donor {
  id: string;
  blood_type: string;
  latitude: number;
  longitude: number;
  city: string;
  profile?: {
    full_name: string;
  };
}

interface DonorMapProps {
  donors: Donor[];
  center: { lat: number; lng: number };
  apiKey?: string;
}

// Global flag to prevent multiple script loads
let isGoogleMapsLoading = false;
let isGoogleMapsLoaded = false;



export default function DonorMap({ donors, center, apiKey }: DonorMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!apiKey) {
      setMapError('Google Maps API key not provided');
      setIsLoading(false);
      return;
    }

    const loadGoogleMaps = () => {
      // Check if already loaded
      if (window.google && window.google.maps && window.google.maps.Map) {
        isGoogleMapsLoaded = true;
        initMap();
        return;
      }

      // Check if already loading
      if (isGoogleMapsLoading) {
        // Wait for the loading to complete
        const checkInterval = setInterval(() => {
          if (isGoogleMapsLoaded && window.google && window.google.maps && window.google.maps.Map) {
            clearInterval(checkInterval);
            initMap();
          }
        }, 100);
        return;
      }

      // Remove any existing scripts to prevent duplicates
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      existingScripts.forEach(script => script.remove());

      isGoogleMapsLoading = true;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        isGoogleMapsLoaded = true;
        isGoogleMapsLoading = false;
        // Add a small delay to ensure all APIs are fully loaded
        setTimeout(() => {
          initMap();
        }, 100);
      };
      
      script.onerror = () => {
        isGoogleMapsLoading = false;
        setMapError('Failed to load Google Maps API');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    };

    const initMap = async () => {
      if (!mapRef.current || !window.google || !window.google.maps || !window.google.maps.Map) {
        setMapError('Google Maps API not available');
        setIsLoading(false);
        return;
      }

      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: center,
          zoom: 12,
          mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
        });

        mapInstanceRef.current = map;

        // Create user location marker using AdvancedMarkerElement
        if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
          const userLocationDiv = document.createElement('div');
          userLocationDiv.className = 'user-location-marker';
          userLocationDiv.style.cssText = `
            width: 16px;
            height: 16px;
            background-color: #4285F4;
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          `;

          new window.google.maps.marker.AdvancedMarkerElement({
            map,
            position: center,
            content: userLocationDiv,
            title: 'Your Location',
          });

          // Create donor markers
          donors.forEach((donor) => {
            const donorMarkerDiv = document.createElement('div');
            donorMarkerDiv.className = 'donor-marker';
            donorMarkerDiv.style.cssText = `
              width: 12px;
              height: 12px;
              background-color: #DC2626;
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              cursor: pointer;
            `;

            const marker = new window.google.maps.marker.AdvancedMarkerElement({
              map,
              position: { lat: donor.latitude, lng: donor.longitude },
              content: donorMarkerDiv,
              title: donor.profile?.full_name || 'Donor',
            });

            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; min-width: 150px;">
                  <h3 style="font-weight: bold; margin: 0 0 4px 0; color: #1f2937;">${donor.profile?.full_name || 'Anonymous'}</h3>
                  <p style="margin: 0 0 2px 0; color: #DC2626; font-weight: bold;">Blood Type: ${donor.blood_type}</p>
                  <p style="margin: 0; color: #666; font-size: 14px;">${donor.city}</p>
                </div>
              `,
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });
          });
        } else {
          // Fallback to deprecated Marker if AdvancedMarkerElement is not available
          new google.maps.Marker({
            position: center,
            map: map,
            title: 'Your Location',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });

          donors.forEach((donor) => {
            const marker = new google.maps.Marker({
              position: { lat: donor.latitude, lng: donor.longitude },
              map: map,
              title: donor.profile?.full_name || 'Donor',
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: '#DC2626',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
            });

            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; min-width: 150px;">
                  <h3 style="font-weight: bold; margin: 0 0 4px 0; color: #1f2937;">${donor.profile?.full_name || 'Anonymous'}</h3>
                  <p style="margin: 0 0 2px 0; color: #DC2626; font-weight: bold;">Blood Type: ${donor.blood_type}</p>
                  <p style="margin: 0; color: #666; font-size: 14px;">${donor.city}</p>
                </div>
              `,
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });
          });
        }

        setIsLoading(false);
        setMapError(null);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map');
        setIsLoading(false);
      }
    };

    loadGoogleMaps();
  }, [donors, center, apiKey]);

  if (!apiKey) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-yellow-600 mb-2">⚠️</div>
          <p className="text-gray-600 mb-2">Google Maps API key not configured</p>
          <p className="text-sm text-gray-500">Add VITE_GOOGLE_MAPS_API_KEY to your .env file</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="w-full h-96 bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-red-600 mb-2">❌</div>
          <p className="text-red-600 mb-2">Map Error</p>
          <p className="text-sm text-red-500">{mapError}</p>
          <p className="text-xs text-gray-500 mt-2">Please check your Google Maps API key and configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 rounded-lg shadow-md overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}

/// <reference types="google.maps" />

declare global {
  interface Window {
    google: typeof google;
  }
}
