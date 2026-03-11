import { useGetHeatmap } from "@workspace/api-client-react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Activity, Info } from "lucide-react";

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function Heatmap() {
  const { data, isLoading, isError } = useGetHeatmap({ days: 30 });

  if (isLoading) {
    return (
      <div className="w-full h-[80vh] bg-card rounded-2xl border border-border animate-pulse flex items-center justify-center">
        <Activity className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold font-display mb-2">Map Unavailable</h2>
        <p className="text-muted-foreground">Failed to load geospatial complaint data.</p>
      </div>
    );
  }

  const getColor = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case "Critical": return "#f43f5e"; // rose-500
      case "High": return "#f97316"; // orange-500
      case "Medium": return "#eab308"; // amber-500
      case "Low": return "#10b981"; // emerald-500
      default: return "#3b82f6"; // blue-500
    }
  };

  const getRadius = (complaintCount: number) => {
    return Math.max(8, Math.min(complaintCount * 2, 30));
  };

  // Center on average coords or default India
  const centerLat = data.booths.length > 0 ? data.booths.reduce((sum, b) => sum + b.lat, 0) / data.booths.length : 20.5937;
  const centerLng = data.booths.length > 0 ? data.booths.reduce((sum, b) => sum + b.lng, 0) / data.booths.length : 78.9629;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Constituency Heatmap</h2>
          <p className="text-muted-foreground">Live visualization of issue clusters across booths.</p>
        </div>
        <div className="flex gap-4">
          <Card className="bg-background border-border shadow-none">
            <CardContent className="py-2 px-4 flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Total Issues (30d)</span>
              <span className="text-xl font-bold font-display">{data.totalComplaints}</span>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden border border-border shadow-xl shadow-black/20 relative">
        <MapContainer 
          center={[centerLat, centerLng]} 
          zoom={data.booths.length > 0 ? 11 : 5} 
          style={{ height: '100%', width: '100%', zIndex: 1 }}
        >
          <ChangeView center={[centerLat, centerLng]} zoom={data.booths.length > 0 ? 11 : 5} />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {data.booths.map((booth) => (
            <CircleMarker
              key={booth.boothId}
              center={[booth.lat, booth.lng]}
              radius={getRadius(booth.complaintCount)}
              pathOptions={{ 
                color: getColor(booth.urgencyLevel),
                fillColor: getColor(booth.urgencyLevel),
                fillOpacity: 0.6,
                weight: 2
              }}
            >
              <Popup className="custom-popup">
                <div className="p-1 min-w-[200px]">
                  <h4 className="font-bold text-base mb-1 border-b border-border/50 pb-2">{booth.boothName}</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Complaints:</span>
                      <span className="font-bold">{booth.complaintCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resolved:</span>
                      <span className="font-bold text-emerald-400">{booth.resolvedComplaints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Health Score:</span>
                      <span className="font-bold">{booth.healthScore}/100</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-border/50">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium w-full text-center" 
                            style={{ backgroundColor: `${getColor(booth.urgencyLevel)}20`, color: getColor(booth.urgencyLevel) }}>
                        {booth.urgencyLevel} Priority
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend Overlay */}
        <div className="absolute bottom-6 right-6 z-[1000] bg-card/90 backdrop-blur-md p-4 rounded-xl border border-border shadow-lg">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Urgency Level</h4>
          <div className="space-y-2">
            {[
              { label: 'Critical', color: 'bg-rose-500' },
              { label: 'High', color: 'bg-orange-500' },
              { label: 'Medium', color: 'bg-amber-500' },
              { label: 'Low', color: 'bg-emerald-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color} shadow-[0_0_8px_currentColor]`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="w-4 h-4" />
            Circle size = volume
          </div>
        </div>
      </div>
    </div>
  );
}
