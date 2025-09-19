import 'leaflet/dist/leaflet.css';

// Global Leaflet setup - run once on application startup
const setupLeaflet = async () => {
  try {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    const L = await import('leaflet');
    
    // Fix Leaflet's default marker icons
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
    });
    
    // Store Leaflet globally for easier access
    (window as any).L = L;
    
    console.log('Leaflet setup completed successfully');
  } catch (error) {
    console.error('Error setting up Leaflet:', error);
  }
};

// Initialize Leaflet setup immediately
setupLeaflet();

export default setupLeaflet;