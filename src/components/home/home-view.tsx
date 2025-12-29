"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Site, Report } from "@/lib/types";
import MapView from "@/components/map";
import { getReportsAction } from "@/app/actions/site";
import { useSearchEngine } from "@/hooks/use-search-engine";
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
import { ThemeSwitcher } from "@/components/common/theme-switcher";

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
  const [mounted, setMounted] = useState(false);

  // Input ref for managing focus
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize geolocation on mount
  useEffect(() => {
    setMounted(true);
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

  /**
   * Handle Database Site Selection
   * Updates both selected site and triggers map fly-to
   */
  const handleSiteSelection = useCallback(async (site: Site) => {
    setSelectedSite(site);
    setFlyToLocation({
      lat: site.location.lat,
      lng: site.location.lng,
    });
    inputRef.current?.blur();

    // Fetch reports for the selected site
    const siteReports = await getReportsAction(site.id);
    setReports(siteReports);
  }, []);

  /**
   * Handle Mapbox Location Selection
   * Triggers map fly-to without setting a selected site
   */
  const handleLocationSelection = useCallback(
    (location: {
      text: string;
      place_name: string;
      center: [number, number];
    }) => {
      setSelectedSite(null);
      setReports([]);
      setFlyToLocation({
        lat: location.center[1],
        lng: location.center[0],
      });
      inputRef.current?.blur();
    },
    []
  );

  // Initialize search engine hook with handlers
  const search = useSearchEngine({
    debounceMs: 300,
    minSearchLength: 1,
    onSiteSelect: handleSiteSelection,
    onLocationSelect: handleLocationSelection,
  });

  /**
   * Handle map-based site selection (clicking markers)
   */
  const handleMapSiteSelect = async (site: Site | null) => {
    if (!site) {
      setSelectedSite(null);
      setReports([]);
      return;
    }

    setSelectedSite(site);
    setFlyToLocation({
      lat: site.location.lat,
      lng: site.location.lng,
    });

    const siteReports = await getReportsAction(site.id);
    setReports(siteReports);
  };

  const hasResults =
    search.state.results.sites.length > 0 ||
    search.state.results.locations.length > 0;

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MapView
          sites={sites}
          selectedSite={selectedSite}
          reports={reports}
          flyToLocation={flyToLocation}
          onSiteSelect={handleMapSiteSelect}
        />
      </div>

      {/* Search Bar */}
      {mounted && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-md">
          <div className="relative">
            <Command
              shouldFilter={false}
              className="rounded-2xl border border-border bg-background/95 backdrop-blur-sm shadow-lg transition-all duration-200 focus-within:shadow-xl focus-within:ring-2 focus-within:ring-ring overflow-visible"
            >
              <div className="relative">
                <CommandInput
                  ref={inputRef}
                  placeholder="Search for a site..."
                  className="h-12 text-base text-foreground placeholder:text-muted-foreground pr-10"
                  value={search.state.query}
                  onFocus={search.openDropdown}
                  onBlur={() => setTimeout(search.closeDropdown, 200)}
                  onValueChange={search.performSearch}
                  suppressHydrationWarning
                />
                {search.state.isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              {search.state.isOpen &&
                search.state.query.length > 0 &&
                hasResults && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-popover rounded-xl shadow-2xl border border-border overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <CommandList className="max-h-[300px] overflow-y-auto py-2">
                      <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                        No results found.
                      </CommandEmpty>

                      {search.state.results.sites.length > 0 && (
                        <CommandGroup heading="Live Trip Sites">
                          {search.state.results.sites.map((site) => (
                            <CommandItem
                              key={site.id}
                              value={site.name}
                              onSelect={() => search.selectSite(site)}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              className="flex flex-col items-start px-4 py-3 mx-2 my-1 rounded-lg cursor-pointer transition-colors hover:bg-accent aria-selected:bg-accent"
                            >
                              <span className="font-semibold text-foreground text-sm">
                                {site.name}
                              </span>
                              <span className="text-xs text-muted-foreground truncate w-full mt-0.5">
                                {site.description}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}

                      {search.state.results.locations.length > 0 && (
                        <CommandGroup heading="Global Locations">
                          {search.state.results.locations.map((place) => (
                            <CommandItem
                              key={place.id}
                              value={place.place_name}
                              onSelect={() => search.selectLocation(place)}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              className="flex flex-col items-start px-4 py-3 mx-2 my-1 rounded-lg cursor-pointer transition-colors hover:bg-accent aria-selected:bg-accent"
                            >
                              <span className="font-semibold text-foreground text-sm">
                                {place.text}
                              </span>
                              <span className="text-xs text-muted-foreground truncate w-full mt-0.5">
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
      )}

      {/* Top Right Auth Button */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
        <div className="bg-background/90 backdrop-blur-sm rounded-full shadow-md border border-border">
          <ThemeSwitcher />
        </div>
        {authButton}
      </div>

      {/* Bottom Left Logo Button */}
      <div className="absolute bottom-8 left-4 z-10">
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-background shadow-md hover:bg-accent transition-colors border border-border">
          <Logo className="h-8 w-8" />
          <span className="font-bold text-lg text-foreground">Live Trip</span>
        </button>
      </div>
    </main>
  );
}
