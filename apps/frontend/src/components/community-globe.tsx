'use client';

import type { GlobeMarker } from '@cmt/shared-types';
import type { CommunitySummaryDto, PublicProfileDto } from '@/lib/api';
import type { Map as MapboxMap, Style } from 'mapbox-gl';
import Link from 'next/link';
import mapboxgl from 'mapbox-gl';
import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_ZOOM = 2;
const USER_LOCATION_ZOOM = 3;
const FOCUSED_AREA_ZOOM = 9;
const MIN_ZOOM = 2;
const MAX_ZOOM = 12;
const COUNT_MARKER_SOURCE_ID = 'count-markers';
const COUNT_MARKER_CIRCLE_LAYER_ID = 'count-marker-circles';
const COUNT_MARKER_LABEL_LAYER_ID = 'count-marker-labels';
const USER_LOCATION_SOURCE_ID = 'user-location';
const USER_LOCATION_CIRCLE_LAYER_ID = 'user-location-circle';

const TERRAIN_STYLE: Style = {
  version: 8,
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    terrain: {
      type: 'raster',
      tiles: ['https://mt1.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}&scale=2'],
      tileSize: 256,
      attribution: 'Map data &copy; Google',
    },
  },
  layers: [
    {
      id: 'terrain',
      type: 'raster',
      source: 'terrain',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

interface CommunityGlobeProps {
  communities: CommunitySummaryDto[];
  markers: GlobeMarker[];
  people: PublicProfileDto[];
}

interface MapCenter {
  latitude: number;
  longitude: number;
}

interface CountMarkerProperties {
  city: string;
  country: string;
  userCount: number;
}

function distanceFromLocation(marker: GlobeMarker, latitude: number, longitude: number) {
  const latDistance = marker.latitude - latitude;
  const lngDistance = marker.longitude - longitude;

  return latDistance * latDistance + lngDistance * lngDistance;
}

function initialsFor(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function locationLabel(city: string | null, country: string | null) {
  return [city, country].filter(Boolean).join(', ') || 'Location hidden';
}

function markerFeatureCollection(
  markers: GlobeMarker[],
): GeoJSON.FeatureCollection<GeoJSON.Point, CountMarkerProperties> {
  return {
    type: 'FeatureCollection',
    features: markers.map((marker) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [marker.longitude, marker.latitude],
      },
      properties: {
        city: marker.city,
        country: marker.country,
        userCount: marker.userCount,
      },
    })),
  };
}

function userLocationFeatureCollection(userLocation: MapCenter | null): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: userLocation
      ? [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [userLocation.longitude, userLocation.latitude],
            },
            properties: {},
          },
        ]
      : [],
  };
}

