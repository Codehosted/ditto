import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Filter, MapPin, Star, Clock, ChevronRight } from "lucide-react";

interface Suggestion {
  id: string;
  text: string;
  category: string;
}

interface Vendor {
  id: string;
  name: string;
  category: string;
  rating: number;
  distance: string;
  amenities: string[];
  address: string;
}

const VENDORS: Vendor[] = [
  { id: "1", name: "Grace Memorial Chapel", category: "Funeral Home", rating: 4.9, distance: "1.2 miles", amenities: ["Viewing Only", "Burial Arrangements", "Cremation Services", "Reception Hall"], address: "123 Serenity Ln, Springfield" },
  { id: "2", name: "Evergreen Cemetery", category: "Cemetery", rating: 4.7, distance: "3.5 miles", amenities: ["Burial Arrangements", "Mausoleum", "Pet Cemetery"], address: "456 Peace Way, Springfield" },
  { id: "3", name: "Bloom & Petal", category: "Florist", rating: 4.8, distance: "0.8 miles", amenities: ["Sympathy Bouquets", "Same-day Delivery", "Custom Arrangements"], address: "789 Flower St, Springfield" },
  { id: "4", name: "St. Jude's Cathedral", category: "Church", rating: 4.9, distance: "2.1 miles", amenities: ["Memorial Services", "Reception Hall", "Choir"], address: "101 Faith Blvd, Springfield" },
  { id: "5", name: "Restful Oaks Funeral Home", category: "Funeral Home", rating: 4.5, distance: "4.2 miles", amenities: ["Viewing Only", "Cremation Services"], address: "202 Oak Dr, Springfield" },
];

const CATEGORIES = ["Funeral Home", "Florist", "Cemetery", "Church"];
const DEFAULT_AMENITIES = ["Viewing Only", "Burial Arrangements", "Cremation Services", "Reception Hall", "Sympathy Bouquets"];
const FUNERAL_HOME_AMENITIES = ["Grief Counseling", "Pre-planning Services", "Viewing Only", "Cremation Services", "Burial Arrangements"];

export default function SmartSearch() {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [results, setResults] = useState<Vendor[]>([]);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const currentAmenities = query.toLowerCase().includes("funeral home") 
    ? FUNERAL_HOME_AMENITIES 
    : DEFAULT_AMENITIES;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 1) {
      const lowerQuery = query.toLowerCase();
      const matchedCategory = CATEGORIES.find(cat => cat.toLowerCase().includes(lowerQuery));
      if (matchedCategory) {
        setSuggestion(`Are you searching for a ${matchedCategory.toLowerCase()}?`);
      } else {
        setSuggestion(null);
      }
      setShowSuggestions(true);
    } else {
      setSuggestion(null);
      setShowSuggestions(false);
    }
  }, [query]);

  const handleSearch = () => {
    let filtered = VENDORS.filter(v => 
      v.name.toLowerCase().includes(query.toLowerCase()) || 
      v.category.toLowerCase().includes(query.toLowerCase())
    );

    if (selectedAmenities.length > 0) {
      filtered = filtered.filter(v => 
        selectedAmenities.every(amenity => v.amenities.includes(amenity))
      );
    }

    setResults(filtered);
    setShowSuggestions(false);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 relative" ref={searchRef}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-stone-900 transition-colors">
          <Search size={20} />
        </div>
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for funeral homes, florists, cemeteries..."
          className="w-full pl-14 pr-32 py-5 bg-white border border-stone-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-stone-100 focus:border-stone-400 outline-none transition-all text-lg font-light"
        />
        <div className="absolute inset-y-0 right-3 flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl transition-all flex items-center gap-2 text-sm font-medium ${selectedAmenities.length > 0 ? 'bg-stone-900 text-stone-50' : 'text-stone-500 hover:bg-stone-100'}`}
          >
            <Filter size={18} />
            {selectedAmenities.length > 0 && <span className="w-5 h-5 bg-stone-700 rounded-full flex items-center justify-center text-[10px]">{selectedAmenities.length}</span>}
          </button>
          <button 
            onClick={handleSearch}
            className="px-6 py-2.5 bg-stone-900 text-stone-50 rounded-xl text-sm font-medium hover:bg-stone-800 transition-all"
          >
            Search
          </button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestion && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-6 right-6 mt-2 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <button 
              onClick={() => {
                const cat = suggestion.split(' ').pop()?.replace('?', '');
                if (cat) setQuery(cat.charAt(0).toUpperCase() + cat.slice(1));
                handleSearch();
              }}
              className="w-full p-5 text-left flex items-center justify-between group hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-stone-900 group-hover:text-stone-50 transition-colors">
                  <Search size={18} />
                </div>
                <span className="text-stone-900 font-medium">{suggestion}</span>
              </div>
              <ChevronRight size={18} className="text-stone-300 group-hover:text-stone-900" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 bg-white border border-stone-200 rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-stone-400 uppercase tracking-widest">Filter by Amenities</h4>
                <button 
                  onClick={() => setSelectedAmenities([])}
                  className="text-xs text-stone-400 hover:text-stone-900 transition-colors underline"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentAmenities.map(amenity => (
                  <button
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                      selectedAmenities.includes(amenity)
                        ? "bg-stone-900 text-stone-50 shadow-md"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Section */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-4"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-medium text-stone-400 uppercase tracking-widest">Search Results ({results.length})</h3>
              <button onClick={() => setResults([])} className="text-stone-400 hover:text-stone-900"><X size={16} /></button>
            </div>
            <div className="grid gap-4">
              {results.map(vendor => (
                <div key={vendor.id} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-stone-400 uppercase tracking-widest font-medium bg-stone-100 px-2 py-1 rounded-full">{vendor.category}</span>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-medium">
                        <Star size={12} fill="currentColor" />
                        {vendor.rating}
                      </div>
                    </div>
                    <h4 className="text-xl font-serif text-stone-900">{vendor.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-stone-500 font-light">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        {vendor.address}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {vendor.distance}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center md:justify-end md:w-64">
                    {vendor.amenities.slice(0, 3).map(a => (
                      <span key={a} className="text-[10px] text-stone-500 bg-stone-50 border border-stone-100 px-2 py-1 rounded-md">{a}</span>
                    ))}
                    {vendor.amenities.length > 3 && <span className="text-[10px] text-stone-400">+{vendor.amenities.length - 3} more</span>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
