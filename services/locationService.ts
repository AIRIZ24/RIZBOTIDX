/**
 * Location Service
 * Database lokasi kantor pusat perusahaan IDX dengan koordinat dan info lengkap
 */

export interface CompanyLocation {
  symbol: string;
  name: string;
  fullName?: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  lat: number;
  lng: number;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  description?: string;
  buildingName?: string;
  googleMapsUrl?: string;
}

// Internal interface for database entries
interface CompanyLocationData {
  symbol: string;
  name: string;
  buildingName?: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  description?: string;
}

// Helper to convert data to full CompanyLocation
const toCompanyLocation = (data: CompanyLocationData): CompanyLocation => ({
  ...data,
  fullName: data.buildingName ? `${data.name} - ${data.buildingName}` : data.name,
  lat: data.latitude,
  lng: data.longitude,
});

// Database lokasi kantor pusat perusahaan IDX
const COMPANY_LOCATIONS_DATA: Record<string, CompanyLocationData> = {
  // Banking
  'BBCA': {
    symbol: 'BBCA',
    name: 'Bank Central Asia',
    buildingName: 'Menara BCA Grand Indonesia',
    address: 'Jl. M.H. Thamrin No. 1',
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    postalCode: '10310',
    latitude: -6.1954,
    longitude: 106.8213,
    phone: '(021) 2358-8000',
    website: 'https://www.bca.co.id',
    description: 'Bank swasta terbesar di Indonesia dengan aset lebih dari Rp1.300 triliun',
  },
  'BBRI': {
    symbol: 'BBRI',
    name: 'Bank Rakyat Indonesia',
    buildingName: 'Gedung BRI 1',
    address: 'Jl. Jenderal Sudirman Kav. 44-46',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '10210',
    latitude: -6.2266,
    longitude: 106.8073,
    phone: '(021) 575-1222',
    website: 'https://www.bri.co.id',
    description: 'Bank BUMN terbesar dengan fokus pada sektor UMKM dan micro finance',
  },
  'BMRI': {
    symbol: 'BMRI',
    name: 'Bank Mandiri',
    buildingName: 'Plaza Mandiri',
    address: 'Jl. Jenderal Gatot Subroto Kav. 36-38',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12190',
    latitude: -6.2350,
    longitude: 106.8186,
    phone: '(021) 526-5045',
    website: 'https://www.bankmandiri.co.id',
    description: 'Bank BUMN dengan aset terbesar di Indonesia',
  },
  'BBNI': {
    symbol: 'BBNI',
    name: 'Bank Negara Indonesia',
    buildingName: 'Graha BNI',
    address: 'Jl. Jenderal Sudirman Kav. 1',
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    postalCode: '10220',
    latitude: -6.2001,
    longitude: 106.8236,
    phone: '(021) 251-1946',
    website: 'https://www.bni.co.id',
    description: 'Bank BUMN pertama di Indonesia sejak 1946',
  },
  
  // Telco & Infrastructure
  'TLKM': {
    symbol: 'TLKM',
    name: 'Telkom Indonesia',
    buildingName: 'Graha Merah Putih (Telkom Landmark Tower)',
    address: 'Jl. Jenderal Gatot Subroto Kav. 52',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12710',
    latitude: -6.2394,
    longitude: 106.8308,
    phone: '(021) 5215-0811',
    website: 'https://www.telkom.co.id',
    description: 'Perusahaan telekomunikasi terbesar di Indonesia',
  },
  'EXCL': {
    symbol: 'EXCL',
    name: 'XL Axiata',
    buildingName: 'XL Axiata Tower',
    address: 'Jl. HR Rasuna Said X-5 Kav. 11-12',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12950',
    latitude: -6.2249,
    longitude: 106.8362,
    phone: '(021) 576-1881',
    website: 'https://www.xl.co.id',
    description: 'Operator seluler terbesar kedua di Indonesia',
  },
  'ISAT': {
    symbol: 'ISAT',
    name: 'Indosat Ooredoo Hutchison',
    buildingName: 'Indosat Ooredoo Hutchison HQ',
    address: 'Jl. Medan Merdeka Barat No. 21',
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    postalCode: '10110',
    latitude: -6.1785,
    longitude: 106.8286,
    phone: '(021) 3869-8888',
    website: 'https://www.ioh.co.id',
    description: 'Operator telekomunikasi hasil merger Indosat dan Tri',
  },
  
  // Consumer & Retail
  'ASII': {
    symbol: 'ASII',
    name: 'Astra International',
    buildingName: 'Menara Astra',
    address: 'Jl. Jenderal Sudirman Kav. 5-6',
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    postalCode: '10220',
    latitude: -6.2045,
    longitude: 106.8192,
    phone: '(021) 508-00888',
    website: 'https://www.astra.co.id',
    description: 'Konglomerat terbesar Indonesia dengan bisnis otomotif, agribisnis, properti, dan infrastruktur',
  },
  'UNVR': {
    symbol: 'UNVR',
    name: 'Unilever Indonesia',
    buildingName: 'Grha Unilever',
    address: 'BSD Green Office Park Kav. 3',
    city: 'Tangerang Selatan',
    province: 'Banten',
    postalCode: '15345',
    latitude: -6.2941,
    longitude: 106.6657,
    phone: '(021) 8082-1000',
    website: 'https://www.unilever.co.id',
    description: 'Produsen consumer goods terbesar dengan brand Lifebuoy, Rinso, Pepsodent, dll',
  },
  'INDF': {
    symbol: 'INDF',
    name: 'Indofood Sukses Makmur',
    buildingName: 'Indofood Tower',
    address: 'Jl. Jenderal Sudirman Kav. 76-78',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12910',
    latitude: -6.2278,
    longitude: 106.8076,
    phone: '(021) 5795-8822',
    website: 'https://www.indofood.com',
    description: 'Perusahaan makanan terbesar dengan brand Indomie, Chitato, Bimoli',
  },
  'ICBP': {
    symbol: 'ICBP',
    name: 'Indofood CBP Sukses Makmur',
    buildingName: 'Indofood Tower',
    address: 'Jl. Jenderal Sudirman Kav. 76-78',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12910',
    latitude: -6.2278,
    longitude: 106.8076,
    phone: '(021) 5795-8822',
    website: 'https://www.indofoodcbp.com',
    description: 'Anak usaha Indofood untuk segmen consumer branded products',
  },
  
  // Mining & Energy
  'ANTM': {
    symbol: 'ANTM',
    name: 'Aneka Tambang',
    buildingName: 'Gedung Aneka Tambang',
    address: 'Jl. Letjen T.B. Simatupang No. 1',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12530',
    latitude: -6.2866,
    longitude: 106.8356,
    phone: '(021) 789-1234',
    website: 'https://www.antam.com',
    description: 'BUMN pertambangan nikel, emas, dan bauksit',
  },
  'PTBA': {
    symbol: 'PTBA',
    name: 'Bukit Asam',
    buildingName: 'Menara Kadin Indonesia',
    address: 'Jl. HR Rasuna Said X-5 Kav. 2-3',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12950',
    latitude: -6.2235,
    longitude: 106.8345,
    phone: '(021) 5250-265',
    website: 'https://www.ptba.co.id',
    description: 'BUMN produsen batubara terbesar di Indonesia',
  },
  'ADRO': {
    symbol: 'ADRO',
    name: 'Adaro Energy',
    buildingName: 'Menara Karya',
    address: 'Jl. HR Rasuna Said Blok X-5 Kav. 1-2',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12950',
    latitude: -6.2242,
    longitude: 106.8355,
    phone: '(021) 521-1265',
    website: 'https://www.adaro.com',
    description: 'Perusahaan batubara swasta terbesar di Indonesia',
  },
  'INCO': {
    symbol: 'INCO',
    name: 'Vale Indonesia',
    buildingName: 'The Energy Building',
    address: 'Jl. Jenderal Sudirman Kav. 52-53, SCBD Lot 11A',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12190',
    latitude: -6.2270,
    longitude: 106.8064,
    phone: '(021) 524-9000',
    website: 'https://www.vale.com/indonesia',
    description: 'Produsen nikel terbesar di Indonesia',
  },
  'MEDC': {
    symbol: 'MEDC',
    name: 'Medco Energi Internasional',
    buildingName: 'The Energy Building',
    address: 'Jl. Jenderal Sudirman Kav. 52-53, SCBD Lot 11A',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12190',
    latitude: -6.2270,
    longitude: 106.8064,
    phone: '(021) 2995-3000',
    website: 'https://www.medcoenergi.com',
    description: 'Perusahaan minyak dan gas independen terbesar di Indonesia',
  },
  
  // Tech & Digital
  'GOTO': {
    symbol: 'GOTO',
    name: 'GoTo Gojek Tokopedia',
    buildingName: 'Pasaraya Grande (Tokopedia Tower)',
    address: 'Jl. Iskandarsyah II No. 2',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12160',
    latitude: -6.2428,
    longitude: 106.8020,
    phone: '(021) 5084-9000',
    website: 'https://www.gotocompany.com',
    description: 'Perusahaan teknologi hasil merger Gojek dan Tokopedia',
  },
  'BUKA': {
    symbol: 'BUKA',
    name: 'Bukalapak',
    buildingName: 'Metropolitan Tower',
    address: 'Jl. R.A. Kartini Kav. 14',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12430',
    latitude: -6.2605,
    longitude: 106.7819,
    phone: '(021) 5081-3333',
    website: 'https://www.bukalapak.com',
    description: 'Platform e-commerce dan mitra warung terbesar di Indonesia',
  },
  'EMTK': {
    symbol: 'EMTK',
    name: 'Elang Mahkota Teknologi',
    buildingName: 'SCTV Tower',
    address: 'Jl. Asia Afrika Lot 19',
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    postalCode: '10270',
    latitude: -6.2185,
    longitude: 106.8124,
    phone: '(021) 2793-5555',
    website: 'https://www.emtek.co.id',
    description: 'Konglomerat media dan teknologi (SCTV, Indosiar, Vidio)',
  },
  
  // Property
  'BSDE': {
    symbol: 'BSDE',
    name: 'Bumi Serpong Damai',
    buildingName: 'Sinar Mas Land Plaza',
    address: 'Jl. Grand Boulevard BSD City',
    city: 'Tangerang Selatan',
    province: 'Banten',
    postalCode: '15339',
    latitude: -6.2995,
    longitude: 106.6635,
    phone: '(021) 5315-1515',
    website: 'https://www.sinarmasland.com',
    description: 'Developer BSD City dan proyek properti Sinar Mas Group',
  },
  'SMRA': {
    symbol: 'SMRA',
    name: 'Summarecon Agung',
    buildingName: 'Summarecon Serpong',
    address: 'Jl. Boulevard Gading Serpong',
    city: 'Tangerang',
    province: 'Banten',
    postalCode: '15810',
    latitude: -6.2431,
    longitude: 106.6236,
    phone: '(021) 2923-7777',
    website: 'https://www.summarecon.com',
    description: 'Developer Kelapa Gading, Serpong, dan Bekasi',
  },
  'CTRA': {
    symbol: 'CTRA',
    name: 'Ciputra Development',
    buildingName: 'Ciputra World 1',
    address: 'Jl. Prof. Dr. Satrio Kav. 3-5',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12940',
    latitude: -6.2245,
    longitude: 106.8186,
    phone: '(021) 252-1155',
    website: 'https://www.ciputra.com',
    description: 'Developer properti terkemuka dengan proyek di seluruh Indonesia',
  },
};

