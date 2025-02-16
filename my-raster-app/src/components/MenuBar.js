import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
} from "@mui/material";

const MenuBar = ({
  year,
  setYear,
  transaction,
  setTransaction,
  sold,
  setSold,
  displayMode,
  setDisplayMode,
}) => {
  const yearOptions = [2025, 2024, 2023, 2022, 2021];
  const transactionOptions = ["buy", "rent", "both"];
  const soldOptions = ["sold", "unsold", "both"];
  const displayModes = [
    { value: "immo", label: "Display Immo Raster" },
    { value: "time_to_close", label: "Display Time to Close" },
    { value: "public_transport", label: "Display Public Transport" },
    { value: "car", label: "Display Car Raster" },
    { value: "other", label: "Other Mode" },
  ];

  // Determine if sold status should be shown (hide for time_to_close mode)
  const showSoldStatus = displayMode !== "time_to_close";

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          FastAPI Athome Dashboard
        </Typography>
        
        {/* Year Dropdown */}
        <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
          <InputLabel id="year-label">Year</InputLabel>
          <Select
            labelId="year-label"
            value={year}
            label="Year"
            onChange={(e) => setYear(e.target.value)}
          >
            {yearOptions.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Transaction Dropdown */}
        <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
          <InputLabel id="transaction-label">Transaction</InputLabel>
          <Select
            labelId="transaction-label"
            value={transaction}
            label="Transaction"
            onChange={(e) => setTransaction(e.target.value)}
          >
            {transactionOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Sold Dropdown - Only show if not in time_to_close mode */}
        {showSoldStatus && (
          <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="sold-label">Sold Status</InputLabel>
            <Select
              labelId="sold-label"
              value={sold}
              label="Sold Status"
              onChange={(e) => setSold(e.target.value)}
            >
              {soldOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Display Mode Buttons */}
        <Box sx={{ m: 1 }}>
          {displayModes.map((mode) => (
            <Button
              key={mode.value}
              color={displayMode === mode.value ? "secondary" : "inherit"}
              onClick={() => setDisplayMode(mode.value)}
              sx={{ 
                m: 0.5,
                textTransform: 'none',  // Prevents all-caps
                whiteSpace: 'nowrap'    // Prevents text wrapping
              }}
            >
              {mode.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default MenuBar;