// src/Routes.js
import React from "react";
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import App from "./App";
import CubeListing from "./components/CubeListing";

function AppRoutes() {
  return (
    <Routes>
      {/* Main map view */}
      <Route path="/" element={<App />} />

      {/* Cube details view for bounding box queries */}
      <Route path="/cube" element={<CubeListing />} />
    </Routes>
  );
}

export default AppRoutes;
