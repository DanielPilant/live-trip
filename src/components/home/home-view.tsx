"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Site, Report, MapboxResult } from "@/lib/types";
import MapView from "@/components/map";
import {
  searchSitesAction,
  getReportsAction,
  searchMapboxAction,
} from "@/app/actions/site";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Logo } from "@/components/ui/logo";
import { Loader2 } from "lucide-react";

interface HomeViewProps {
  sites: Site[];
  authButton: React.ReactNode;
}

export function HomeView({ sites, authButton }: HomeViewProps) {
  // Map & Selection State
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [flyToLocation, setFlyToLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [reports, setReports] = useState<Report[]>([]);

  // Search State
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Site[]>([]);
  const [mapboxResults, setMapboxResults] = useState<MapboxResult[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Refs for debouncing and race condition handling
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const latestSearchId = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFlyToLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          if (error.code === 1) {
            // User denied permission - this is expected behavior
            console.log("User denied location access");
            return;
          }
          console.error("Error getting location:", error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      setInputValue(value);
      setOpen(true); // Ensure dropdown opens when typing

      // Clear existing timeout
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      // Reset state if input is empty
      if (!value.trim()) {
        setSearchResults([]);
        setMapboxResults([]);
        setIsLoading(false);
        return;
      }

      // Prevent re-searching the currently selected item
      if (selectedSite && value === selectedSite.name) {
        return;
      }

      setIsLoading(true);
      const searchId = ++latestSearchId.current;

      debounceTimeout.current = setTimeout(async () => {
        try {
          // Run searches in parallel
          const [dbResults, mapResults] = await Promise.all([
            searchSitesAction(value),
            searchMapboxAction(value),
          ]);

          // Only update state if this is still the latest search
          if (searchId === latestSearchId.current) {
            setSearchResults(dbResults);
            setMapboxResults(mapResults);
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Search failed:", error);
          if (searchId === latestSearchId.current) {
            setIsLoading(false);
          }
        }
      }, 300);
    },
    [selectedSite]
  );

  const handleSelectSite = async (site: Site) => {
    setSelectedSite(site);
    setFlyToLocation(null);
    setInputValue(site.name);
    setOpen(false);
    inputRef.current?.blur();
    setSearchResults([]);
    setMapboxResults([]);

    // Fetch reports
    const siteReports = await getReportsAction(site.id);
    setReports(siteReports);
  };

  const handleSelectLocation = (place: MapboxResult) => {
    setSelectedSite(null);
    setReports([]);
    setFlyToLocation({
      lat: place.center[1],
      lng: place.center[0],
    });
    setInputValue(place.text);
    setOpen(false);
    inputRef.current?.blur();
    setSearchResults([]);
    setMapboxResults([]);
  };
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MapView
          sites={sites}
          selectedSite={selectedSite}
          reports={reports}
          flyToLocation={flyToLocation}
          onSiteSelect={handleSelectSite}
        />
      </div>

      {/* Search Bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-md">
        <div className="relative">
          <Command
            shouldFilter={false}
            className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-sm shadow-lg transition-all duration-200 focus-within:shadow-xl focus-within:ring-2 focus-within:ring-gray-100 overflow-visible"
          >
            <div className="relative">
              <CommandInput
                ref={inputRef}
                placeholder="Search for a site..."
                className="h-12 text-base text-gray-900 placeholder:text-gray-400 pr-10"
                value={inputValue}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 200)}
                onValueChange={handleSearch}
                suppressHydrationWarning
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            {open &&
              inputValue.length > 0 &&
              (searchResults.length > 0 || mapboxResults.length > 0) && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <CommandList className="max-h-[300px] overflow-y-auto py-2">
                    <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                      No results found.
                    </CommandEmpty>

                    {searchResults.length > 0 && (
                      <CommandGroup heading="Live Trip Sites">
                        {searchResults.map((site) => (
                          <CommandItem
                            key={site.id}
                            value={site.name}
                            onSelect={() => handleSelectSite(site)}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="flex flex-col items-start px-4 py-3 mx-2 my-1 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 aria-selected:bg-gray-100"
                          >
                            <span className="font-semibold text-gray-900 text-sm">
                              {site.name}
                            </span>
                            <span className="text-xs text-gray-500 truncate w-full mt-0.5">
                              {site.description}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {mapboxResults.length > 0 && (
                      <CommandGroup heading="Global Locations">
                        {mapboxResults.map((place) => (
                          <CommandItem
                            key={place.id}
                            value={place.place_name}
                            onSelect={() => handleSelectLocation(place)}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="flex flex-col items-start px-4 py-3 mx-2 my-1 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 aria-selected:bg-gray-100"
                          >
                            <span className="font-semibold text-gray-900 text-sm">
                              {place.text}
                            </span>
                            <span className="text-xs text-gray-500 truncate w-full mt-0.5">
                              {place.place_name}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </div>
              )}
          </Command>
        </div>
      </div>

      {/* Top Right Auth Button */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">{authButton}</div>

      {/* Bottom Left Logo Button */}
      <div className="absolute bottom-8 left-4 z-10">
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors">
          <Logo className="h-8 w-8" />
          <span className="font-bold text-lg text-black">Live Trip</span>
        </button>
      </div>
    </main>
  );
}
