import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full bg-muted animate-pulse rounded-lg flex items-center justify-center">
      Loading Map...
    </div>
  ),
});

export default MapView;
