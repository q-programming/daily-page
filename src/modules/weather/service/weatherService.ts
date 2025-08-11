import axios from 'axios';
import i18n from '../../../i18n/i18n.ts';
import type {
    CurrentCondition,
    DailyForecast,
    HourlyForecast,
    LocationData,
    WeatherSettings,
} from '../types/types.ts';

export const ACCUWEATHER_BASE_URL = 'https://dataservice.accuweather.com';
export const AIRQ_BASE_URL = 'https://api.airvisual.com';
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

    constructor(settings: WeatherSettings) {
        // Try to get API keys from environment variables first, then fall back to settings
        this.accuweatherApiKey = settings.apiKey || import.meta.env.VITE_ACCUWEATHER_API_KEY;
        this.iqairApiKey = settings.iqairApiKey || import.meta.env.VITE_IQAIR_API_KEY;
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

    async getLocationKey(cityName: string): Promise<string> {
        const cacheKey = `${CacheKey.LOCATION}${cityName.toLowerCase()}`;

        return this.getWithCache<string>(cacheKey, async () => {
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
                throw new Error('Location not found');
            } catch (error) {
                console.error('Error fetching location key:', error);
                throw error;
            }
        });
    }

    async getCurrentConditions(locationKey: string): Promise<CurrentCondition> {
        const cacheKey = `${CacheKey.CURRENT}${locationKey}`;

        return this.getWithCache<CurrentCondition>(cacheKey, async () => {
            try {
                const response = await axios.get(
                    `${ACCUWEATHER_BASE_URL}/currentconditions/v1/${locationKey}`,
                    {
                        params: {
                            apikey: this.accuweatherApiKey,
                            details: true,
                            language: i18n.language, // Add language parameter
                        },
                    },
                );

                if (response.data && response.data.length > 0) {
                    return response.data[0] as CurrentCondition;
                }
                throw new Error('Current conditions not found');
            } catch (error) {
                console.error('Error fetching current conditions:', error);
                throw error;
            }
        });
    }

    async getDailyForecast(locationKey: string): Promise<DailyForecast[]> {
        const cacheKey = `${CacheKey.DAILY}${locationKey}`;

        return this.getWithCache<DailyForecast[]>(cacheKey, async () => {
            try {
                const response = await axios.get(
                    `${ACCUWEATHER_BASE_URL}/forecasts/v1/daily/5day/${locationKey}`,
                    {
                        params: {
                            apikey: this.accuweatherApiKey,
                            metric: true,
                            language: i18n.language, // Add language parameter
                        },
                    },
                );

                if (response.data && response.data.DailyForecasts) {
                    return response.data.DailyForecasts as DailyForecast[];
                }
                throw new Error('Daily forecast not found');
            } catch (error) {
                console.error('Error fetching daily forecast:', error);
                throw error;
            }
        });
    }

    async getHourlyForecast(locationKey: string): Promise<HourlyForecast[]> {
        const cacheKey = `${CacheKey.HOURLY}${locationKey}`;

        return this.getWithCache<HourlyForecast[]>(cacheKey, async () => {
            try {
                const response = await axios.get(
                    `${ACCUWEATHER_BASE_URL}/forecasts/v1/hourly/12hour/${locationKey}`,
                    {
                        params: {
                            apikey: this.accuweatherApiKey,
                            metric: true,
                            language: i18n.language, // Add language parameter
                        },
                    },
                );

                if (response.data && response.data.length > 0) {
                    return response.data as HourlyForecast[];
                }
                throw new Error('Hourly forecast not found');
            } catch (error) {
                console.error('Error fetching hourly forecast:', error);
                throw error;
            }
        });
    }

    // This method fetches air quality data from IQAir API
    async getAirQuality(locationKey: string) {
        const cacheKey = `${CacheKey.AIR_QUALITY}${locationKey}`;

        return this.getWithCache(cacheKey, async () => {
            try {
                // Check if IQAir API key is provided
                if (!this.iqairApiKey) {
                    return {
                        value: 0,
                        category: 'Unknown',
                    };
                }

                // We need to get the location first
                const location = await this.getLocation(locationKey);

                // Use the nearest_city endpoint which is more reliable
                const response = await axios.get(AIRQ_BASE_URL + '/v2/nearest_city', {
                    params: {
                        city: location.LocalizedName,
                        state: '', // IQAir sometimes requires state, but we can leave it empty
                        country: location.Country.LocalizedName,
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
                // Instead of falling back to AccuWeather (which has CORS issues),
                // return a default value
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

    async getLocation(locationKey: string): Promise<LocationData> {
        const cacheKey = `${CacheKey.LOCATION}_details_${locationKey}`;

        return this.getWithCache<LocationData>(cacheKey, async () => {
            try {
                const response = await axios.get(
                    `${ACCUWEATHER_BASE_URL}/locations/v1/${locationKey}`,
                    {
                        params: {
                            apikey: this.accuweatherApiKey,
                            language: i18n.language, // Add language parameter
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
}
