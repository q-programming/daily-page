import axios from 'axios';
import i18n from '../../../i18n/i18n.ts';
import type {
    CurrentCondition,
    DailyForecast,
    HourlyForecast,
    LocationData,
    WeatherSettings,
    AirQualityData,
    GeocodingResult,
    OpenMeteoWeatherResponse,
} from '../types/types.ts';
import {
    OPEN_METEO_FORECAST_URL,
    OPEN_METEO_GEOCODING_URL,
    OPEN_METEO_AIR_QUALITY_URL,
} from '../config';
import { getWeatherTextFromCode } from '../utils/weatherUtils.ts';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache duration

// Cache keys as constants
const CacheKey = {
    LOCATION: 'weather_location_',
    CURRENT: 'weather_current_',
    HOURLY: 'weather_hourly_',
    DAILY: 'weather_daily_',
    AIR_QUALITY: 'weather_air_quality_',
} as const;

// Cache item interface
interface CachedData<T> {
    timestamp: number;
    data: T;
}

export class WeatherService {
    private readonly city: string;
    private latitude: number | null = null;
    private longitude: number | null = null;
    private locationData: LocationData | null = null;
    private initialized = false;

    constructor(settings: WeatherSettings) {
        this.city = settings.city || '';
        this.latitude = settings.latitude || null;
        this.longitude = settings.longitude || null;
    }

    // Initialize service and get location data
    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            if (!this.city && (!this.latitude || !this.longitude)) {
                throw new Error(
                    'Either city name or coordinates (latitude/longitude) are required for initialization',
                );
            }

            // If we don't have coordinates yet but have a city name, look up the coordinates
            if ((!this.latitude || !this.longitude) && this.city) {
                const geocodingResult = await this.getGeocodingData(this.city);
                if (!geocodingResult) {
                    throw new Error(`Geocoding data not found for city: ${this.city}`);
                }
                this.latitude = geocodingResult.latitude;
                this.longitude = geocodingResult.longitude;

                // Create location data from geocoding result
                this.locationData = {
                    Key: `${geocodingResult.id}`, // Convert to string for compatibility
                    LocalizedName: geocodingResult.name,
                    Country: {
                        LocalizedName: geocodingResult.country,
                    },
                    Latitude: geocodingResult.latitude,
                    Longitude: geocodingResult.longitude,
                };
            }