export function CommunityGlobe({ communities, markers, people }: CommunityGlobeProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const fallbackMarker = markers[0] ?? null;
  const [mapHeight, setMapHeight] = useState(620);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [selectedMarker, setSelectedMarker] = useState<GlobeMarker | null>(fallbackMarker);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<MapCenter | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'checking' | 'located' | 'fallback'>(
    'checking',
  );

  const focusMarker = (marker: GlobeMarker, status = locationStatus) => {
    setSelectedMarker(marker);
    setLocationStatus(status);
    mapRef.current?.flyTo({
      center: [marker.longitude, marker.latitude],
      essential: true,
      zoom: FOCUSED_AREA_ZOOM,
    });
  };

  useEffect(() => {
    const element = mapContainerRef.current;

    if (!element) {
      return;
    }

    const updateSize = () => {
      const width = Math.max(280, Math.floor(element.getBoundingClientRect().width));
      const desktopHeight = Math.min(680, Math.max(560, Math.floor(window.innerHeight * 0.62)));
      const height = width < 640 ? 420 : desktopHeight;

      setMapHeight(height);
    };
    const observer = new ResizeObserver(updateSize);

    updateSize();
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new mapboxgl.Map({
      attributionControl: false,
      center: [0, 20],
      container: mapContainerRef.current,
      maxZoom: MAX_ZOOM,
      minZoom: MIN_ZOOM,
      style: TERRAIN_STYLE,
      zoom: DEFAULT_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: false }), 'top-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    map.on('zoom', () => setZoom(Number(map.getZoom().toFixed(2))));
    map.on('load', () => {
      map.addSource(COUNT_MARKER_SOURCE_ID, {
        type: 'geojson',
        data: markerFeatureCollection(markers),
      });
      map.addLayer({
        id: COUNT_MARKER_CIRCLE_LAYER_ID,
        type: 'circle',
        source: COUNT_MARKER_SOURCE_ID,
        paint: {
          'circle-color': '#020617',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 13, 8, 20],
          'circle-stroke-color': '#334155',
          'circle-stroke-width': 1,
        },
      });
      map.addLayer({
        id: COUNT_MARKER_LABEL_LAYER_ID,
        type: 'symbol',
        source: COUNT_MARKER_SOURCE_ID,
        layout: {
          'text-allow-overlap': true,
          'text-field': ['to-string', ['get', 'userCount']],
          'text-font': ['Open Sans Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 2, 11, 8, 13],
        },
        paint: {
          'text-color': '#ffffff',
        },
      });
      map.addSource(USER_LOCATION_SOURCE_ID, {
        type: 'geojson',
        data: userLocationFeatureCollection(userLocation),
      });
      map.addLayer({
        id: USER_LOCATION_CIRCLE_LAYER_ID,
        type: 'circle',
        source: USER_LOCATION_SOURCE_ID,
        paint: {
          'circle-color': '#0ea5e9',
          'circle-radius': 9,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 3,
        },
      });

      map.on('mouseenter', COUNT_MARKER_CIRCLE_LAYER_ID, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', COUNT_MARKER_CIRCLE_LAYER_ID, () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('click', COUNT_MARKER_CIRCLE_LAYER_ID, (event) => {
        const feature = event.features?.[0];
        const properties = feature?.properties as CountMarkerProperties | undefined;
        const marker = markers.find(
          (candidate) =>
            candidate.city === properties?.city && candidate.country === properties.country,
        );

        if (marker) {
          focusMarker(marker);
        }
      });

      setMapReady(true);
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) {
      return;
    }

    const source = map.getSource(COUNT_MARKER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;

    source?.setData(markerFeatureCollection(markers));
  }, [mapReady, markers]);

  useEffect(() => {
    mapRef.current?.resize();
  }, [mapHeight]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) {
      return;
    }

    const source = map.getSource(USER_LOCATION_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;

    source?.setData(userLocationFeatureCollection(userLocation));
  }, [mapReady, userLocation]);

  useEffect(() => {
    if (!fallbackMarker) {
      setLocationStatus('fallback');
      return;
    }

    if (!('geolocation' in navigator)) {
      setSelectedMarker(fallbackMarker);
      setLocationStatus('fallback');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextUserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        const nearestMarker = markers.reduce((nearest, marker) => {
          const nearestDistance = distanceFromLocation(
            nearest,
            nextUserLocation.latitude,
            nextUserLocation.longitude,
          );
          const markerDistance = distanceFromLocation(
            marker,
            nextUserLocation.latitude,
            nextUserLocation.longitude,
          );

          return markerDistance < nearestDistance ? marker : nearest;
        }, fallbackMarker);

        setUserLocation(nextUserLocation);
        setSelectedMarker(nearestMarker);
        setLocationStatus('located');
        mapRef.current?.flyTo({
          center: [nextUserLocation.longitude, nextUserLocation.latitude],
          essential: true,
          zoom: USER_LOCATION_ZOOM,
        });
      },
      () => {
        setSelectedMarker(fallbackMarker);
        setLocationStatus('fallback');
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 5000 },
    );
  }, [fallbackMarker, markers]);

  const selectedPeople = useMemo(() => {
    if (!selectedMarker) {
      return people.slice(0, 6);
    }

    const localPeople = people.filter(
      (person) => person.country === selectedMarker.country && person.city === selectedMarker.city,
    );

    if (localPeople.length > 0) {
      return localPeople.slice(0, 6);
    }

    return people.filter((person) => person.country === selectedMarker.country).slice(0, 6);
  }, [people, selectedMarker]);

  const selectedCommunities = useMemo(() => {
    if (!selectedMarker) {
      return communities.slice(0, 4);
    }

    const localCommunities = communities.filter(
      (community) =>
        community.country === selectedMarker.country &&
        (community.city === selectedMarker.city || community.city === null),
    );

    if (localCommunities.length > 0) {
      return localCommunities.slice(0, 4);
    }

    return communities
      .filter((community) => community.country === selectedMarker.country || community.type === 'topic')
      .slice(0, 4);
  }, [communities, selectedMarker]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return markers.slice(0, 5);
    }

    return markers
      .filter((marker) =>
        `${marker.city} ${marker.country}`.toLowerCase().includes(query),
      )
      .slice(0, 6);
  }, [markers, searchQuery]);

  const matchingPeople = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return selectedPeople;
    }

    return people
      .filter((person) =>
        `${person.displayName} ${person.username} ${person.city ?? ''} ${person.country ?? ''}`
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 6);
  }, [people, searchQuery, selectedPeople]);

  const activePeople = searchQuery.trim() ? matchingPeople : selectedPeople;
  const selectedAreaLabel = selectedMarker
    ? `${selectedMarker.city}, ${selectedMarker.country}`
    : 'visible locations';
  const selectedUserCount = selectedMarker?.userCount ?? markers.reduce((total, marker) => total + marker.userCount, 0);

  return (
    <section className="overflow-hidden border-b border-slate-300 bg-white">
      <div
        className="relative overflow-hidden bg-[#83c7ee]"
        data-map-zoom={zoom}
        ref={mapContainerRef}
        style={{ height: mapHeight }}
      />

      <div className="border-t border-slate-300 bg-white">
        <div className="grid gap-4 border-b border-slate-200 p-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
          <aside className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Find people with CMT
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">{selectedAreaLabel}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {selectedUserCount} visible {selectedUserCount === 1 ? 'person' : 'people'} in this area.
              </p>
            </div>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Search location or member
              <input
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
                placeholder="City, country, or username"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>

            <div className="grid gap-2">
              {searchResults.map((marker) => (
                <button
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-slate-400"
                  key={`${marker.country}-${marker.city}`}
                  type="button"
                  onClick={() => focusMarker(marker)}
                >
                  <span>
                    <span className="block font-semibold text-slate-950">{marker.city}</span>
                    <span className="block text-xs text-slate-500">{marker.country}</span>
                  </span>
                  <span className="rounded-full bg-slate-950 px-2 py-1 text-xs font-semibold text-white">
                    {marker.userCount}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                className="inline-flex justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                href="/register"
              >
                Join nearby
              </Link>
              <Link
                className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                href="/communities"
              >
                Create group
              </Link>
            </div>
          </aside>

          <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
            <section>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">People you can message</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {searchQuery.trim()
                      ? 'Matching public profiles'
                      : `Profiles visible around ${selectedAreaLabel}`}
                  </p>
                </div>
                <Link className="text-sm font-semibold text-emerald-700" href="/members">
                  Browse all people
                </Link>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {activePeople.length > 0 ? (
                  activePeople.map((person) => (
              <article
                className="grid min-h-[170px] gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
                key={person.id}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-950 text-sm font-semibold text-white">
                    {initialsFor(person.displayName)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-950">
                      {person.displayName}
                    </h3>
                    <p className="truncate text-sm text-slate-500">@{person.username}</p>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      {locationLabel(person.city, person.country)}
                    </p>
                  </div>
                </div>
                <p className="line-clamp-2 text-sm text-slate-600">
                  {person.bio || 'Open to connecting with other people living with CMT.'}
                </p>
                <div className="mt-auto grid grid-cols-2 gap-2">
                  <Link
                    className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                    href={`/profile/${person.username}`}
                  >
                    Profile
                  </Link>
                  <Link
                    className="inline-flex justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    href={`/messages?userId=${person.user.id}`}
                  >
                    Message
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No visible profiles match this area yet.
            </div>
          )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">Nearby groups</h2>
                  <p className="mt-1 text-xs text-slate-500">City, country, and topic spaces</p>
                </div>
                <Link className="text-sm font-semibold text-emerald-700" href="/communities">
                  All groups
                </Link>
              </div>
              <div className="grid gap-2">
                {selectedCommunities.map((community) => (
                  <Link
                    className="rounded-md border border-slate-200 bg-white p-3 transition hover:border-slate-400"
                    href={`/community/${community.slug}`}
                    key={community.id}
                  >
                    <span className="block text-sm font-semibold text-slate-950">
                      {community.name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {locationLabel(community.city, community.country) || community.type}
                    </span>
                    <span className="mt-2 block text-sm text-slate-600">
                      {community.description ?? `${community.memberCount} members`}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
