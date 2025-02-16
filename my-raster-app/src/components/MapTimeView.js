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

// Color function for time-to-close (green = fast, red = slow)
function getTimeColor(median, min, max) {
  if (median == null || min == null || max == null) return "#808080";
  const clamped = Math.min(Math.max(median, min), max);
  const normalized = (clamped - min) / (max - min);
  // Color scheme: green for fast sales (low numbers), red for slow sales
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
    <div style={{ fontWeight: "bold", marginBottom: 5 }}>Median Days to Close</div>
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ marginRight: 5 }}>{min.toFixed(0)} days</span>
      <div
        style={{
          flexGrow: 1,
          height: "10px",
          background: "linear-gradient(to right, #00ff00, #ff0000)",
        }}
      />
      <span style={{ marginLeft: 5 }}>{max.toFixed(0)} days</span>
    </div>
  </div>
);

const MapTimeView = ({
  center = [49.6116, 6.1319],
  gridSize = 1,
  transaction = "buy",
  year = "2023",
}) => {
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalMin, setGlobalMin] = useState(null);
  const [globalMax, setGlobalMax] = useState(null);

  const navigate = useNavigate();
  const selectedYear = parseInt(year);
  
  // The years we want to show in the graph
  const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];
  const endpointBaseUrl = "https://fastapi-athome-production.up.railway.app/raster/raster/time_to_close_stats";

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      try {
        const url = `${endpointBaseUrl}?grid_size=${gridSize}&center_lat=${center[0]}&center_lon=${center[1]}&transaction=${transaction}`;
        const response = await fetch(url);
        const result = await response.json();

        if (result.yearly_stats) {
          // Convert the yearly_stats object into our cell format
          const processedCells = [];
          
          Object.entries(result.yearly_stats).forEach(([year, cellsData]) => {
            cellsData.forEach((cell) => {
              const existingCell = processedCells.find(pc => pc.cell_id === cell.cell_id);
              
              if (existingCell) {
                existingCell.yearly_stats[year] = {
                  min: cell.statistics.q1_days,
                  q1: cell.statistics.q1_days,
                  median: cell.statistics.median_days,
                  avg: cell.statistics.avg_days,
                  q3: cell.statistics.q3_days,
                  max: cell.statistics.q3_days,
                  count: cell.statistics.count
                };
              } else {
                processedCells.push({
                  cell_id: cell.cell_id,
                  bounds: cell.bounds,
                  yearly_stats: {
                    [year]: {
                      min: cell.statistics.q1_days,
                      q1: cell.statistics.q1_days,
                      median: cell.statistics.median_days,
                      avg: cell.statistics.avg_days,
                      q3: cell.statistics.q3_days,
                      max: cell.statistics.q3_days,
                      count: cell.statistics.count
                    }
                  }
                });
              }
            });
          });

          // Calculate global min/max for the selected year
          const mediansForSelectedYear = processedCells
            .map(cell => cell.yearly_stats[selectedYear]?.median)
            .filter(median => median > 0);

          if (mediansForSelectedYear.length > 0) {
            mediansForSelectedYear.sort((a, b) => a - b);
            const lowerIndex = Math.floor(mediansForSelectedYear.length * 0.05);
            const upperIndex = Math.floor(mediansForSelectedYear.length * 0.95);
            setGlobalMin(mediansForSelectedYear[lowerIndex]);
            setGlobalMax(mediansForSelectedYear[upperIndex]);
          }

          setCells(processedCells);
        }
      } catch (err) {
        console.error("Error fetching time-to-close data:", err);
        setCells([]);
      }

      setLoading(false);
    }

    fetchData();
  }, [endpointBaseUrl, center, gridSize, transaction, selectedYear]);

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

          const currentYearStats = cell.yearly_stats[selectedYear];
          const median = currentYearStats ? currentYearStats.median : 0;
          const fillColor = getTimeColor(median, globalMin, globalMax);

          const chartData = Object.entries(cell.yearly_stats)
            .map(([yr, st]) => ({
              year: yr,
              count: st.count || 0,
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
                  Selected Year: {selectedYear}
                  <br />
                  Median time to close: {median.toFixed(0)} days
                  <br />
                  Number of sales: {currentYearStats?.count || 0}

                  {chartData.length > 0 ? (
                    <div style={{ width: 300, height: 200, marginTop: 10 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barCategoryGap="15%">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="min" name="Min Days" fill="#8884d8" />
                          <Bar dataKey="q1" name="Q1 Days" fill="#82ca9d" />
                          <Bar dataKey="median" name="Median Days" fill="#ffc658" />
                          <Bar dataKey="avg" name="Avg Days" fill="#ff7300" />
                          <Bar dataKey="q3" name="Q3 Days" fill="#d0ed57" />
                          <Bar dataKey="max" name="Max Days" fill="#a4de6c" />
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

export default MapTimeView;