import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, 
  Hotel, 
  Star, 
  Navigation, 
  ExternalLink, 
  Search, 
  Calendar, 
  Users,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { useFirebase } from "./FirebaseProvider";

interface HotelData {
  id: string;
  name: string;
  rating: number;
  price: number;
  distance: string;
  image: string;
  amenities: string[];
  address: string;
}

export default function HotelFinder() {
  const { familyData } = useFirebase();
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);
  const [bookingStep, setBookingStep] = useState<"list" | "details" | "success">("list");

  const serviceZip = familyData?.preferences?.zip || "62704";
  const serviceCity = familyData?.preferences?.city || "Springfield";

  useEffect(() => {
    // Simulate API call to find hotels near the zip code
    const timer = setTimeout(() => {
      const mockHotels: HotelData[] = [
        {
          id: "1",
          name: "The Grand Heritage Hotel",
          rating: 4.8,
          price: 189,
          distance: "0.8 miles from service",
          image: "https://picsum.photos/seed/hotel1/800/600",
          amenities: ["Free Breakfast", "Pool", "Shuttle Service", "Quiet Zone"],
          address: "452 Heritage Way, " + serviceCity
        },
        {
          id: "2",
          name: "Serenity Suites",
          rating: 4.5,
          price: 145,
          distance: "1.2 miles from service",
          image: "https://picsum.photos/seed/hotel2/800/600",
          amenities: ["Kitchenette", "Free WiFi", "Pet Friendly"],
          address: "120 Serenity Lane, " + serviceCity
        },
        {
          id: "3",
          name: "Comfort Inn & Suites",
          rating: 4.2,
          price: 110,
          distance: "2.5 miles from service",
          image: "https://picsum.photos/seed/hotel3/800/600",
          amenities: ["Free Parking", "Breakfast Included", "Gym"],
          address: "888 Comfort Blvd, " + serviceCity
        }
      ];
      setHotels(mockHotels);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [serviceCity]);

  const handleBook = (hotel: HotelData) => {
    setSelectedHotel(hotel);
    setBookingStep("details");
  };

  const confirmBooking = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setBookingStep("success");
    }, 2000);
  };

  if (bookingStep === "success") {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto py-20 text-center"
      >
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-serif text-stone-900 mb-4">Booking Confirmed</h2>
        <p className="text-stone-500 mb-8 font-light">
          Your stay at <strong>{selectedHotel?.name}</strong> has been reserved. 
          A confirmation email has been sent to your family circle.
        </p>
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm mb-8 text-left">
          <div className="flex justify-between mb-2">
            <span className="text-stone-400 text-sm">Confirmation #</span>
            <span className="text-stone-900 font-mono font-medium uppercase">DITTO-H-{Math.random().toString(36).substring(7).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400 text-sm">Hotel</span>
            <span className="text-stone-900 font-medium">{selectedHotel?.name}</span>
          </div>
        </div>
        <button 
          onClick={() => setBookingStep("list")}
          className="px-8 py-3 bg-stone-900 text-stone-50 rounded-xl font-medium hover:bg-stone-800 transition-all"
        >
          Back to Travel
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <header className="space-y-4 max-w-2xl">
          <h1 className="text-4xl font-serif text-stone-900 tracking-tight">Travel & Lodging</h1>
          <p className="text-lg text-stone-500 font-light flex items-center gap-2">
            <MapPin size={16} className="text-stone-400" />
            Finding accommodations near {familyData?.preferences?.funeralHome || "the service"} in {serviceCity} ({serviceZip})
          </p>
        </header>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input 
              type="text" 
              placeholder="Search hotels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-200 transition-all"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin mb-4" />
          <p className="text-sm font-light">Searching nearby accommodations...</p>
        </div>
      ) : bookingStep === "list" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {hotels.map((hotel) => (
              <motion.div 
                key={hotel.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-stone-200 overflow-hidden group hover:shadow-xl transition-all duration-500"
              >
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src={hotel.image} 
                    alt={hotel.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-stone-900 flex items-center gap-1">
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                    {hotel.rating}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif text-lg text-stone-900">{hotel.name}</h3>
                    <div className="text-right">
                      <span className="text-xl font-bold text-stone-900">${hotel.price}</span>
                      <span className="text-[10px] text-stone-400 block uppercase tracking-wider">per night</span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mb-4">
                    <Navigation size={12} />
                    {hotel.distance}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {hotel.amenities.map((amenity, i) => (
                      <span key={i} className="text-[10px] bg-stone-50 text-stone-500 px-2 py-1 rounded-md border border-stone-100">
                        {amenity}
                      </span>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => handleBook(hotel)}
                    className="w-full py-3 bg-stone-900 text-stone-50 rounded-xl text-sm font-medium hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
                  >
                    Book Stay
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[2.5rem] border border-stone-200 overflow-hidden shadow-sm"
        >
          <div className="grid md:grid-cols-2">
            <div className="h-64 md:h-auto">
              <img 
                src={selectedHotel?.image} 
                alt={selectedHotel?.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-10 space-y-8">
              <button 
                onClick={() => setBookingStep("list")}
                className="text-stone-400 hover:text-stone-900 text-sm flex items-center gap-2 transition-colors"
              >
                <ArrowRight size={16} className="rotate-180" />
                Back to results
              </button>
              
              <div>
                <h2 className="text-3xl font-serif text-stone-900 mb-2">{selectedHotel?.name}</h2>
                <p className="text-stone-500 font-light">{selectedHotel?.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-stone-50 rounded-2xl">
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Check-in</p>
                  <p className="text-sm font-medium text-stone-900 flex items-center gap-2">
                    <Calendar size={14} />
                    Select Date
                  </p>
                </div>
                <div className="p-4 bg-stone-50 rounded-2xl">
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Guests</p>
                  <p className="text-sm font-medium text-stone-900 flex items-center gap-2">
                    <Users size={14} />
                    2 Adults
                  </p>
                </div>
              </div>

              <div className="border-t border-stone-100 pt-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-2xl font-bold text-stone-900">${selectedHotel?.price}</p>
                    <p className="text-xs text-stone-400">Total including taxes</p>
                  </div>
                  <button 
                    onClick={confirmBooking}
                    className="px-10 py-4 bg-stone-900 text-stone-50 rounded-2xl font-medium hover:bg-stone-800 transition-all shadow-lg shadow-stone-200"
                  >
                    Confirm Reservation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-stone-900 text-stone-50 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <Hotel size={24} className="text-stone-300" />
          </div>
          <div>
            <h3 className="font-serif text-lg">Group Rates Available</h3>
            <p className="text-sm text-stone-400 font-light">We can negotiate blocks of rooms for your visiting family.</p>
          </div>
        </div>
        <button className="px-6 py-3 bg-white text-stone-900 rounded-xl text-sm font-medium hover:bg-stone-100 transition-all">
          Request Group Block
        </button>
      </div>
    </div>
  );
}
