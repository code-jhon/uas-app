export interface AirportEntry {
  icao: string;
  iata?: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export const COLOMBIA_AIRPORTS: AirportEntry[] = [
  { icao: 'SKBO', iata: 'BOG', name: 'El Dorado Internacional, Bogotá', country: 'CO', lat: 4.702, lng: -74.147 },
  { icao: 'SKCG', iata: 'CTG', name: 'Rafael Núñez, Cartagena', country: 'CO', lat: 10.443, lng: -75.513 },
  { icao: 'SKMD', iata: 'EOH', name: 'Olaya Herrera, Medellín', country: 'CO', lat: 6.221, lng: -75.591 },
  { icao: 'SKRG', iata: 'MDE', name: 'José María Córdova, Rionegro', country: 'CO', lat: 6.165, lng: -75.424 },
  { icao: 'SKCL', iata: 'CLO', name: 'Alfonso Bonilla Aragón, Palmira', country: 'CO', lat: 3.542, lng: -76.382 },
  { icao: 'SKBQ', iata: 'BAQ', name: 'Ernesto Cortissoz, Barranquilla', country: 'CO', lat: 10.889, lng: -74.781 },
  { icao: 'SKBU', iata: 'BGA', name: 'Palonegro, Bucaramanga', country: 'CO', lat: 7.125, lng: -73.185 },
  { icao: 'SKPE', iata: 'PEI', name: 'Matecaña, Pereira', country: 'CO', lat: 4.813, lng: -75.739 },
  { icao: 'SKUC', iata: 'AUC', name: 'Santiago Pérez, Arauca', country: 'CO', lat: 7.069, lng: -70.737 },
  { icao: 'SKUI', iata: 'UIB', name: 'El Caraño, Quibdó', country: 'CO', lat: 5.691, lng: -76.641 },
  { icao: 'SKSP', iata: 'SJE', name: 'Jorge Enrique González Torres, San José del Guaviare', country: 'CO', lat: 2.580, lng: -72.640 },
  { icao: 'SKFL', iata: 'FLA', name: 'Gustavo Artunduaga, Florencia', country: 'CO', lat: 1.589, lng: -75.564 },
  { icao: 'SKVP', iata: 'VUP', name: 'Vaupés, Mitú', country: 'CO', lat: 1.253, lng: -70.239 },
  { icao: 'SKNV', iata: 'NVA', name: 'Benito Salas, Neiva', country: 'CO', lat: 2.951, lng: -75.294 },
  { icao: 'SKIB', iata: 'IBE', name: 'Perales, Ibagué', country: 'CO', lat: 4.421, lng: -75.133 },
  { icao: 'SKTU', iata: 'TLU', name: 'Golfo de Morrosquillo, Tolú', country: 'CO', lat: 9.509, lng: -75.585 },
  { icao: 'SKMZ', iata: 'MZL', name: 'La Nubia, Manizales', country: 'CO', lat: 5.030, lng: -75.464 },
  { icao: 'SKAR', iata: 'AXM', name: 'El Edén, Armenia', country: 'CO', lat: 4.452, lng: -75.766 },
  { icao: 'SKPV', iata: 'PVA', name: 'El Embrujo, Providencia', country: 'CO', lat: 13.356, lng: -81.359 },
  { icao: 'SKSM', iata: 'SMR', name: 'Simón Bolívar, Santa Marta', country: 'CO', lat: 11.120, lng: -74.231 },
  { icao: 'SKVV', iata: 'VVC', name: 'La Vanguardia, Villavicencio', country: 'CO', lat: 4.168, lng: -73.614 },
  { icao: 'SKPQ', iata: 'EJA', name: 'Yariguíes, Barrancabermeja', country: 'CO', lat: 7.024, lng: -73.807 },
  { icao: 'SKLG', iata: 'LGT', name: 'Caucaseco, Leticia', country: 'CO', lat: -4.193, lng: -69.943 },
  // Latin America
  { icao: 'MMMX', iata: 'MEX', name: 'Benito Juárez, Ciudad de México', country: 'MX', lat: 19.436, lng: -99.072 },
  { icao: 'SBGR', iata: 'GRU', name: 'Guarulhos, São Paulo', country: 'BR', lat: -23.432, lng: -46.469 },
  { icao: 'SAEZ', iata: 'EZE', name: 'Ezeiza, Buenos Aires', country: 'AR', lat: -34.822, lng: -58.536 },
  { icao: 'SEQM', iata: 'UIO', name: 'Mariscal Sucre, Quito', country: 'EC', lat: -0.141, lng: -78.487 },
  { icao: 'SPIM', iata: 'LIM', name: 'Jorge Chávez, Lima', country: 'PE', lat: -12.022, lng: -77.114 },
  { icao: 'SCEL', iata: 'SCL', name: 'Arturo Merino Benítez, Santiago', country: 'CL', lat: -33.393, lng: -70.786 },
  { icao: 'SVMI', iata: 'CCS', name: 'Simón Bolívar, Caracas', country: 'VE', lat: 10.603, lng: -66.991 },
  { icao: 'MPTO', iata: 'PTY', name: 'Tocumen, Panamá', country: 'PA', lat: 9.072, lng: -79.383 },
  { icao: 'MROC', iata: 'SJO', name: 'Juan Santamaría, San José', country: 'CR', lat: 9.994, lng: -84.209 },
  { icao: 'MNMG', iata: 'MGA', name: 'Augusto Sandino, Managua', country: 'NI', lat: 12.142, lng: -86.168 },
  { icao: 'MUGM', iata: 'GTM', name: 'La Aurora, Guatemala', country: 'GT', lat: 14.583, lng: -90.528 },
  // USA major
  { icao: 'KATL', iata: 'ATL', name: 'Hartsfield-Jackson, Atlanta', country: 'US', lat: 33.641, lng: -84.427 },
  { icao: 'KJFK', iata: 'JFK', name: 'John F. Kennedy, Nueva York', country: 'US', lat: 40.640, lng: -73.779 },
  { icao: 'KLAX', iata: 'LAX', name: 'Los Angeles International', country: 'US', lat: 33.943, lng: -118.408 },
  { icao: 'KMIA', iata: 'MIA', name: 'Miami International', country: 'US', lat: 25.796, lng: -80.287 },
];
