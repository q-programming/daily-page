import axios from 'axios';
import i18n from '../../../i18n/i18n.ts';
import type {
    CurrentCondition,
    DailyForecast,
    HourlyForecast,
    LocationData,
    WeatherSettings,
    AirQualityData,
} from '../types/types.ts';
import { ACCUWEATHER_BASE_URL, AIRQ_BASE_URL } from '../config';

const CACHE_DURATION = 60 * 60 * 1000;

// Cache keys as constants instead of enum
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
    private readonly accuweatherApiKey: string;
    private readonly iqairApiKey: string;
    private readonly city: string;
    private locationData: LocationData | null = null;
    private locationKey: string | null = null;
    private initialized = false;

    constructor(settings: WeatherSettings) {
        this.accuweatherApiKey = settings.apiKey;
        this.iqairApiKey = settings.iqairApiKey;
        this.city = settings.city || '';
    }

    // Initialize service and get location data
    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            if (!this.city) {
                throw new Error('City name is required for initialization');
            }

            // Fetch location data first
            const locationKey = await this.getLocationKey(this.city);

            if (!locationKey) {
                throw new Error(`Location key not found for city: ${this.city}`);
            }

            this.locationKey = locationKey;

            // Get and store location details
            this.locationData = await this.getLocationDetails(this.locationKey);
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

    // Get cached location key or reinitialize if needed
    private async getActiveLocationKey(): Promise<string> {
        if (!this.initialized || !this.locationKey) {
            await this.initialize();
        }
        return this.locationKey as string;
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

    private async getLocationKey(cityName: string): Promise<string | null> {
        if (!cityName) {
            console.warn('City name is empty, cannot fetch location key');
            return Promise.resolve(null);
        }
        const cacheKey = `${CacheKey.LOCATION}${cityName.toLowerCase()}`;

        return this.getWithCache<string | null>(cacheKey, async () => {
            try {
                const response = await axios.get(
                    `${ACCUWEATHER_BASE_URL}/locations/v1/cities/search`,
                    {
                        params: {
                            apikey: this.accuweatherApiKey,
                            q: cityName,
                            language: i18n.language, // Add language parameter
                        },
                    },
                );

                if (response.data && response.data.length > 0) {
                    const location = response.data[0] as LocationData;
                    return location.Key;
                }
                return null;
            } catch (error) {
                console.error('Error fetching location key:', error);
                return null;
            }
        });
    }

    private async getLocationDetails(locationKey: string): Promise<LocationData> {
        const cacheKey = `${CacheKey.LOCATION}_details_${locationKey}`;
        return this.getWithCache<LocationData>(cacheKey, async () => {
            try {
                const response = await axios.get(
                    `${ACCUWEATHER_BASE_URL}/locations/v1/${locationKey}`,
                    {
                        params: {
                            apikey: this.accuweatherApiKey,
                            language: i18n.language,
                        },
                    },
                );

                if (response.data) {
                    return response.data as LocationData;
                }
                throw new Error('Location details not found');
            } catch (error) {
                console.error('Error fetching location details:', error);
                throw error;
            }
        });
    }

    async getCurrentConditions(): Promise<CurrentCondition | null> {
        const locationKey = await this.getActiveLocationKey();
        const cacheKey = `${CacheKey.CURRENT}${locationKey}`;

        return this.getWithCache<CurrentCondition | null>(cacheKey, async () => {
            try {
                const response = await axios.get(
                    `${ACCUWEATHER_BASE_URL}/currentconditions/v1/${locationKey}`,
                    {
                        params: {
                            apikey: this.accuweatherApiKey,
                            details: true,
                            language: i18n.language,
                        },
                    },
                );

                if (response.data && response.data.length > 0) {
                    return response.data[0] as CurrentCondition;
                }
                return null;
            } catch (error) {
                console.error('Error fetching current conditions:', error);
                return null;
            }
        });
    }

    async getDailyForecast(): Promise<DailyForecast[] | null> {
        const locationKey = await this.getActiveLocationKey();
        const cacheKey = `${CacheKey.DAILY}${locationKey}`;

        return this.getWithCache<DailyForecast[] | null>(cacheKey, async () => {
            try {
                const response = await axios.get(
                    `${ACCUWEATHER_BASE_URL}/forecasts/v1/daily/5day/${locationKey}`,
                    {
                        params: {
                            apikey: this.accuweatherApiKey,
                            metric: true,
                            language: i18n.language,
                        },
                    },
                );

                if (response.data && response.data.DailyForecasts) {
                    return response.data.DailyForecasts as DailyForecast[];
                }
                return null;
            } catch (error) {
                console.error('Error fetching daily forecast:', error);
                return null;
            }
        });
    }

    async getHourlyForecast(): Promise<HourlyForecast[] | null> {
        const locationKey = await this.getActiveLocationKey();
        const cacheKey = `${CacheKey.HOURLY}${locationKey}`;

        return this.getWithCache<HourlyForecast[] | null>(cacheKey, async () => {
            try {
                const response = await axios.get(
                    `${ACCUWEATHER_BASE_URL}/forecasts/v1/hourly/12hour/${locationKey}`,
                    {
                        params: {
                            apikey: this.accuweatherApiKey,
                            metric: true,
                            language: i18n.language,
                        },
                    },
                );

                if (response.data && response.data.length > 0) {
                    return response.data as HourlyForecast[];
                }
                return null;
            } catch (error) {
                console.error('Error fetching hourly forecast:', error);
                return null;
            }
        });
    }

    // This method fetches air quality data from IQAir API using city name instead of location key
    async getAirQuality(): Promise<AirQualityData | null> {
        await this.initialize(); // Ensure we have location data
        const locationData = await this.getLocationData();

        if (!locationData) {
            return {
                value: 0,
                category: 'Unknown',
            };
        }

        const city = locationData.LocalizedName;
        const country = locationData.Country.LocalizedName;

        const cacheKey = `${CacheKey.AIR_QUALITY}${city}_${country}`;

        return this.getWithCache<AirQualityData | null>(cacheKey, async () => {
            try {
                // Check if IQAir API key is provided
                if (!this.iqairApiKey) {
                    return {
                        value: 0,
                        category: 'Unknown',
                    };
                }

                // Use the nearest_city endpoint with proper city and country parameters
                const response = await axios.get(AIRQ_BASE_URL + '/v2/nearest_city', {
                    params: {
                        city: city,
                        country: country,
                        key: this.iqairApiKey,
                    },
                });

                // Check if the response is valid
                if (response.data && response.data.status === 'success' && response.data.data) {
                    const aqiData = response.data.data.current.pollution;
                    return {
                        value: aqiData.aqius, // US AQI standard
                        category: this.getAqiCategory(aqiData.aqius),
                    };
                }

                // If no valid data, return unknown
                return {
                    value: 0,
                    category: 'Unknown',
                };
            } catch (error) {
                console.error('Error fetching air quality from IQAir:', error);
                return {
                    value: 0,
                    category: 'Unknown',
                };
            }
        });
    }

    // Helper method to get AQI category based on US EPA standard
    public getAqiCategory(aqi: number): string {
        if (aqi <= 50) return 'Good';
        if (aqi <= 100) return 'Moderate';
        if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
        if (aqi <= 200) return 'Unhealthy';
        if (aqi <= 300) return 'Very Unhealthy';
        return 'Hazardous';
    }
}
