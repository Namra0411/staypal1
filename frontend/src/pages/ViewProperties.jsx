import React, { useEffect, useState } from "react";
import Filters from "../Components/Filters";
import { fetchproperty } from "../api/filters";
import Header from "../Components/Header";
import "../StyleSheets/ViewProperty.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Helper: Generate stable key from filters
const generateFilterKey = (filters) => {
  const normalized = {
    city: filters.city || "",
    locality: filters.locality || "",
    BHK: filters.BHK || "",
    rentLowerBound: filters.rentLowerBound ?? 0,
    rentUpperBound: filters.rentUpperBound ?? 100000,
    furnishingType: filters.furnishingType || "",
    areaSize: filters.areaSize || "",
    transportAvailability: filters.transportAvailability ?? "",
    houseType: filters.houseType || "",
    nearbyPlaces: Array.isArray(filters.nearbyPlaces) 
      ? filters.nearbyPlaces.sort().join(",") 
      : filters.nearbyPlaces || "",
    description: filters.description || "",
    googleLink: filters.googleLink || "",
  };
  return JSON.stringify(normalized);
};

const ViewProperties = ({ defaultCity }) => {
  const [houses, setHouses] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const userKey = user ? user.email : "guest";
  const cacheKey = `propertyResults_${userKey}`;
  const filterCacheKey = `lastAppliedFilters_${userKey}`;

  // INITIAL CITY SELECTION
  const initialCity =
    location.state?.city ||
    defaultCity ||
    localStorage.getItem("defaultCity") ||
    "";

  const [currentCity, setCurrentCity] = useState(initialCity);
  const [lastFilterKey, setLastFilterKey] = useState("");

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // RESTORE CACHED RESULTS ON MOUNT
  useEffect(() => {
    try {
      const cachedResults = localStorage.getItem(cacheKey);
      const cachedFilters = localStorage.getItem(filterCacheKey);

      if (cachedResults && cachedFilters) {
        const parsedResults = JSON.parse(cachedResults);
        const parsedFilters = JSON.parse(cachedFilters);

        // Restore results and filter state
        setHouses(parsedResults.houses || []);
        setCurrentCity(parsedFilters.city || initialCity);
        setLastFilterKey(generateFilterKey(parsedFilters));

        
        console.log(" Restored cached results:", parsedResults.houses.length, "properties");
        return; // Skip initial load if we have cache
      }
    } catch (e) {
      console.error("Error restoring cache:", e);
    }

    // If no cache, run initial load
    runInitialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // INITIAL LOAD (only runs if no cache)
  const runInitialLoad = async () => {
    if (!initialCity) return;

    const perCityKey = `defaultLocality_${userKey}_${initialCity}`;
    const savedLocality = localStorage.getItem(perCityKey);

    const initialFilters = { city: initialCity };
    if (savedLocality) initialFilters.locality = savedLocality;

    await handleFilters(initialFilters);
  };

  // APPLY FILTERS
  const handleFilters = async (filters) => {
    const newFilterKey = generateFilterKey(filters);

    if (newFilterKey === lastFilterKey && houses.length > 0) {
      console.log("⚡ Filters unchanged, using cached results");
      setCurrentCity(filters.city);
      window.scrollTo(0, 0);
      return;
    }

    setLoadingResults(true);

    try {
      // Always use filters.city
      setCurrentCity(filters.city);

      // Save default city globally
      localStorage.setItem("defaultCity", filters.city);

      const finalFilters = {
        ...filters,
        city: filters.city,
      };

      const { data } = await fetchproperty(finalFilters);
      const results = data?.data || [];
      
      setHouses(results);

      // 💾 CACHE RESULTS AND FILTERS
      localStorage.setItem(cacheKey, JSON.stringify({
        houses: results,
        timestamp: Date.now()
      }));
      localStorage.setItem(filterCacheKey, JSON.stringify(finalFilters));
      setLastFilterKey(newFilterKey);

      console.log("✅ Fetched and cached", results.length, "properties");
    } catch (err) {
      console.error("Filter error:", err);
      setHouses([]);
    } finally {
      setLoadingResults(false);
    }

    window.scrollTo(0, 0);
  };

  return (
    <>
      <Header 
        user={user} 
        onNavigate={navigate} 
        onLogout={handleLogout}
        active="properties"
      />
      
      <div className="view-properties">
        <div className="view-content-wrapper">

          {/* FILTERS */}
          <div className="dashboard-filters">
            <h2 className="filters-title">Filters</h2>
            <Filters onApply={handleFilters} defaultCity={currentCity} />
          </div>

          {/* RESULTS */}
          <div className="properties-results">
            <div className="results-card">
              <h2>
                Results {loadingResults ? "(loading...)" : `for: ${currentCity}`}
              </h2>

              {houses.length === 0 ? (
                <p>No results found</p>
              ) : (
                houses.map((item, index) => (
                  <div
                    key={index}
                    className="result-item"
                    onClick={() =>
                      navigate(`/property/${item.email}/${item.name}`, {
                        state: { city: currentCity },
                      })
                    }
                  >
                    {/* IMAGE */}
                    <img
                      src={item.imgLink?.[0] || "/placeholder.png"}
                      alt="Property"
                    />

                    {/* FULL INFO */}
                    <div style={{ flex: 1 }}>
                      <h3>{item.BHK} BHK</h3>

                      <div className="extra-info-grid">
                        <p><strong>Rent:</strong> ₹{item.rent}</p>
                        <p><strong>Furnishing:</strong> {item.furnishingType}</p>
                        <p style={{ fontWeight: 600 }}>{item.city}</p>
                        <p><strong>House Type:</strong> {item.houseType}</p>
                        <p>{item.locality}</p>
                        <p><strong>Parking:</strong> {item.parkingArea}</p>
                        <p><strong>Area Size (Sq ft):</strong> {item.areaSize || "—"}</p>
                        <p><strong>Transport:</strong> {item.transportAvailability ? "Yes" : "No"}</p>
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default ViewProperties;
