import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Rectangle, Tooltip } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import { Box, CircularProgress } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

function getColor(median, min, max) {
  if (median == null || min == null || max == null) return "#808080";
  const clamped = Math.min(Math.max(median, min), max);
  const normalized = (clamped - min) / (max - min);
  const r = Math.floor(255 * normalized);
  const g = Math.floor(255 * (1 - normalized));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}00`;
}

const ColorLegend = ({ min, max }) => (
  <div
    style={{
      position: "absolute",
      bottom: 20,
      left: 20,
      padding: 10,
      backgroundColor: "white",
      border: "1px solid #ccc",
      borderRadius: 4,
      zIndex: 1000,
      fontSize: "0.9em",
    }}
  >
    <div style={{ fontWeight: "bold", marginBottom: 5 }}>Median Price/m²</div>
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ marginRight: 5 }}>{min.toFixed(0)}</span>
      <div
        style={{
          flexGrow: 1,
          height: "10px",
          background: "linear-gradient(to right, #00ff00, #ff0000)",
        }}
      />
      <span style={{ marginLeft: 5 }}>{max.toFixed(0)}</span>
    </div>
  </div>
);

const MapView = ({
  center = [49.6116, 6.1319],
  gridSize = 1,
  sold = "sold",
  transaction = "buy",
  year = "2023", // Add year as a prop with default value
}) => {
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalMin, setGlobalMin] = useState(null);
  const [globalMax, setGlobalMax] = useState(null);

  const navigate = useNavigate();
  const selectedYear = parseInt(year);
  
  // The years we want to show in the graph
  const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];
  const endpointBaseUrl = "https://fastapi-athome-production.up.railway.app/raster/raster_Immo";

  useEffect(() => {
    async function fetchAllYears() {
      setLoading(true);

      try {
        // Create requests for each year
        const fetchPromises = YEARS.map((yr) => {
          const url = `${endpointBaseUrl}?sold=${sold}&grid_size=${gridSize}&center_lat=${center[0]}&center_lon=${center[1]}&year=${yr}&transaction=${transaction}`;
          return fetch(url).then((res) => res.json());
        });

        // Wait for all responses
        const allResults = await Promise.all(fetchPromises);
        
        // Merge them by cell_id
        const cellDataMap = {};

        YEARS.forEach((yr, idx) => {
          const result = allResults[idx] || {};
          const yearCells = result.cells || [];
          yearCells.forEach((c) => {
            const cid = c.cell_id;
            if (!cellDataMap[cid]) {
              cellDataMap[cid] = {
                cell_id: cid,
                bounds: c.bounds,
                yearly_stats: {}, // year -> stats
              };
            }
            const st = c.statistics || {};
            cellDataMap[cid].yearly_stats[yr] = {
              min: st.min_price_per_m2 || 0,
              q1: st.q1_price_per_m2 || 0,
              median: st.median_price_per_m2 || 0,
              avg: st.avg_price_per_m2 || 0,
              q3: st.q3_price_per_m2 || 0,
              max: st.max_price_per_m2 || 0,
            };
          });
        });

        // Convert to array
        const mergedCells = Object.values(cellDataMap);

        // Calculate global min/max for the selected year only
        const mediansForSelectedYear = mergedCells
          .map(cell => cell.yearly_stats[selectedYear]?.median)
          .filter(median => median > 0);

        if (mediansForSelectedYear.length > 0) {
          mediansForSelectedYear.sort((a, b) => a - b);
          const lowerIndex = Math.floor(mediansForSelectedYear.length * 0.05);
          const upperIndex = Math.floor(mediansForSelectedYear.length * 0.95);
          setGlobalMin(mediansForSelectedYear[lowerIndex]);
          setGlobalMax(mediansForSelectedYear[upperIndex] || mediansForSelectedYear[mediansForSelectedYear.length - 1]);
        }

        setCells(mergedCells);
      } catch (err) {
        console.error("Error fetching multi-year data:", err);
        setCells([]);
      }

      setLoading(false);
    }

    fetchAllYears();
  }, [endpointBaseUrl, center, gridSize, sold, transaction, selectedYear]);

  if (loading) {
    return (
      <Box
        sx={{
          height: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "calc(100vh - 64px)", width: "100%", position: "relative" }}>
      <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {cells.map((cell) => {
          const { lat_min, lon_min, lat_max, lon_max } = cell.bounds;
          const bounds = [
            [lat_min, lon_min],
            [lat_max, lon_max],
          ];

          // For coloring, use the selected year's median
          const currentYearStats = cell.yearly_stats[selectedYear];
          const median = currentYearStats ? currentYearStats.median : 0;
          const fillColor = getColor(median, globalMin, globalMax);

          // Build chart data for all years
          const chartData = Object.entries(cell.yearly_stats)
            .map(([yr, st]) => ({
              year: yr,
              min: st.min || 0,
              q1: st.q1 || 0,
              median: st.median || 0,
              avg: st.avg || 0,
              q3: st.q3 || 0,
              max: st.max || 0,
            }))
            .sort((a, b) => a.year.localeCompare(b.year));

          return (
            <Rectangle
              key={cell.cell_id}
              bounds={bounds}
              pathOptions={{ color: fillColor, weight: 1, fillOpacity: 0.4 }}
              eventHandlers={{
                click: () => {
                  const queryParams = new URLSearchParams({
                    lat_min: String(lat_min),
                    lon_min: String(lon_min),
                    lat_max: String(lat_max),
                    lon_max: String(lon_max),
                    year: String(selectedYear),
                    sold: sold,
                    transaction: transaction
                  }).toString();
                  navigate(`/cube?${queryParams}`);
                },
              }}
            >
              <Tooltip direction="top" sticky>
                <div style={{ minWidth: 240 }}>
                  <strong>Cell {cell.cell_id}</strong>
                  <br />
                  Selected Year: {selectedYear}, median: {median.toFixed(2)} €/m²

                  {chartData.length > 0 ? (
                    <div style={{ width: 300, height: 200, marginTop: 10 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barCategoryGap="15%">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="min" fill="#8884d8" />
                          <Bar dataKey="q1" fill="#82ca9d" />
                          <Bar dataKey="median" fill="#ffc658" />
                          <Bar dataKey="avg" fill="#ff7300" />
                          <Bar dataKey="q3" fill="#d0ed57" />
                          <Bar dataKey="max" fill="#a4de6c" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div>No data available</div>
                  )}
                </div>
              </Tooltip>
            </Rectangle>
          );
        })}
      </MapContainer>

      {globalMin !== null && globalMax !== null && (
        <ColorLegend min={globalMin} max={globalMax} />
      )}
    </Box>
  );
};

export default MapView;