// src/App.js
import React, { useState } from "react";
import MenuBar from "./components/MenuBar";
import MapView from "./components/MapView";
import MapTimeView from "./components/MapTimeView";

function App() {
  // Default values: transaction "buy", sold "sold"
  const [year, setYear] = useState(2024);
  const [transaction, setTransaction] = useState("buy");
  const [sold, setSold] = useState("sold");
  const [displayMode, setDisplayMode] = useState("immo");

  const center = [49.6116, 6.1319];
  const gridSize = 1;

  // Build the API URLs
  const immoApiUrl = `https://fastapi-athome-production.up.railway.app/raster/raster_Immo?sold=${sold}&grid_size=${gridSize}&center_lat=${center[0]}&center_lon=${center[1]}&year=${year}&transaction=${transaction}`;
  
  // Render the appropriate view based on display mode
  const renderView = () => {
    switch (displayMode) {
      case "time_to_close":
        return (
          <MapTimeView 
            center={center}
            gridSize={gridSize}
            year={year}
            transaction={transaction}
          />
        );
      case "immo":
        return (
          <MapView 
            apiUrl={immoApiUrl} 
            center={center} 
            year={year} 
            sold={sold} 
            transaction={transaction} 
          />
        );
      case "public_transport":
        // Placeholder for future implementation
        return <div>Public Transport View Coming Soon</div>;
      case "car":
        // Placeholder for future implementation
        return <div>Car Raster View Coming Soon</div>;
      default:
        return (
          <MapView 
            apiUrl={immoApiUrl} 
            center={center} 
            year={year} 
            sold={sold} 
            transaction={transaction} 
          />
        );
    }
  };

  return (
    <div>
      <MenuBar
        year={year}
        setYear={setYear}
        transaction={transaction}
        setTransaction={setTransaction}
        sold={sold}
        setSold={setSold}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
      />
      {renderView()}
    </div>
  );
}

export default App;