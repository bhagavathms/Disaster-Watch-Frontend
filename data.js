window.DISASTER_EVENTS = [

  // ─────────────────────────────────────────────
  // EARTHQUAKES  (source: USGS)
  // severity_raw = Richter magnitude
  // low <3.0 | moderate <5.0 | high <7.0 | extreme ≥7.0
  // ─────────────────────────────────────────────

  {
    event_id: "us7000n2a1", event_type: "earthquake", severity_raw: 7.3,
    severity_level: "extreme", latitude: 37.77, longitude: 143.37,
    timestamp: "2024-01-13T08:22:14Z", source: "USGS",
    depth_km: 10, alert_level: "red", tsunami: true, significance: 1200,
    place: "Off the coast of Fukushima, Japan", magnitude_type: "mww",
    mmi: 9, felt_count: 48200
  },
  {
    event_id: "us7000n2b2", event_type: "earthquake", severity_raw: 5.8,
    severity_level: "high", latitude: 35.69, longitude: 139.70,
    timestamp: "2024-02-07T14:05:33Z", source: "USGS",
    depth_km: 48, alert_level: "orange", tsunami: false, significance: 680,
    place: "Near Tokyo, Japan", magnitude_type: "mb",
    mmi: 6, felt_count: 12400
  },
  {
    event_id: "us7000n3c3", event_type: "earthquake", severity_raw: 2.4,
    severity_level: "low", latitude: 43.07, longitude: 141.36,
    timestamp: "2024-03-02T03:11:05Z", source: "USGS",
    depth_km: 15, alert_level: "green", tsunami: false, significance: 45,
    place: "Sapporo region, Hokkaido, Japan", magnitude_type: "ml",
    mmi: 2, felt_count: 120
  },
  {
    event_id: "us7000n4d4", event_type: "earthquake", severity_raw: 7.8,
    severity_level: "extreme", latitude: -0.72, longitude: 100.01,
    timestamp: "2024-01-28T22:09:44Z", source: "USGS",
    depth_km: 25, alert_level: "red", tsunami: true, significance: 1850,
    place: "West Sumatra, Indonesia", magnitude_type: "mww",
    mmi: 10, felt_count: 95000
  },
  {
    event_id: "us7000n5e5", event_type: "earthquake", severity_raw: 6.1,
    severity_level: "high", latitude: -7.54, longitude: 112.87,
    timestamp: "2024-04-15T11:33:20Z", source: "USGS",
    depth_km: 33, alert_level: "orange", tsunami: false, significance: 720,
    place: "East Java, Indonesia", magnitude_type: "mw",
    mmi: 7, felt_count: 27800
  },
  {
    event_id: "us7000n6f6", event_type: "earthquake", severity_raw: 4.3,
    severity_level: "moderate", latitude: -1.05, longitude: 119.85,
    timestamp: "2024-05-22T06:44:12Z", source: "USGS",
    depth_km: 60, alert_level: "yellow", tsunami: false, significance: 280,
    place: "Central Sulawesi, Indonesia", magnitude_type: "mb",
    mmi: 4, felt_count: 3200
  },
  {
    event_id: "us7000n7g7", event_type: "earthquake", severity_raw: 8.1,
    severity_level: "extreme", latitude: -33.45, longitude: -71.62,
    timestamp: "2024-02-14T18:57:08Z", source: "USGS",
    depth_km: 18, alert_level: "red", tsunami: true, significance: 2100,
    place: "Valparaiso, Chile", magnitude_type: "mww",
    mmi: 10, felt_count: 180000
  },
  {
    event_id: "us7000n8h8", event_type: "earthquake", severity_raw: 5.4,
    severity_level: "high", latitude: -38.14, longitude: -73.42,
    timestamp: "2024-06-03T09:28:51Z", source: "USGS",
    depth_km: 40, alert_level: "orange", tsunami: false, significance: 510,
    place: "Biobio Region, Chile", magnitude_type: "mw",
    mmi: 5, felt_count: 8900
  },
  {
    event_id: "us7000n9i9", event_type: "earthquake", severity_raw: 7.7,
    severity_level: "extreme", latitude: 37.22, longitude: 37.02,
    timestamp: "2024-02-06T01:17:34Z", source: "USGS",
    depth_km: 17, alert_level: "red", tsunami: false, significance: 1980,
    place: "Kahramanmaras, Turkey", magnitude_type: "mww",
    mmi: 10, felt_count: 310000
  },
  {
    event_id: "us7000najA", event_type: "earthquake", severity_raw: 4.7,
    severity_level: "moderate", latitude: 40.98, longitude: 29.11,
    timestamp: "2024-04-29T16:22:09Z", source: "USGS",
    depth_km: 8, alert_level: "yellow", tsunami: false, significance: 320,
    place: "Near Istanbul, Turkey", magnitude_type: "ml",
    mmi: 5, felt_count: 45000
  },
  {
    event_id: "us7000nbkB", event_type: "earthquake", severity_raw: 6.4,
    severity_level: "high", latitude: 30.74, longitude: 67.02,
    timestamp: "2024-03-11T04:45:22Z", source: "USGS",
    depth_km: 22, alert_level: "orange", tsunami: false, significance: 830,
    place: "Balochistan, Pakistan", magnitude_type: "mw",
    mmi: 7, felt_count: 34500
  },
  {
    event_id: "us7000nclC", event_type: "earthquake", severity_raw: 3.9,
    severity_level: "moderate", latitude: 33.72, longitude: 73.04,
    timestamp: "2024-05-08T20:14:37Z", source: "USGS",
    depth_km: 35, alert_level: "green", tsunami: false, significance: 195,
    place: "Islamabad, Pakistan", magnitude_type: "mb",
    mmi: 3, felt_count: 1800
  },
  {
    event_id: "us7000ndmD", event_type: "earthquake", severity_raw: 7.1,
    severity_level: "extreme", latitude: 8.00, longitude: 126.65,
    timestamp: "2024-01-21T15:38:11Z", source: "USGS",
    depth_km: 30, alert_level: "red", tsunami: true, significance: 1440,
    place: "Mindanao, Philippines", magnitude_type: "mww",
    mmi: 9, felt_count: 72000
  },
  {
    event_id: "us7000nenE", event_type: "earthquake", severity_raw: 5.2,
    severity_level: "high", latitude: 14.60, longitude: 121.00,
    timestamp: "2024-06-17T07:53:29Z", source: "USGS",
    depth_km: 55, alert_level: "orange", tsunami: false, significance: 470,
    place: "Metro Manila, Philippines", magnitude_type: "mw",
    mmi: 5, felt_count: 66000
  },
  {
    event_id: "us7000nfoF", event_type: "earthquake", severity_raw: 6.8,
    severity_level: "high", latitude: 37.99, longitude: 23.73,
    timestamp: "2024-03-19T22:04:18Z", source: "USGS",
    depth_km: 14, alert_level: "red", tsunami: false, significance: 950,
    place: "Near Athens, Greece", magnitude_type: "mw",
    mmi: 8, felt_count: 58000
  },
  {
    event_id: "us7000ngpG", event_type: "earthquake", severity_raw: 4.1,
    severity_level: "moderate", latitude: 37.50, longitude: 15.09,
    timestamp: "2024-07-05T13:27:44Z", source: "USGS",
    depth_km: 12, alert_level: "yellow", tsunami: false, significance: 210,
    place: "Sicily, Italy", magnitude_type: "ml",
    mmi: 4, felt_count: 2900
  },
  {
    event_id: "us7000nhqH", event_type: "earthquake", severity_raw: 7.2,
    severity_level: "extreme", latitude: 27.70, longitude: 85.32,
    timestamp: "2024-04-25T06:11:25Z", source: "USGS",
    depth_km: 15, alert_level: "red", tsunami: false, significance: 1600,
    place: "Kathmandu Valley, Nepal", magnitude_type: "mww",
    mmi: 9, felt_count: 124000
  },
  {
    event_id: "us7000nirI", event_type: "earthquake", severity_raw: 5.6,
    severity_level: "high", latitude: 35.69, longitude: 51.42,
    timestamp: "2024-08-12T09:42:58Z", source: "USGS",
    depth_km: 10, alert_level: "orange", tsunami: false, significance: 610,
    place: "Tehran region, Iran", magnitude_type: "mw",
    mmi: 6, felt_count: 19200
  },
  {
    event_id: "us7000njsJ", event_type: "earthquake", severity_raw: 2.8,
    severity_level: "low", latitude: 19.43, longitude: -99.13,
    timestamp: "2024-09-03T18:55:41Z", source: "USGS",
    depth_km: 65, alert_level: "green", tsunami: false, significance: 38,
    place: "Mexico City, Mexico", magnitude_type: "ml",
    mmi: 2, felt_count: 890
  },
  {
    event_id: "us7000nktK", event_type: "earthquake", severity_raw: 6.5,
    severity_level: "high", latitude: 38.27, longitude: 140.87,
    timestamp: "2024-10-19T11:07:33Z", source: "USGS",
    depth_km: 40, alert_level: "orange", tsunami: false, significance: 870,
    place: "Sendai, Japan", magnitude_type: "mw",
    mmi: 7, felt_count: 41000
  },
  {
    event_id: "us7000nluL", event_type: "earthquake", severity_raw: 3.5,
    severity_level: "moderate", latitude: 35.24, longitude: 25.17,
    timestamp: "2024-11-11T17:30:22Z", source: "USGS",
    depth_km: 20, alert_level: "green", tsunami: false, significance: 120,
    place: "Crete, Greece", magnitude_type: "ml",
    mmi: 3, felt_count: 4200
  },

  // ─────────────────────────────────────────────
  // FIRES  (source: NASA-FIRMS)
  // severity_raw = FRP in MW
  // low <20 | moderate <50 | high <200 | extreme >=200
  // ─────────────────────────────────────────────

  {
    event_id: "FIRMS-MODIS--32.00-150.50-2024-01-15", event_type: "fire",
    severity_raw: 342, severity_level: "extreme",
    latitude: -32.00, longitude: 150.50,
    timestamp: "2024-01-15T04:30:00Z", source: "NASA-FIRMS",
    total_frp_mw: 342, area_km2: 8200, magnitude: 3.9,
    pixel_count: 1120, satellite: "Terra", instrument: "MODIS"
  },
  {
    event_id: "FIRMS-MODIS--37.50-147.00-2024-02-03", event_type: "fire",
    severity_raw: 185, severity_level: "high",
    latitude: -37.50, longitude: 147.00,
    timestamp: "2024-02-03T05:15:00Z", source: "NASA-FIRMS",
    total_frp_mw: 185, area_km2: 3400, magnitude: 3.1,
    pixel_count: 620, satellite: "Aqua", instrument: "MODIS"
  },
  {
    event_id: "FIRMS-MODIS-38.50--120.50-2024-07-28", event_type: "fire",
    severity_raw: 412, severity_level: "extreme",
    latitude: 38.50, longitude: -120.50,
    timestamp: "2024-07-28T19:00:00Z", source: "NASA-FIRMS",
    total_frp_mw: 412, area_km2: 14500, magnitude: 4.2,
    pixel_count: 2300, satellite: "Terra", instrument: "MODIS"
  },
  {
    event_id: "FIRMS-MODIS-44.00--122.00-2024-08-14", event_type: "fire",
    severity_raw: 160, severity_level: "high",
    latitude: 44.00, longitude: -122.00,
    timestamp: "2024-08-14T20:30:00Z", source: "NASA-FIRMS",
    total_frp_mw: 160, area_km2: 2800, magnitude: 2.9,
    pixel_count: 510, satellite: "Suomi-NPP", instrument: "VIIRS"
  },
  {
    event_id: "FIRMS-MODIS--3.00--52.00-2024-08-22", event_type: "fire",
    severity_raw: 520, severity_level: "extreme",
    latitude: -3.00, longitude: -52.00,
    timestamp: "2024-08-22T14:00:00Z", source: "NASA-FIRMS",
    total_frp_mw: 520, area_km2: 22000, magnitude: 4.8,
    pixel_count: 3800, satellite: "Terra", instrument: "MODIS"
  },
  {
    event_id: "FIRMS-MODIS--12.00--55.00-2024-09-10", event_type: "fire",
    severity_raw: 290, severity_level: "extreme",
    latitude: -12.00, longitude: -55.00,
    timestamp: "2024-09-10T15:30:00Z", source: "NASA-FIRMS",
    total_frp_mw: 290, area_km2: 9500, magnitude: 4.0,
    pixel_count: 1900, satellite: "Aqua", instrument: "MODIS"
  },
  {
    event_id: "FIRMS-MODIS-0.50-114.00-2024-09-18", event_type: "fire",
    severity_raw: 230, severity_level: "extreme",
    latitude: 0.50, longitude: 114.00,
    timestamp: "2024-09-18T07:00:00Z", source: "NASA-FIRMS",
    total_frp_mw: 230, area_km2: 7800, magnitude: 4.1,
    pixel_count: 1450, satellite: "NOAA-20", instrument: "VIIRS"
  },
  {
    event_id: "FIRMS-MODIS-62.00-130.00-2024-07-04", event_type: "fire",
    severity_raw: 380, severity_level: "extreme",
    latitude: 62.00, longitude: 130.00,
    timestamp: "2024-07-04T10:00:00Z", source: "NASA-FIRMS",
    total_frp_mw: 380, area_km2: 18000, magnitude: 4.5,
    pixel_count: 2900, satellite: "Suomi-NPP", instrument: "VIIRS"
  },
  {
    event_id: "FIRMS-MODIS--12.00-18.00-2024-06-28", event_type: "fire",
    severity_raw: 210, severity_level: "extreme",
    latitude: -12.00, longitude: 18.00,
    timestamp: "2024-06-28T11:00:00Z", source: "NASA-FIRMS",
    total_frp_mw: 210, area_km2: 6200, magnitude: 3.9,
    pixel_count: 1200, satellite: "Suomi-NPP", instrument: "VIIRS"
  },

  // ─────────────────────────────────────────────
  // FLOODS  (source: OpenWeather)
  // severity_raw = FMI index 0-5
  // low <1.0 | moderate <2.0 | high <3.0 | extreme >=3.0
  // ─────────────────────────────────────────────

  {
    event_id: "FLOOD-BGD-23.80-90.40-2024-07-01", event_type: "flood",
    severity_raw: 3.8, severity_level: "extreme",
    latitude: 23.80, longitude: 90.40,
    timestamp: "2024-07-01T00:00:00Z", source: "OpenWeather",
    fmi: 3.8, area_km2: 12500, depth_score: 4.1, duration_score: 3.9,
    hwm_count: 14, waterbody: "Brahmaputra", country: "Bangladesh"
  },
  {
    event_id: "FLOOD-BGD-24.90-91.90-2024-07-18", event_type: "flood",
    severity_raw: 2.5, severity_level: "high",
    latitude: 24.90, longitude: 91.90,
    timestamp: "2024-07-18T00:00:00Z", source: "OpenWeather",
    fmi: 2.5, area_km2: 4200, depth_score: 2.8, duration_score: 2.3,
    hwm_count: 7, waterbody: "Surma River", country: "Bangladesh"
  },
  {
    event_id: "FLOOD-CHN-30.50-114.30-2024-06-25", event_type: "flood",
    severity_raw: 4.2, severity_level: "extreme",
    latitude: 30.50, longitude: 114.30,
    timestamp: "2024-06-25T00:00:00Z", source: "OpenWeather",
    fmi: 4.2, area_km2: 21000, depth_score: 4.5, duration_score: 4.0,
    hwm_count: 22, waterbody: "Yangtze River", country: "China"
  },
  {
    event_id: "FLOOD-CHN-34.80-113.70-2024-07-22", event_type: "flood",
    severity_raw: 3.1, severity_level: "extreme",
    latitude: 34.80, longitude: 113.70,
    timestamp: "2024-07-22T00:00:00Z", source: "OpenWeather",
    fmi: 3.1, area_km2: 8700, depth_score: 3.3, duration_score: 2.9,
    hwm_count: 11, waterbody: "Yellow River", country: "China"
  },
  {
    event_id: "FLOOD-IND-10.00-76.30-2024-08-15", event_type: "flood",
    severity_raw: 3.6, severity_level: "extreme",
    latitude: 10.00, longitude: 76.30,
    timestamp: "2024-08-15T00:00:00Z", source: "OpenWeather",
    fmi: 3.6, area_km2: 6800, depth_score: 3.8, duration_score: 3.4,
    hwm_count: 9, waterbody: "Periyar River", country: "India"
  },
  {
    event_id: "FLOOD-IND-26.10-91.70-2024-07-10", event_type: "flood",
    severity_raw: 2.9, severity_level: "high",
    latitude: 26.10, longitude: 91.70,
    timestamp: "2024-07-10T00:00:00Z", source: "OpenWeather",
    fmi: 2.9, area_km2: 5400, depth_score: 3.0, duration_score: 2.7,
    hwm_count: 8, waterbody: "Brahmaputra", country: "India"
  },
  {
    event_id: "FLOOD-PAK-25.80-68.30-2024-08-05", event_type: "flood",
    severity_raw: 4.5, severity_level: "extreme",
    latitude: 25.80, longitude: 68.30,
    timestamp: "2024-08-05T00:00:00Z", source: "OpenWeather",
    fmi: 4.5, area_km2: 28000, depth_score: 4.8, duration_score: 4.2,
    hwm_count: 26, waterbody: "Indus River", country: "Pakistan"
  },
  {
    event_id: "FLOOD-PAK-31.50-72.30-2024-08-20", event_type: "flood",
    severity_raw: 2.3, severity_level: "high",
    latitude: 31.50, longitude: 72.30,
    timestamp: "2024-08-20T00:00:00Z", source: "OpenWeather",
    fmi: 2.3, area_km2: 3900, depth_score: 2.5, duration_score: 2.1,
    hwm_count: 6, waterbody: "Chenab River", country: "Pakistan"
  },
  {
    event_id: "FLOOD-USA-29.90--90.10-2024-05-14", event_type: "flood",
    severity_raw: 2.7, severity_level: "high",
    latitude: 29.90, longitude: -90.10,
    timestamp: "2024-05-14T00:00:00Z", source: "OpenWeather",
    fmi: 2.7, area_km2: 4600, depth_score: 2.9, duration_score: 2.5,
    hwm_count: 8, waterbody: "Mississippi River", country: "USA"
  },
  {
    event_id: "FLOOD-DEU-50.90-6.90-2024-06-04", event_type: "flood",
    severity_raw: 3.3, severity_level: "extreme",
    latitude: 50.90, longitude: 6.90,
    timestamp: "2024-06-04T00:00:00Z", source: "OpenWeather",
    fmi: 3.3, area_km2: 3200, depth_score: 3.5, duration_score: 3.1,
    hwm_count: 12, waterbody: "Rhine River", country: "Germany"
  },
  {
    event_id: "FLOOD-BRA--22.90--43.20-2024-04-01", event_type: "flood",
    severity_raw: 3.0, severity_level: "extreme",
    latitude: -22.90, longitude: -43.20,
    timestamp: "2024-04-01T00:00:00Z", source: "OpenWeather",
    fmi: 3.0, area_km2: 5100, depth_score: 3.2, duration_score: 2.8,
    hwm_count: 10, waterbody: "Guanabara Basin", country: "Brazil"
  },
  {
    event_id: "FLOOD-NGA-6.50-3.40-2024-09-12", event_type: "flood",
    severity_raw: 3.7, severity_level: "extreme",
    latitude: 6.50, longitude: 3.40,
    timestamp: "2024-09-12T00:00:00Z", source: "OpenWeather",
    fmi: 3.7, area_km2: 7200, depth_score: 3.9, duration_score: 3.5,
    hwm_count: 15, waterbody: "Lagos Lagoon", country: "Nigeria"
  },
  {
    event_id: "FLOOD-BGD-22.30-91.80-2024-06-18", event_type: "flood",
    severity_raw: 1.2, severity_level: "moderate",
    latitude: 22.30, longitude: 91.80,
    timestamp: "2024-06-18T00:00:00Z", source: "OpenWeather",
    fmi: 1.2, area_km2: 1100, depth_score: 1.4, duration_score: 1.1,
    hwm_count: 3, waterbody: "Karnaphuli River", country: "Bangladesh"
  },
  {
    event_id: "FLOOD-VNM-16.00-108.00-2024-10-15", event_type: "flood",
    severity_raw: 3.5, severity_level: "extreme",
    latitude: 16.00, longitude: 108.00,
    timestamp: "2024-10-15T00:00:00Z", source: "OpenWeather",
    fmi: 3.5, area_km2: 5800, depth_score: 3.7, duration_score: 3.3,
    hwm_count: 13, waterbody: "Thu Bon River", country: "Vietnam"
  },

  // ─────────────────────────────────────────────
  // STORMS  (source: OpenWeather)
  // severity_raw = wind speed km/h
  // low <62 | moderate <120 | high <200 | extreme >=200
  // ─────────────────────────────────────────────

  {
    event_id: "STORM-OW-15.00-125.00-2024-10-05", event_type: "storm",
    severity_raw: 240, severity_level: "extreme",
    latitude: 15.00, longitude: 125.00,
    timestamp: "2024-10-05T06:00:00Z", source: "OpenWeather",
    wind_kmh: 240, pressure_hpa: 900, humidity_pct: 95,
    rain_1h_mm: 80, beaufort_scale: 12, condition: "Typhoon",
    city_name: "Eastern Visayas", country_code: "PH"
  },
  {
    event_id: "STORM-OW-25.00-135.00-2024-09-15", event_type: "storm",
    severity_raw: 185, severity_level: "high",
    latitude: 25.00, longitude: 135.00,
    timestamp: "2024-09-15T12:00:00Z", source: "OpenWeather",
    wind_kmh: 185, pressure_hpa: 930, humidity_pct: 92,
    rain_1h_mm: 55, beaufort_scale: 12, condition: "Typhoon",
    city_name: "Okinawa", country_code: "JP"
  },
  {
    event_id: "STORM-OW-22.00-120.00-2024-08-28", event_type: "storm",
    severity_raw: 130, severity_level: "high",
    latitude: 22.00, longitude: 120.00,
    timestamp: "2024-08-28T18:00:00Z", source: "OpenWeather",
    wind_kmh: 130, pressure_hpa: 955, humidity_pct: 90,
    rain_1h_mm: 42, beaufort_scale: 11, condition: "Typhoon",
    city_name: "South Taiwan", country_code: "TW"
  },
  {
    event_id: "STORM-OW-20.00--65.00-2024-09-22", event_type: "storm",
    severity_raw: 220, severity_level: "extreme",
    latitude: 20.00, longitude: -65.00,
    timestamp: "2024-09-22T00:00:00Z", source: "OpenWeather",
    wind_kmh: 220, pressure_hpa: 912, humidity_pct: 97,
    rain_1h_mm: 90, beaufort_scale: 12, condition: "Hurricane",
    city_name: "Puerto Rico", country_code: "US"
  },
  {
    event_id: "STORM-OW-28.00--90.00-2024-08-10", event_type: "storm",
    severity_raw: 160, severity_level: "high",
    latitude: 28.00, longitude: -90.00,
    timestamp: "2024-08-10T06:00:00Z", source: "OpenWeather",
    wind_kmh: 160, pressure_hpa: 945, humidity_pct: 93,
    rain_1h_mm: 60, beaufort_scale: 12, condition: "Hurricane",
    city_name: "Gulf of Mexico", country_code: "US"
  },
  {
    event_id: "STORM-OW-22.00-91.00-2024-05-26", event_type: "storm",
    severity_raw: 210, severity_level: "extreme",
    latitude: 22.00, longitude: 91.00,
    timestamp: "2024-05-26T00:00:00Z", source: "OpenWeather",
    wind_kmh: 210, pressure_hpa: 918, humidity_pct: 96,
    rain_1h_mm: 75, beaufort_scale: 12, condition: "Cyclone",
    city_name: "Cox's Bazar", country_code: "BD"
  },
  {
    event_id: "STORM-OW-20.00-86.00-2024-05-18", event_type: "storm",
    severity_raw: 170, severity_level: "high",
    latitude: 20.00, longitude: 86.00,
    timestamp: "2024-05-18T06:00:00Z", source: "OpenWeather",
    wind_kmh: 170, pressure_hpa: 940, humidity_pct: 94,
    rain_1h_mm: 62, beaufort_scale: 12, condition: "Cyclone",
    city_name: "Odisha Coast", country_code: "IN"
  },
  {
    event_id: "STORM-OW-22.50-68.00-2024-06-12", event_type: "storm",
    severity_raw: 140, severity_level: "high",
    latitude: 22.50, longitude: 68.00,
    timestamp: "2024-06-12T00:00:00Z", source: "OpenWeather",
    wind_kmh: 140, pressure_hpa: 950, humidity_pct: 91,
    rain_1h_mm: 48, beaufort_scale: 11, condition: "Cyclone",
    city_name: "Gujarat Coast", country_code: "IN"
  },
  {
    event_id: "STORM-OW-26.00--97.00-2024-07-08", event_type: "storm",
    severity_raw: 120, severity_level: "high",
    latitude: 26.00, longitude: -97.00,
    timestamp: "2024-07-08T00:00:00Z", source: "OpenWeather",
    wind_kmh: 120, pressure_hpa: 963, humidity_pct: 89,
    rain_1h_mm: 38, beaufort_scale: 11, condition: "Hurricane",
    city_name: "South Texas", country_code: "US"
  },
  {
    event_id: "STORM-OW-12.00-116.00-2024-11-02", event_type: "storm",
    severity_raw: 195, severity_level: "high",
    latitude: 12.00, longitude: 116.00,
    timestamp: "2024-11-02T00:00:00Z", source: "OpenWeather",
    wind_kmh: 195, pressure_hpa: 922, humidity_pct: 95,
    rain_1h_mm: 70, beaufort_scale: 12, condition: "Typhoon",
    city_name: "South China Sea", country_code: "PH"
  },
  {
    event_id: "STORM-OW--20.00-130.00-2024-03-05", event_type: "storm",
    severity_raw: 155, severity_level: "high",
    latitude: -20.00, longitude: 130.00,
    timestamp: "2024-03-05T00:00:00Z", source: "OpenWeather",
    wind_kmh: 155, pressure_hpa: 947, humidity_pct: 92,
    rain_1h_mm: 55, beaufort_scale: 12, condition: "Cyclone",
    city_name: "Northwest Australia", country_code: "AU"
  },
  {
    event_id: "STORM-OW-18.00--72.00-2024-08-19", event_type: "storm",
    severity_raw: 230, severity_level: "extreme",
    latitude: 18.00, longitude: -72.00,
    timestamp: "2024-08-19T00:00:00Z", source: "OpenWeather",
    wind_kmh: 230, pressure_hpa: 905, humidity_pct: 96,
    rain_1h_mm: 85, beaufort_scale: 12, condition: "Hurricane",
    city_name: "Port-au-Prince, Haiti", country_code: "HT"
  }

];
