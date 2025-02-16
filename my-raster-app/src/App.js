// src/App.js
import React, { useState } from "react";
import MenuBar from "./components/MenuBar";
import MapView from "./components/MapView";

function App() {
  // Default values: transaction "buy", sold "sold"
  const [year, setYear] = useState(2024);
  const [transaction, setTransaction] = useState("buy");
  const [sold, setSold] = useState("sold");
  const [displayMode, setDisplayMode] = useState("immo");

  const center = [49.6116, 6.1319];
  const gridSize = 1;

  // Build the API URL using the default parameters.
  // Replace 'raster_Immo' with your own endpoint name if necessary.
  const apiUrl = `https://fastapi-athome-production.up.railway.app/raster/raster_Immo?sold=${sold}&grid_size=${gridSize}&center_lat=${center[0]}&center_lon=${center[1]}&year=${year}&transaction=${transaction}`;

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
      {/* Pass year, sold, transaction as well, so MapView can navigate with them */}
      <MapView apiUrl={apiUrl} center={center} year={year} sold={sold} transaction={transaction} />
    </div>
  );
}

export default App;
