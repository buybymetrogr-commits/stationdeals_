import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2, Mail, Lock, MapPin, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { categories } from '../data/categories';
import { metroStations } from '../data/metroStations';
import { calculateDistance } from '../utils/distance';

interface RegistrationData {
  businessName: string;
  description: string;
  categoryId: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  website: string;
  email: string;
  password: string;
}

const BusinessRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);
  const isMapInitialized = React.useRef(false);
  const isMountedRef = React.useRef(true);
  
  const [formData, setFormData] = useState<RegistrationData>({
    businessName: '',
    description: '',
    categoryId: categories[0].id,
    address: '',
    lat: 40.6337,
    lng: 22.9406,
    phone: '',
    website: '',
    email: '',
    password: ''
  });

  React.useEffect(() => {
    isMountedRef.current = true;
    
    if (currentStep === 1 && mapRef.current && !isMapInitialized.current) {
      initMap();
    }

    return () => {
      isMountedRef.current = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        // Clear Leaflet's internal reference to prevent re-initialization error
        if (mapRef.current) {
          delete (mapRef.current as any)._leaflet_id;
        }
        isMapInitialized.current = false;
      }
    };
  }, [currentStep]);

  React.useEffect(() => {
    // Update marker position when coordinates change
    if (mapInstanceRef.current && markerRef.current && isMountedRef.current) {
      markerRef.current.setLatLng([formData.lat, formData.lng]);
      mapInstanceRef.current.setView([formData.lat, formData.lng], mapInstanceRef.current.getZoom());
    }
  }, [formData.lat, formData.lng]);

  const initMap = async () => {
    if (!mapRef.current || isMapInitialized.current || !isMountedRef.current) return;

    try {
      setMapLoading(true);
      
      // Import Leaflet first to ensure it's available for cleanup
      const L = await import('leaflet');
      
      // Defensive check: remove any existing Leaflet map instance
      if (mapRef.current && (mapRef.current as any)._leaflet_id) {
        try {
          // Get the existing map instance using Leaflet's internal registry
          const leafletId = (mapRef.current as any)._leaflet_id;
          const existingMap = (L as any).Util.stamp(mapRef.current);
          
          // Remove the existing map if it exists
          if ((window as any).L && (window as any).L.map && (window as any).L.map._getMapById) {
            const mapInstance = (window as any).L.map._getMapById(leafletId);
            if (mapInstance) {
              mapInstance.remove();
            }
          }
        } catch (cleanupError) {
          console.warn('Error during map cleanup:', cleanupError);
        }
        
        // Always clear the Leaflet ID
        delete (mapRef.current as any)._leaflet_id;
      }
      
      if (!mapRef.current || !isMountedRef.current) return;

      // Clear the DOM element completely to prevent Leaflet initialization errors
      mapRef.current.innerHTML = '';

      await new Promise(resolve => setTimeout(resolve, 100));

      if (!isMountedRef.current) return;

      const map = L.map(mapRef.current, {
        center: [formData.lat, formData.lng],
        zoom: 15,
        zoomControl: true,
        attributionControl: true
      });
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add metro stations to map
      metroStations.forEach(station => {
        if (station.active !== false) {
          const stationIcon = L.divIcon({
            html: `
              <div class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold shadow-lg">
                M
              </div>
            `,
            className: '',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          const stationMarker = L.marker([station.location.lat, station.location.lng], {
            icon: stationIcon,
            title: station.name
          }).addTo(map);

          stationMarker.bindPopup(`
            <div class="text-center p-2">
              <p class="font-medium text-sm">${station.name}</p>
              <p class="text-xs text-gray-600">Στάση Μετρό</p>
            </div>
          `);

          // Add 200m radius circle
          L.circle([station.location.lat, station.location.lng], {
            radius: 200,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 1
          }).addTo(map);
        }
      });

      // Create business marker
      const businessIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500 shadow-lg border-2 border-white cursor-move">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([formData.lat, formData.lng], {
        icon: businessIcon,
        draggable: true,
        title: 'Σύρετε για να αλλάξετε τη θέση'
      }).addTo(map);

      marker.on('dragend', async () => {
        if (!isMountedRef.current) return;
        
        const position = marker.getLatLng();
        setFormData(prev => ({
          ...prev,
          lat: position.lat,
          lng: position.lng
        }));

        await reverseGeocode(position.lat, position.lng);
      });

      // Click on map to place marker
      map.on('click', async (e: any) => {
        if (!isMountedRef.current) return;
        
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        
        setFormData(prev => ({
          ...prev,
          lat,
          lng
        }));

        await reverseGeocode(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      isMapInitialized.current = true;

      marker.bindPopup(`
        <div class="text-center p-2">
          <p class="font-medium text-sm">${formData.businessName || 'Νέα Επιχείρηση'}</p>
          <p class="text-xs text-gray-600">Σύρετε τον δείκτη ή κάντε κλικ στον χάρτη<br>για να αλλάξετε τη θέση</p>
        </div>
      `).openPopup();

      setTimeout(() => {
        if (isMountedRef.current && mapInstanceRef.current) {
          try {
            mapInstanceRef.current.invalidateSize();
          } catch (error) {
            console.warn('Map invalidateSize failed:', error);
          }
        }
      }, 100);

    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Σφάλμα κατά τη φόρτωση του χάρτη. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setMapLoading(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!isMountedRef.current) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=el`
      );
      const data = await response.json();
      if (data.display_name && isMountedRef.current) {
        setFormData(prev => ({
          ...prev,
          address: data.display_name
        }));
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  const handleAddressSearch = async () => {
    if (!formData.address.trim() || !isMountedRef.current) return;

    setSearchingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address + ', Θεσσαλονίκη')}&limit=1&accept-language=el`
      );
      const data = await response.json();

      if (data && data[0] && isMountedRef.current) {
        const { lat, lon: lng } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lng);
        
        setFormData(prev => ({
          ...prev,
          lat: newLat,
          lng: newLng
        }));

        if (mapInstanceRef.current && markerRef.current && isMountedRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 16);
          markerRef.current.setLatLng([newLat, newLng]);
        }
      } else {
        setError('Δεν βρέθηκε η διεύθυνση. Παρακαλώ δοκιμάστε μια πιο συγκεκριμένη διεύθυνση.');
      }
    } catch (error) {
      console.error('Error searching address:', error);
      setError('Σφάλμα κατά την αναζήτηση διεύθυνσης');
    } finally {
      setSearchingAddress(false);
    }
  };

  const checkDistanceFromMetroStations = (): boolean => {
    const businessLat = formData.lat;
    const businessLng = formData.lng;
    
    // Check if business is within 200m of any metro station
    const isWithinRange = metroStations.some(station => {
      if (station.active === false) return false;
      
      const distance = calculateDistance(
        station.location.lat,
        station.location.lng,
        businessLat,
        businessLng
      );
      
      return distance <= 200;
    });
    
    return isWithinRange;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Check if Supabase is configured
    if (!isSupabaseReady) {
      setError('🔧 Η εγγραφή επιχείρησης δεν είναι διαθέσιμη σε demo mode. Παρακαλώ συνδέστε το Supabase για πλήρη λειτουργικότητα.');
      setLoading(false);
      return;
    }

    try {
      // Check distance from metro stations
      if (!checkDistanceFromMetroStations()) {
        setError('Η επιχείρηση πρέπει να βρίσκεται σε απόσταση έως 200 μέτρων από κάποια στάση του μετρό. Παρακαλώ επιλέξτε διαφορετική τοποθεσία.');
        setLoading(false);
        return;
      }

      // Try Edge Function first, fallback to direct signup if not available
      let userCreated = false;
      
      try {
        // Create user and business via Edge Function (bypasses RLS)
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user-public`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            role: 'business',
            businessData: {
              name: formData.businessName,
              description: formData.description,
              category_id: formData.categoryId,
              address: formData.address,
              lat: formData.lat,
              lng: formData.lng,
              phone: formData.phone,
              website: formData.website
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          
          // If user already exists, try to sign in
          if (errorData.error && errorData.error.includes('already exists')) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: formData.email,
              password: formData.password
            });
            
            if (signInError) {
              if (signInError.message.includes('email_not_confirmed') || signInError.message.includes('Email not confirmed')) {
                throw new Error('Παρακαλώ επιβεβαιώστε το email σας. Ελέγξτε τα εισερχόμενά σας για το email επιβεβαίωσης.');
              }
              throw new Error('Λάθος email ή κωδικός. Παρακαλώ ελέγξτε τα στοιχεία σας.');
            }
            
            if (!signInData.user) {
              throw new Error('Αποτυχία σύνδεσης');
            }
            userCreated = true;
          } else {
            throw new Error(errorData.error || 'Αποτυχία δημιουργίας λογαριασμού');
          }
        } else {
          userCreated = true;
        }
      } catch (edgeFunctionError) {
        console.warn('Edge Function not available, using direct signup:', edgeFunctionError);
        
        // Fallback: Use direct Supabase signup
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              role: 'business'
            }
          }
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            // Try to sign in existing user
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: formData.email,
              password: formData.password
            });
            
            if (signInError) {
              if (signInError.message.includes('email_not_confirmed') || signInError.message.includes('Email not confirmed')) {
                throw new Error('Παρακαλώ επιβεβαιώστε το email σας. Ελέγξτε τα εισερχόμενά σας για το email επιβεβαίωσης.');
              }
              throw new Error('Λάθος email ή κωδικός. Παρακαλώ ελέγξτε τα στοιχεία σας.');
            }
            
            if (!signInData.user) {
              throw new Error('Αποτυχία σύνδεσης');
            }
            userCreated = true;
          } else {
            throw new Error(`Σφάλμα εγγραφής: ${signUpError.message}`);
          }
        } else if (signUpData.user) {
          userCreated = true;
        }
      }

      // If user was created/signed in successfully, sign them in if not already
      if (userCreated) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        
        if (signInError) {
          if (signInError.message.includes('email_not_confirmed') || signInError.message.includes('Email not confirmed')) {
            throw new Error('Παρακαλώ επιβεβαιώστε το email σας. Ελέγξτε τα εισερχόμενά σας για το email επιβεβαίωσης.');
          }
          throw new Error(`Σφάλμα σύνδεσης: ${signInError.message}`);
        }
        
        if (!signInData.user) {
          throw new Error('Αποτυχία σύνδεσης');
        }
      }

      // Success - redirect to dashboard
      navigate('/business-dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.businessName || !formData.categoryId || !formData.address) {
          setError('Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία');
          return false;
        }
        
        // Check distance from metro stations
        if (!checkDistanceFromMetroStations()) {
          setError('Η επιχείρηση πρέπει να βρίσκεται σε απόσταση έως 200 μέτρων από κάποια στάση του μετρό. Παρακαλώ τοποθετήστε την επιχείρηση στον χάρτη κοντά σε μια στάση.');
          return false;
        }
        break;
      case 2:
        if (!formData.email || !formData.password) {
          setError('Παρακαλώ συμπληρώστε όλα τα πεδία');
          return false;
        }
        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          setError('Παρακαλώ εισάγετε ένα έγκυρο email');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες');
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setError(null);
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Εγγραφή Επιχείρησης
            </h1>
            <div className="text-sm text-gray-500">
              Βήμα {currentStep} από 2
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Form Fields */}
                <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Όνομα Επιχείρησης
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="π.χ. Καφετέρια Κέντρο"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Κατηγορία
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Διεύθυνση
                  </label>
                  <div className="flex gap-2">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="flex-1 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="π.χ. Τσιμισκή 126, Θεσσαλονίκη"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddressSearch}
                    disabled={searchingAddress}
                    className="px-3 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors disabled:opacity-50"
                    title="Αναζήτηση στον χάρτη"
                  >
                    {searchingAddress ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Search size={20} />
                    )}
                  </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Εισάγετε τη διεύθυνση και πατήστε αναζήτηση, ή κάντε κλικ στον χάρτη
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Γεωγραφικό Πλάτος
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="40.6363"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Γεωγραφικό Μήκος
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lng}
                      onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="22.9386"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Περιγραφή
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Περιγράψτε την επιχείρησή σας..."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Τηλέφωνο
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="2310123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ιστοσελίδα
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="https://example.com"
                  />
                </div>
                </div>

                {/* Right Column - Map */}
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                      <MapPin size={16} className="mr-2" />
                      Τοποθεσία Επιχείρησης
                    </h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Η επιχείρηση πρέπει να είναι έως 200μ από στάση μετρό</li>
                      <li>• Κάντε κλικ στον χάρτη για να τοποθετήσετε την επιχείρηση</li>
                      <li>• Σύρετε τον κόκκινο δείκτη για να αλλάξετε τη θέση</li>
                      <li>• Οι μπλε κύκλοι δείχνουν την επιτρεπτή περιοχή (200μ)</li>
                    </ul>
                  </div>

                  <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100 relative">
                    {mapLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Φόρτωση χάρτη...</p>
                        </div>
                      </div>
                    )}
                    <div 
                      ref={mapRef} 
                      className="h-[400px] w-full"
                      style={{ minHeight: '400px' }}
                    />
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>📍 Κόκκινος δείκτης: Η επιχείρησή σας</p>
                    <p>🚇 Μπλε δείκτες: Στάσεις μετρό</p>
                    <p>🔵 Μπλε κύκλοι: Επιτρεπτή περιοχή (200μ από στάση)</p>
                  </div>

                  {/* Distance Check Status */}
                  <div className={`p-3 rounded-lg border ${
                    checkDistanceFromMetroStations() 
                      ? 'bg-success-50 border-success-200 text-success-800' 
                      : 'bg-accent-50 border-accent-200 text-accent-800'
                  }`}>
                    <p className="text-sm font-medium">
                      {checkDistanceFromMetroStations() 
                        ? '✅ Η τοποθεσία είναι εντός επιτρεπτής απόστασης από στάση μετρό' 
                        : '❌ Η τοποθεσία είναι πολύ μακριά από τις στάσεις μετρό (>200μ)'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Κωδικός
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Τουλάχιστον 6 χαρακτήρες
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-6">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-5 h-5 mr-1" />
                  Προηγούμενο
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-5 h-5 mr-1" />
                  Αρχική
                </button>
              )}

              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center px-6 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
                >
                  Επόμενο
                  <ArrowRight className="w-5 h-5 ml-1" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-6 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Παρακαλώ περιμένετε...' : 'Ολοκλήρωση Εγγραφής'}
                  {!loading && <ArrowRight className="w-5 h-5 ml-1" />}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BusinessRegistration;