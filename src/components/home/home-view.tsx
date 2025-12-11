"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Site, Report, MapboxResult } from "@/lib/types";
import MapView from "@/components/map";
import { UserMenu } from "@/components/auth/user-menu";
import { LoginModal } from "@/components/auth/login-modal";
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
import { Loader2, Globe } from "lucide-react";
import { ThemeSwitcher } from "@/components/common/theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HomeViewProps {
  sites: Site[];
  user: User | null;
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "he", name: "Hebrew" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "ar", name: "Arabic" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese" },
];

export function HomeView({ sites, user }: HomeViewProps) {
  // Map & Selection State
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [flyToLocation, setFlyToLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [language, setLanguage] = useState("en");

  // Search State
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Site[]>([]);
  const [mapboxResults, setMapboxResults] = useState<MapboxResult[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Refs for debouncing and race condition handling
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const latestSearchId = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);

    // Set language based on browser preference
    const browserLang = navigator.language.split("-")[0];
    const isSupported = LANGUAGES.some((l) => l.code === browserLang);
    if (isSupported) {
      setLanguage(browserLang);
    }

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

  const handleSelectSite = async (site: Site | null) => {
    if (!site) {
      setSelectedSite(null);
      setReports([]);
      return;
    }
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
          language={language}
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
                  value={inputValue}
                  onFocus={() => setOpen(true)}
                  onBlur={() => setTimeout(() => setOpen(false), 200)}
                  onValueChange={handleSearch}
                  suppressHydrationWarning
                />
                {isLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              {open &&
                inputValue.length > 0 &&
                (searchResults.length > 0 || mapboxResults.length > 0) && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-popover rounded-xl shadow-2xl border border-border overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <CommandList className="max-h-[300px] overflow-y-auto py-2">
                      <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
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
        <div className="bg-background backdrop-blur-sm rounded-full shadow-md border border-border">
          <ThemeSwitcher />
        </div>
        {mounted && (user ? <UserMenu user={user} /> : <LoginModal />)}
      </div>

      {/* Bottom Left Logo Button */}
      <div className="absolute bottom-8 left-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-background shadow-md hover:bg-accent transition-colors border border-border">
              <Logo className="h-8 w-8" />
              <span className="font-bold text-lg text-foreground">
                Live Trip
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Globe className="mr-2 h-4 w-4" />
                <span>Language</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {LANGUAGES.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`cursor-pointer ${
                        language === lang.code ? "bg-accent" : ""
                      }`}
                    >
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </main>
  );
}