// Export processed COMPANY_LOCATIONS with lat/lng
export const COMPANY_LOCATIONS: Record<string, CompanyLocation> = 
  Object.fromEntries(
    Object.entries(COMPANY_LOCATIONS_DATA).map(([key, data]) => [key, toCompanyLocation(data)])
  );

/**
 * Search company locations by symbol or name (returns array)
 */
export const searchCompanyLocation = (query: string): CompanyLocation[] => {
  const upperQuery = query.toUpperCase().trim();
  const results: CompanyLocation[] = [];
  
  // If empty query, return all
  if (!upperQuery) {
    return Object.values(COMPANY_LOCATIONS);
  }
  
  // Try exact symbol match first
  if (COMPANY_LOCATIONS[upperQuery]) {
    results.push(COMPANY_LOCATIONS[upperQuery]);
  }
  
  // Try partial name match
  Object.values(COMPANY_LOCATIONS).forEach(location => {
    if (
      !results.find(r => r.symbol === location.symbol) && (
        location.name.toUpperCase().includes(upperQuery) ||
        location.buildingName?.toUpperCase().includes(upperQuery) ||
        location.symbol.includes(upperQuery)
      )
    ) {
      results.push(location);
    }
  });
  
  return results;
};

/**
 * Get company by symbol
 */
