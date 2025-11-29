import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { searchRoommatesParams } from "../api/roommate";
import AsyncSelect from "react-select/async";
import CreatableSelect from "react-select/creatable";
import { City } from "country-state-city";
import Header from "../Components/Header";
import "../StyleSheets/SearchRoommates.css"; 

const STORAGE_KEY = "roommateFilters";
const RESULTS_KEY = "roommateResults";

export default function ViewRoommates() {
  const { city: routeCity } = useParams();
  const navigate = useNavigate();
  const hasSearchedRef = useRef(false);

  // Get user from localStorage or context
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const imagePrefs = [
    { key: "nightOwl", label: "Night Owl", img: "/nightOwl.png" },
    { key: "earlybird", label: "Early Bird", img: "/earlybird.png" },
    { key: "studious", label: "Studious", img: "/studious.png" },
    { key: "fitness_freak", label: "Fitness Freak", img: "/fitness_freak.png" },
    { key: "sporty", label: "Sporty", img: "/sporty.png" },
    { key: "traveller", label: "Traveller", img: "/traveller.png" },
    { key: "party_lover", label: "Party Lover", img: "/party_lover.png" },
    { key: "music_lover", label: "Music Lover", img: "/music_lover.png" },
    { key: "Pet_lover", label: "Pet Lover", img: "/pet_lover.png" },
  ];

  const defaultFilters = {
    city: "",
    gender: "Any",
    minAge: "",
    maxAge: "",
    foodPreference: "Any",
    hobbies: [], 
    description: "",
    religion: "",
    alcohol: false,
    smoking: false,
    nationality: "",
    professionalStatus: "Any",
    maritalStatus: "Any",
    family: null,
    language: "",
    allergies: [],
    minStayDuration: "",
    nightOwl: false,
    earlybird: false,
    Pet_lover: false,
    fitness_freak: false,
    studious: false,
    party_lover: false,
    sporty: false,       
    traveller: false,    
    music_lover: false,  
  };

  // Load filters from localStorage on mount
  const getInitialFilters = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultFilters, ...parsed };
      }
    } catch (err) {
      console.error("Error loading filters from localStorage:", err);
    }
    return defaultFilters;
  };

  // Load cached results from localStorage
  const getInitialResults = () => {
    try {
      const saved = localStorage.getItem(RESULTS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error("Error loading results from localStorage:", err);
    }
    return [];
  };

  const [filters, setFilters] = useState(getInitialFilters);
  const [results, setResults] = useState(getInitialResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Initialize selectedCity from saved filters
  const getInitialCity = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.city) {
          return { value: parsed.city, label: parsed.city };
        }
      }
    } catch (err) {
      console.error("Error loading city from localStorage:", err);
    }
    return null;
  };
  
  const [selectedCity, setSelectedCity] = useState(getInitialCity);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (err) {
      console.error("Error saving filters to localStorage:", err);
    }
  }, [filters]);

  // Save results to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
    } catch (err) {
      console.error("Error saving results to localStorage:", err);
    }
  }, [results]);

  // Auto-search on mount if filters exist
  useEffect(() => {
    const savedFilters = getInitialFilters();
    
    // If routeCity exists, it takes priority
    if (routeCity) {
      setSelectedCity({ value: routeCity, label: routeCity });
      setFilters((s) => ({ ...s, city: routeCity }));
      setTimeout(() => submit({ preventDefault: () => {} }), 0);
      hasSearchedRef.current = true;
    } 
    // Otherwise, if we have saved filters with a city and haven't searched yet
    else if (savedFilters.city && savedFilters.city.trim() !== "" && !hasSearchedRef.current) {
      // Only auto-search if we don't already have cached results
      const cachedResults = getInitialResults();
      if (cachedResults.length === 0) {
        setTimeout(() => submit({ preventDefault: () => {} }), 0);
      }
      hasSearchedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCity]);

  // General Change Handler
  const handleChange = (k) => (e) => {
    const target = e.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setFilters((s) => ({ ...s, [k]: value }));
  };

  // Specific Toggle Handler for Icon Grid
  const togglePref = (key) => {
    setFilters((s) => ({ ...s, [key]: !s[key] }));
  };

  // City loader function for AsyncSelect
  const loadCityOptions = (inputValue, callback) => {
    const allCities = City.getCitiesOfCountry("IN");
    const filtered = allCities
      .filter((c) =>
        c.name.toLowerCase().includes((inputValue || "").toLowerCase())
      )
      .slice(0, 20)
      .map((c) => ({ label: c.name, value: c.name }));
    callback(filtered);
  };

  // Validation
  const validateFilters = () => {
    if (!selectedCity?.value || selectedCity.value.trim() === "") {
      return "City is required";
    }

    const minAge = filters.minAge ? Number(filters.minAge) : null;
    const maxAge = filters.maxAge ? Number(filters.maxAge) : null;

    if (minAge !== null && minAge < 0) {
      return "Minimum age cannot be negative";
    }

    if (maxAge !== null && maxAge < 0) {
      return "Maximum age cannot be negative";
    }

    if (minAge !== null && maxAge !== null && minAge > maxAge) {
      return "Minimum age cannot be greater than maximum age";
    }

    const minStay = filters.minStayDuration ? Number(filters.minStayDuration) : null;
    if (minStay !== null && minStay < 0) {
      return "Minimum stay duration cannot be negative";
    }

    return null;
  };

  async function submitRoommateSearch(filtersForm) {
    const params = {
      city: (filtersForm.city || "").trim().toLowerCase(),
      gender: filtersForm.gender && filtersForm.gender !== "Any" ? filtersForm.gender : undefined,
      minAge: filtersForm.minAge ? Number(filtersForm.minAge) : undefined,
      maxAge: filtersForm.maxAge ? Number(filtersForm.maxAge) : undefined,
      foodPreference: filtersForm.foodPreference && filtersForm.foodPreference !== "Any" ? filtersForm.foodPreference : undefined,
      religion: filtersForm.religion && filtersForm.religion !== "Any" ? filtersForm.religion : undefined,
      alcohol: typeof filtersForm.alcohol === "boolean" ? filtersForm.alcohol : undefined,
      smoking: typeof filtersForm.smoking === "boolean" ? filtersForm.smoking : undefined,
      nationality: filtersForm.nationality || undefined,
      professionalStatus: filtersForm.professionalStatus && filtersForm.professionalStatus !== "Any" ? filtersForm.professionalStatus : undefined,
      maritalStatus: filtersForm.maritalStatus && filtersForm.maritalStatus !== "Any" ? filtersForm.maritalStatus : undefined,
      family: filtersForm.family !== null ? filtersForm.family : undefined,
      language: filtersForm.language || undefined,
      minStayDuration: filtersForm.minStayDuration ? Number(filtersForm.minStayDuration) : undefined,
      description: filtersForm.description || undefined,
      
      hobbies: Array.isArray(filtersForm.hobbies) && filtersForm.hobbies.length > 0 ? filtersForm.hobbies : undefined,
      allergies: Array.isArray(filtersForm.allergies) && filtersForm.allergies.length > 0 ? filtersForm.allergies : undefined,

      nightOwl: typeof filtersForm.nightOwl === "boolean" ? filtersForm.nightOwl : undefined,
      earlybird: typeof filtersForm.earlybird === "boolean" ? filtersForm.earlybird : undefined,
      Pet_lover: typeof filtersForm.Pet_lover === "boolean" ? filtersForm.Pet_lover : undefined,
      fitness_freak: typeof filtersForm.fitness_freak === "boolean" ? filtersForm.fitness_freak : undefined,
      studious: typeof filtersForm.studious === "boolean" ? filtersForm.studious : undefined,
      party_lover: typeof filtersForm.party_lover === "boolean" ? filtersForm.party_lover : undefined,
      sporty: typeof filtersForm.sporty === "boolean" ? filtersForm.sporty : undefined,
      traveller: typeof filtersForm.traveller === "boolean" ? filtersForm.traveller : undefined,
      music_lover: typeof filtersForm.music_lover === "boolean" ? filtersForm.music_lover : undefined,
    };

    Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);

    const res = await searchRoommatesParams(params);
    return res;
  }

  const submit = async (e) => {
    e?.preventDefault?.();
    
    const validationError = validateFilters();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);
    
    // Update filters with selected city
    const updatedFilters = { ...filters, city: selectedCity.value };
    
    try {
      const res = await submitRoommateSearch(updatedFilters);
      
      // Extract data from response
      let data = res?.data?.data || res?.data?.roommates || res?.data || [];
      
      // Normalize the data
      const normalized = Array.isArray(data)
        ? data.map((r) => ({
            ...r,
            hobbies: Array.isArray(r.hobbies) 
              ? r.hobbies 
              : (r.hobbies ? (typeof r.hobbies === "string" ? r.hobbies.split(",").map(s => s.trim()).filter(Boolean) : []) : []),
            allergies: Array.isArray(r.allergies) 
              ? r.allergies 
              : (r.allergies ? (typeof r.allergies === "string" ? r.allergies.split(",").map(s => s.trim()).filter(Boolean) : []) : []),
            gender: r.gender ?? r.sex ?? r.Gender ?? "",
            email: r.email ?? r.emailId ?? r.contact ?? "",
            username: r.username ?? r.name ?? r.fullName ?? "",
            description: r.description ?? r.descriptions ?? "",
            // Image from backend
            imgLink: r.imgLink || r.images || r.image || r.profilePic || []
          }))
        : [];

      setResults(normalized);
      
      if (normalized.length === 0) {
        setError("No roommates found matching these criteria");
      }
    } catch (err) {
      console.error("Roommate search error:", err);
      setError(err?.response?.data?.message || err?.message || "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSelectedCity(null);
    setResults([]);
    setError("");
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RESULTS_KEY);
    hasSearchedRef.current = false;
  };

  // Convert hobbies array to react-select format
  const hobbiesValue = Array.isArray(filters.hobbies)
    ? filters.hobbies.map((h) => ({ label: h, value: h }))
    : [];

  // Convert allergies array to react-select format
  const allergiesValue = Array.isArray(filters.allergies)
    ? filters.allergies.map((a) => ({ label: a, value: a }))
    : [];

  // Check if search button should be disabled
  const isSearchDisabled = !selectedCity?.value || loading;

  return (
    <>
      <Header 
        user={user} 
        onNavigate={navigate} 
        onLogout={handleLogout}
        active="roommate"
      />
      
      <div className="vm-page">
        <div className="vm-content-wrapper">
          
          {/* LEFT FILTERS */}
          <aside className="vm-filters-panel">
            <h2 className="vm-filters-title">Filters</h2>

            <div className="vm-btn-row" style={{marginBottom: '20px'}}>
              <button 
                className="vm-btn-primary" 
                onClick={submit} 
                disabled={isSearchDisabled}
                style={{
                  opacity: isSearchDisabled ? 0.6 : 1,
                  cursor: isSearchDisabled ? 'not-allowed' : 'pointer',
                  width: '100%'
                }}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            <div className="vm-filter-group">
              <label className="vm-filter-label">City *</label>
              <AsyncSelect
                cacheOptions
                loadOptions={loadCityOptions}
                defaultOptions
                value={selectedCity}
                onChange={(val) => {
                  setSelectedCity(val);
                  setFilters((s) => ({ ...s, city: val?.value || "" }));
                  if (val?.value) {
                    localStorage.setItem("defaultCity", val.value.trim());
                  }
                }}
                placeholder="Search for a city..."
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '40px',
                    borderRadius: '4px',
                    borderColor: '#ddd',
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                }}
              />
            </div>

            <div className="vm-filter-group">
              <label className="vm-filter-label">Gender</label>
              <select className="vm-filter-select" value={filters.gender} onChange={handleChange('gender')}>
                <option>Any</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div className="vm-filter-group">
              <div className="vm-row-inputs">
                <div style={{flex: 1}}>
                  <label className="vm-filter-label">Min age</label>
                  <input 
                    type="number"
                    className="vm-filter-input" 
                    value={filters.minAge} 
                    min="0"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || (!isNaN(Number(val)) && Number(val) >= 0)) {
                        setFilters((s) => ({ ...s, minAge: val }));
                      }
                    }}
                    placeholder="18"
                  />
                </div>
                <div style={{flex: 1}}>
                  <label className="vm-filter-label">Max age</label>
                  <input 
                    type="number"
                    className="vm-filter-input" 
                    value={filters.maxAge}
                    min="0"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || (!isNaN(Number(val)) && Number(val) >= 0)) {
                        setFilters((s) => ({ ...s, maxAge: val }));
                      }
                    }}
                    placeholder="65"
                  />
                </div>
              </div>
              {filters.minAge && filters.maxAge && Number(filters.minAge) > Number(filters.maxAge) && (
                <p style={{color: 'crimson', fontSize: '12px', marginTop: '4px'}}>
                  Min age cannot be greater than max age
                </p>
              )}
            </div>

            <div className="vm-filter-group">
              <label className="vm-filter-label">Food Preference</label>
              <select className="vm-filter-select" value={filters.foodPreference} onChange={handleChange('foodPreference')}>
                <option>Any</option>
                <option>Veg</option>
                <option>Non-Veg</option>
                <option>Vegan</option>
                <option>Jain</option>
              </select>
            </div>

            <div className="vm-filter-group">
              <label className="vm-filter-label">Hobbies</label>
              <CreatableSelect
                isMulti
                value={hobbiesValue}
                onChange={(vals) =>
                  setFilters((s) => ({ ...s, hobbies: (vals || []).map((v) => v.value) }))
                }
                options={[
                  { value: "Reading", label: "Reading" },
                  { value: "Gaming", label: "Gaming" },
                  { value: "Cooking", label: "Cooking" },
                  { value: "Sports", label: "Sports" },
                  { value: "Music", label: "Music" },
                  { value: "Travel", label: "Travel" },
                  { value: "Photography", label: "Photography" },
                  { value: "Art", label: "Art" },
                  { value: "Yoga", label: "Yoga" },
                  { value: "Dancing", label: "Dancing" },
                  { value: "Gym", label: "Gym" },
                  { value: "Movies", label: "Movies" },
                ]}
                placeholder="Select or type your hobbies..."
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '40px',
                    borderRadius: '4px',
                    borderColor: '#ddd',
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                }}
              />
            </div>

            <div className="vm-filter-group">
              <label className="vm-filter-label">Allergies</label>
              <CreatableSelect
                isMulti
                value={allergiesValue}
                onChange={(vals) =>
                  setFilters((s) => ({ ...s, allergies: (vals || []).map((v) => v.value) }))
                }
                options={[
                  { value: "Peanuts", label: "Peanuts" },
                  { value: "Dairy", label: "Dairy" },
                  { value: "Gluten", label: "Gluten" },
                  { value: "Shellfish", label: "Shellfish" },
                  { value: "Soy", label: "Soy" },
                  { value: "Eggs", label: "Eggs" },
                  { value: "Tree Nuts", label: "Tree Nuts" },
                  { value: "Fish", label: "Fish" },
                  { value: "Wheat", label: "Wheat" },
                  { value: "Dust", label: "Dust" },
                  { value: "Pollen", label: "Pollen" },
                  { value: "Pet Dander", label: "Pet Dander" },
                  { value: "Lactose", label: "Lactose" },
                ]}
                placeholder="Select or type allergies..."
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '40px',
                    borderRadius: '4px',
                    borderColor: '#ddd',
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                }}
              />
            </div>

            <div className="vm-filter-group">
              <label className="vm-filter-label" style={{marginBottom:'10px'}}>Personality</label>
              <div className="vm-pref-grid">
                {imagePrefs.map((pref) => (
                  <button
                    key={pref.key}
                    type="button"
                    className={`vm-pref-item ${filters[pref.key] ? "active" : ""}`}
                    onClick={() => togglePref(pref.key)}
                    title={pref.label}
                  >
                    <img src={pref.img} alt={pref.label} />
                    <span>{pref.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lifestyle Toggles (Alcohol, Smoking, Family) */}
            <div className="vm-filter-group">
              <label className="vm-filter-label">Lifestyle</label>
              <div className="vm-checkbox-group">
                <label className="vm-checkbox-label">
                  <input type="checkbox" checked={filters.alcohol} onChange={handleChange('alcohol')} /> 
                  Alcohol
                </label>
                <label className="vm-checkbox-label">
                  <input type="checkbox" checked={filters.smoking} onChange={handleChange('smoking')} /> 
                  Smoking
                </label>
              </div>
            </div>

            <div className="vm-filter-group">
              <label className="vm-filter-label">Has Family?</label>
              <select 
                className="vm-filter-select" 
                value={filters.family === null ? "" : (filters.family ? "Yes" : "No")} 
                onChange={(e) => {
                  if (e.target.value === "") setFilters((s) => ({ ...s, family: null }));
                  else setFilters((s) => ({ ...s, family: e.target.value === "Yes" }));
                }}
              >
                <option value="">Any</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div className="vm-filter-group">
              <label className="vm-filter-label">Min stay (months)</label>
              <input 
                type="number"
                className="vm-filter-input" 
                value={filters.minStayDuration}
                min="0"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || (!isNaN(Number(val)) && Number(val) >= 0)) {
                    setFilters((s) => ({ ...s, minStayDuration: val }));
                  }
                }}
                placeholder="6"
              />
            </div>

            <div className="vm-filter-group">
              <label className="vm-filter-label">Description</label>
              <textarea 
                className="vm-filter-input" 
                value={filters.description}
                onChange={handleChange('description')}
                placeholder="Tell potential roommates about yourself, your preferences, or what you're looking for..."
                rows="4"
                style={{
                  resize: 'vertical',
                  minHeight: '80px',
                  fontFamily: 'inherit',
                  padding: '8px'
                }}
              />
            </div>

            <div className="vm-btn-row">
              <button 
                className="vm-btn-primary" 
                onClick={submit} 
                disabled={isSearchDisabled}
                style={{
                  opacity: isSearchDisabled ? 0.6 : 1,
                  cursor: isSearchDisabled ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button className="vm-btn-secondary" onClick={resetFilters}>Reset</button>
            </div>

            {error && <div style={{color:'red',marginTop:15, textAlign:'center', fontSize:'14px'}}>{error}</div>}
          </aside>

          {/* RIGHT RESULTS */}
          <main className="vm-results-container">
            <div className="vm-results-card">
              <h2 className="vm-results-heading">Results {selectedCity?.value ? `for ${selectedCity.value}` : ''}</h2>

              {loading && <div style={{textAlign:'center', padding:20, fontStyle:'italic'}}>Searching candidates...</div>}
              
              {!loading && results.length === 0 && (
                <div className="vm-no-results">
                  No roommates found matching these criteria.
                </div>
              )}

              {results.map((t) => {
                // Get image URL from backend data
                const imageUrl = Array.isArray(t.imgLink) && t.imgLink.length > 0
                  ? t.imgLink
                  : (typeof t.imgLink === 'string' && t.imgLink)
                    ? t.imgLink
                    : "https://via.placeholder.com/150?text=No+Image";

                return (
                  <div
                    className="vm-mate-card"
                    key={t.email || Math.random()}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/roommate/${t.email}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        navigate(`/roommate/${t.email}`);
                      }
                    }}
                  >
                    <img 
                      src={imageUrl} 
                      alt={t.username || "Roommate"} 
                      className="vm-mate-img"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/150?text=No+Image";
                      }}
                    />

                    <div className="vm-mate-content">
                      <h4 className="vm-mate-name">{t.username || t.name || "Unnamed"}</h4>
                      <div className="vm-mate-details-grid">
                        <p><strong>Email:</strong> {t.email}</p>
                        <p><strong>Age:</strong> {t.age || "—"}</p>
                        <p><strong>Gender:</strong> {t.gender || "—"}</p>
                        <p><strong>Locality:</strong> {t.city || ""} {t.locality ? `• ${t.locality}` : ""}</p>
                        
                        {/* Display family status */}
                        {typeof t.family === "boolean" && (
                          <p><strong>Has Family:</strong> {t.family ? "Yes" : "No"}</p>
                        )}

                        {/* Display hobbies if available */}
                        {t.hobbies && t.hobbies.length > 0 && (
                          <p style={{gridColumn: '1 / -1'}}>
                            <strong>Hobbies:</strong> {t.hobbies.join(", ")}
                          </p>
                        )}

                        {/* Display allergies if available */}
                        {t.allergies && t.allergies.length > 0 && (
                          <p style={{gridColumn: '1 / -1'}}>
                            <strong>Allergies:</strong> {t.allergies.join(", ")}
                          </p>
                        )}
                        
                        {/* Display icons in result if they have the trait */}
                        <div style={{gridColumn: '1 / -1', display:'flex', gap:'5px', flexWrap:'wrap', marginTop:'5px'}}>
                            {imagePrefs.map(pref => t[pref.key] && (
                               <span key={pref.key} style={{fontSize:'0.75rem', background:'#eee', padding:'2px 6px', display:'flex', alignItems:'center', gap:'4px', border:'1px solid #ccc', borderRadius: '3px'}}>
                                   <img src={pref.img} alt="" style={{width:'14px', height:'14px'}}/> {pref.label}
                               </span>
                            ))}
                        </div>
                      </div>

                      {t.description && (
                        <p className="vm-mate-desc">"{t.description}"</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