            this.initialized = true;
        } catch (error) {
            console.error('Error initializing weather service:', error);
            throw error;
        }
    }

    // Get cached location data or reinitialize if needed
    public async getLocationData(): Promise<LocationData> {
        if (!this.initialized || !this.locationData) {
            await this.initialize();
        }
        return this.locationData as LocationData;
    }

    // Generic function to get cached data or fetch new data
    private async getWithCache<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
        // Try to get data from cache
        const cachedJson = localStorage.getItem(key);

        if (cachedJson) {
            try {
                const cached = JSON.parse(cachedJson) as CachedData<T>;
                const now = Date.now();

                // Check if cache is still valid
                if (now - cached.timestamp < CACHE_DURATION) {
                    console.log(`Using cached data for ${key}`);
                    return cached.data;
                } else {
                    console.log(`Cache expired for ${key}`);
                }
            } catch (error) {
                console.error('Error parsing cached data:', error);
            }
        }

        // Fetch fresh data
        console.log(`Fetching fresh data for ${key}`);
        const freshData = await fetchFn();

        // Cache the new data
        const cacheItem: CachedData<T> = {
            timestamp: Date.now(),
            data: freshData,
        };

        localStorage.setItem(key, JSON.stringify(cacheItem));
        return freshData;
    }

    // Get geocoding data for a city name
    private async getGeocodingData(cityName: string): Promise<GeocodingResult | null> {
        if (!cityName) {
            console.warn('City name is empty, cannot fetch geocoding data');
            return Promise.resolve(null);
        }

        const cacheKey = `${CacheKey.LOCATION}${cityName.toLowerCase()}`;

        return this.getWithCache<GeocodingResult | null>(cacheKey, async () => {
            try {
                const response = await axios.get(OPEN_METEO_GEOCODING_URL, {
                    params: {
                        name: cityName,
                        language: i18n.language,
                        count: 1, // We only need the top match
                    },
                });

                if (response.data && response.data.results && response.data.results.length > 0) {
                    return response.data.results[0] as GeocodingResult;
                }
                return null;
            } catch (error) {
                console.error('Error fetching geocoding data:', error);
                return null;
            }
        });
    }

    // Get all weather data (current, hourly, and daily) in one call
    private async fetchAllWeatherData(): Promise<OpenMeteoWeatherResponse | null> {
        if (!this.latitude || !this.longitude) {
            await this.initialize();
            if (!this.latitude || !this.longitude) {
                return null;
            }
        }

        const cacheKey = `weather_all_${this.latitude}_${this.longitude}`;

        return this.getWithCache<OpenMeteoWeatherResponse | null>(cacheKey, async () => {
            try {
                const response = await axios.get(OPEN_METEO_FORECAST_URL, {
                    params: {
                        latitude: this.latitude,
                        longitude: this.longitude,
                        current: 'temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code',
                        hourly: 'temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code',
                        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
                        forecast_hours: 24,
                        forecast_days: 1,
                        timezone: 'auto',
                    },
                });

                if (response.data) {
                    return response.data as OpenMeteoWeatherResponse;
                }
                return null;
            } catch (error) {
                console.error('Error fetching weather data:', error);
                return null;
            }
        });
    }

    // Convert Open-Meteo data to the AccuWeather format for compatibility
    async getCurrentConditions(): Promise<CurrentCondition | null> {
        const weatherData = await this.fetchAllWeatherData();
        if (!weatherData || !weatherData.current) {
            return null;
        }

        const current = weatherData.current;
        const weatherCode = current.weather_code || 0;

        return {
            WeatherText: getWeatherTextFromCode(weatherCode),
            WeatherIcon: weatherCode,
            Temperature: {
                Metric: {
                    Value: current.temperature_2m,
                    Unit: '°C',
                },
            },
            Wind: {
                Speed: {
                    Metric: {
                        Value: current.wind_speed_10m,
                        Unit: 'km/h',
                    },
                },
            },
            RelativeHumidity: current.relative_humidity_2m,
            UVIndex: 0, // Open-Meteo doesn't provide UV index in the basic API
        };
    }

    async getDailyForecast(): Promise<DailyForecast[] | null> {
        const weatherData = await this.fetchAllWeatherData();
        if (!weatherData || !weatherData.daily) {
            return null;
        }

        const daily = weatherData.daily;
        const forecasts: DailyForecast[] = [];

        for (let i = 0; i < daily.time.length; i++) {
            forecasts.push({
                Date: daily.time[i],
                Temperature: {
                    Minimum: {
                        Value: daily.temperature_2m_min[i],
                        Unit: '°C',
                    },
                    Maximum: {
                        Value: daily.temperature_2m_max[i],
                        Unit: '°C',
                    },
                },
            });
        }

        return forecasts;
    }

    async getHourlyForecast(): Promise<HourlyForecast[] | null> {
        const weatherData = await this.fetchAllWeatherData();
        if (!weatherData || !weatherData.hourly) {
            return null;
        }

        const hourly = weatherData.hourly;
        const forecasts: HourlyForecast[] = [];

        // We'll use 12 hours
        const hoursToShow = Math.min(12, hourly.time.length);

        for (let i = 0; i < hoursToShow; i++) {
            forecasts.push({
                DateTime: hourly.time[i],
                WeatherIcon: hourly.weather_code ? hourly.weather_code[i] : 0,
                Temperature: {
                    Value: hourly.temperature_2m[i],
                    Unit: '°C',
                },
                IconPhrase: getWeatherTextFromCode(
                    hourly.weather_code ? hourly.weather_code[i] : 0,
                ),
            });
        }

        return forecasts;
    }

    // Get air quality data from Open-Meteo
    async getAirQuality(): Promise<AirQualityData | null> {
        if (!this.latitude || !this.longitude) {
            await this.initialize();
            if (!this.latitude || !this.longitude) {
                return {
                    value: 0,
                    category: 'Unknown',
                };
            }
        }

        const cacheKey = `${CacheKey.AIR_QUALITY}${this.latitude}_${this.longitude}`;

        return this.getWithCache<AirQualityData>(cacheKey, async () => {
            try {
                const response = await axios.get(OPEN_METEO_AIR_QUALITY_URL, {
                    params: {
                        latitude: this.latitude,
                        longitude: this.longitude,
                        current: 'pm2_5,pm10,european_aqi',
                        hourly: 'pm2_5,pm10,european_aqi',
                        forecast_hours: 24,
                        timezone: 'auto',
                    },
                });

                if (
                    response.data &&
                    response.data.current &&
                    response.data.current.european_aqi !== undefined
                ) {
                    const aqiValue = response.data.current.european_aqi;

                    return {
                        value: aqiValue,
                        category: this.getAqiCategory(aqiValue),
                    };
                }

                // If we don't have European AQI but have PM2.5, estimate AQI
                if (
                    response.data &&
                    response.data.current &&
                    response.data.current.pm2_5 !== undefined
                ) {
                    // Simple estimation of AQI based on PM2.5
                    const pm25 = response.data.current.pm2_5;
                    let estimatedAqi = 0;

                    // Crude conversion from PM2.5 to European AQI (approximate)
                    if (pm25 <= 10) {
                        estimatedAqi = pm25 * 2; // 0-20 scale
                    } else if (pm25 <= 20) {
                        estimatedAqi = 20 + (pm25 - 10) * 2; // 20-40 scale
                    } else if (pm25 <= 25) {
                        estimatedAqi = 40 + (pm25 - 20) * 4; // 40-60 scale
                    } else if (pm25 <= 50) {
                        estimatedAqi = 60 + (pm25 - 25) * 0.8; // 60-80 scale
                    } else if (pm25 <= 75) {
                        estimatedAqi = 80 + (pm25 - 50) * 0.8; // 80-100 scale
                    } else {
                        estimatedAqi = 100 + (pm25 - 75) * 0.5; // >100 scale
                    }

                    return {
                        value: Math.round(estimatedAqi),
                        category: this.getAqiCategory(Math.round(estimatedAqi)),
                    };
                }

                // Fallback if API fails or changes
                console.warn('Air quality data unavailable or in unexpected format');
                return {
                    value: 0,
                    category: 'Unknown',
                };
            } catch (error) {
                console.error('Error fetching air quality from Open-Meteo:', error);
                // We don't want to fail the entire weather display because of air quality issues
                return {
                    value: 0,
                    category: 'Unknown',
                };
            }
        });
    }

    // Helper method to get AQI category based on European AQI standard
    public getAqiCategory(aqi: number): string {
        if (aqi <= 20) return 'Good';
        if (aqi <= 40) return 'Fair';
        if (aqi <= 60) return 'Moderate';
        if (aqi <= 80) return 'Poor';
        if (aqi <= 100) return 'Very Poor';
        return 'Extremely Poor';
    }
}