export const getCompanyBySymbol = (symbol: string): CompanyLocation | null => {
  return COMPANY_LOCATIONS[symbol.toUpperCase()] || null;
};

/**
 * Get all company locations
 */
export const getAllLocations = (): CompanyLocation[] => {
  return Object.values(COMPANY_LOCATIONS);
};

/**
 * Get Google Maps URL for a location by symbol
 */
export const getGoogleMapsUrl = (symbolOrLocation: string | CompanyLocation): string => {
  if (typeof symbolOrLocation === 'string') {
    const location = COMPANY_LOCATIONS[symbolOrLocation.toUpperCase()];
    if (!location) return '#';
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${symbolOrLocation.latitude},${symbolOrLocation.longitude}`;
};

/**
 * Get Google Maps Embed URL for iframe
 */
export const getGoogleMapsEmbedUrl = (location: CompanyLocation): string => {
  const query = encodeURIComponent(`${location.buildingName || location.name}, ${location.address}, ${location.city}`);
  return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6CE&q=${query}`;
};

/**
 * Get static map image URL
 */
export const getStaticMapUrl = (location: CompanyLocation, width = 600, height = 300): string => {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${location.latitude},${location.longitude}&zoom=16&size=${width}x${height}&markers=color:red%7C${location.latitude},${location.longitude}`;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Get nearby companies from a location by symbol
 */
export const getNearbyCompanies = (
  symbolOrLat: string | number, 
  lngOrRadius?: number, 
  radiusKm: number = 5
): CompanyLocation[] => {
  let baseLat: number;
  let baseLng: number;
  let radius: number;

  if (typeof symbolOrLat === 'string') {
    // Called with symbol
    const baseLocation = COMPANY_LOCATIONS[symbolOrLat.toUpperCase()];
    if (!baseLocation) return [];
    baseLat = baseLocation.latitude;
    baseLng = baseLocation.longitude;
    radius = lngOrRadius || 5;
  } else {
    // Called with coordinates
    baseLat = symbolOrLat;
    baseLng = lngOrRadius!;
    radius = radiusKm;
  }

  return Object.values(COMPANY_LOCATIONS)
    .map(location => ({
      location,
      distance: calculateDistance(baseLat, baseLng, location.latitude, location.longitude)
    }))
    .filter(item => item.distance > 0 && item.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .map(item => item.location);
};

/**
 * Get companies by city name
 */
export const getCompaniesByCity = (cityName?: string): CompanyLocation[] => {
  if (!cityName) {
    return Object.values(COMPANY_LOCATIONS);
  }
  
  const upperCity = cityName.toUpperCase();
  return Object.values(COMPANY_LOCATIONS).filter(location => 
    location.city.toUpperCase().includes(upperCity)
  );
};

export default {
  COMPANY_LOCATIONS,
  searchCompanyLocation,
  getCompanyBySymbol,
  getAllLocations,
  getGoogleMapsUrl,
  getGoogleMapsEmbedUrl,
  getStaticMapUrl,
  calculateDistance,
  getNearbyCompanies,
  getCompaniesByCity,
};