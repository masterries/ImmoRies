// src/components/CubeListing.js
import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  CircularProgress,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

// Base URL for images
const IMAGE_BASE_URL = "https://i1.static.athome.eu/images/annonces2/image_/";
// Base URL for links
const LINK_BASE_URL = "https://www.athome.lu";

const CubeListing = () => {
  // Read query parameters from the URL.
  const [searchParams] = useSearchParams();
  const lat_min = searchParams.get("lat_min");
  const lon_min = searchParams.get("lon_min");
  const lat_max = searchParams.get("lat_max");
  const lon_max = searchParams.get("lon_max");
  const year = searchParams.get("year") || "all";
  const sold = searchParams.get("sold") || "both";
  const transaction = searchParams.get("transaction") || "both";

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("price"); // default sort: price

  // Build the API URL using the query parameters.
  const apiUrl = `https://fastapi-athome-production.up.railway.app/raster/cube?lat_min=${lat_min}&lon_min=${lon_min}&lat_max=${lat_max}&lon_max=${lon_max}&year=${year}&sold=${sold}&transaction=${transaction}`;

  useEffect(() => {
    setLoading(true);
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        // Expecting the response to have a "data" property with an array of listings.
        const cubeData = data?.data || [];
        setListings(cubeData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching cube listing:", err);
        setLoading(false);
      });
  }, [apiUrl]);

  // Memoized sorted listings
  const sortedListings = useMemo(() => {
    // Make a copy so we don't mutate original
    const sorted = [...listings];
    // Sorting logic
    sorted.sort((a, b) => {
      if (sortBy === "price") {
        // parse to float
        const priceA = parseFloat(a.price) || 0;
        const priceB = parseFloat(b.price) || 0;
        return priceA - priceB;
      } else if (sortBy === "surface") {
        const surfaceA = parseFloat(a.characteristic_surface) || 0;
        const surfaceB = parseFloat(b.characteristic_surface) || 0;
        return surfaceA - surfaceB;
      } else if (sortBy === "createdat") {
        // createdat might be a string like "20241205T005631Z"
        // We can compare them lexically or parse to date
        // but lexical comparison with "YYYYMMDDTHH..." typically works
        const createdA = a.createdat || "";
        const createdB = b.createdat || "";
        return createdA.localeCompare(createdB);
      }
      return 0;
    });
    return sorted;
  }, [listings, sortBy]);

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!sortedListings || sortedListings.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography variant="h6">No listings found for this cube.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Listings for Cube: ({lat_min}, {lon_min}) - ({lat_max}, {lon_max}) (Year: {year})
      </Typography>

      {/* Sorting Dropdown */}
      <Box sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ width: 200 }}>
          <InputLabel id="sort-by-label">Sort By</InputLabel>
          <Select
            labelId="sort-by-label"
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="price">Price</MenuItem>
            <MenuItem value="surface">Surface</MenuItem>
            <MenuItem value="createdat">Created At</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2}>
        {sortedListings.map((listing) => (
          <Grid item xs={12} md={6} key={listing.id}>
            <ListingCard listing={listing} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CubeListing;

/** 
 * A separate component for rendering each listing card 
 * with an image gallery (prev/next), extra fields, link, etc.
 */
const ListingCard = ({ listing }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Parse price and surface as float
  const priceVal = parseFloat(listing.price) || 0;
  const surfaceVal = parseFloat(listing.characteristic_surface) || 0;
  const pricePerM2 = surfaceVal > 0 ? (priceVal / surfaceVal).toFixed(2) : "N/A";

  // Parse the media_photos field (JSON array of strings)
  let photos = [];
  if (listing.media_photos) {
    try {
      photos = JSON.parse(listing.media_photos);
    } catch (error) {
      console.error("Error parsing media_photos", error);
    }
  }

  // The link (permalink_en) if present. 
  // e.g.: /rent/office/luxembourg/id-8485190.html => => https://www.athome.lu{the path}
  const permalink = listing.permalink_en
    ? `${LINK_BASE_URL}${listing.permalink_en}`
    : null;

  const currentPhoto = photos?.[currentPhotoIndex] 
    ? IMAGE_BASE_URL + photos[currentPhotoIndex] 
    : null;

  // Handlers for image gallery
  const handleNextPhoto = () => {
    if (photos.length === 0) return;
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };
  const handlePrevPhoto = () => {
    if (photos.length === 0) return;
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <Card>
      {currentPhoto && (
        <Box sx={{ position: "relative" }}>
          <CardMedia
            component="img"
            image={currentPhoto}
            alt="Listing Photo"
            sx={{
              height: 200,
              objectFit: "cover",
            }}
          />
          {photos.length > 1 && (
            <>
              <IconButton
                onClick={handlePrevPhoto}
                sx={{ 
                  position: "absolute",
                  top: "50%",
                  left: 4,
                  transform: "translateY(-50%)",
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.9)" }
                }}
              >
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleNextPhoto}
                sx={{ 
                  position: "absolute",
                  top: "50%",
                  right: 4,
                  transform: "translateY(-50%)",
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.9)" }
                }}
              >
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      )}

      <CardContent>
        {/* Basic info */}
        <Typography variant="h6" gutterBottom>
          {listing.type} ({listing.transaction})
        </Typography>

        {/* Address */}
        <Typography variant="body2" color="text.secondary">
          {listing.address_street} <br />
          {listing.address_zip} {listing.address_city} ({listing.address_district})
        </Typography>

        {/* Price */}
        <Typography variant="body2" sx={{ mt: 1 }}>
          Price: {listing.price} € 
        </Typography>
        <Typography variant="body2">
          Surface: {listing.characteristic_surface} m²
        </Typography>
        <Typography variant="body2">
          Price/m²: {pricePerM2} €/m²
        </Typography>

        {/* Timestamps */}
        <Typography variant="body2" sx={{ mt: 1 }}>
          Created at: {listing.createdat}
        </Typography>
        <Typography variant="body2">
          Updated at: {listing.updatedat}
        </Typography>
        
        {/* If soldat is not 'NaN', show it */}
        {listing.soldat && listing.soldat !== "NaN" && (
          <Typography variant="body2">
            Sold at: {listing.soldat}
          </Typography>
        )}

        {/* External Link to athome.lu */}
        {permalink && (
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            color="primary"
            href={permalink}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Athome.lu
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
