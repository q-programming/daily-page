import {
    type AirQualityData,
    Configuration,
    type GeocodingResult,
    type Location,
    WeatherApi,
    type WeatherForecast,
    WeatherProvider,
} from '@api';
import i18n from '../../../i18n/i18n.ts';
import type { WeatherSettings } from '../types/types.ts';

// Create API instances
const configuration = new Configuration({
    basePath: '/daily/api',
});

const weatherApi = new WeatherApi(configuration);

export class WeatherService {
    private readonly city: string;
    private latitude: number | null = null;
    private longitude: number | null = null;
    private location: Location | null = null;
    private initialized = false;
    private provider: WeatherProvider | null = null;
    private locationKey: string | null = null;

    constructor(settings: WeatherSettings) {
        this.city = settings.city || '';
        this.latitude = settings.latitude || null;
        this.longitude = settings.longitude || null;
        this.provider = settings.provider || null;
        this.locationKey = settings.locationKey || null;
    }

    // Initialize service and get location data
    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            // Require city and provider to be present
            if (!this.city) {
                throw new Error('City name is required for initialization');
            }
            if (!this.provider) {
                throw new Error('Weather provider must be selected for initialization');
            }

            // Always resolve coordinates (and possibly locationKey) from city + provider
            const geocodingResult = await this.getGeocodingData(this.city, this.provider);
            if (!geocodingResult) {
                throw new Error(`Geocoding data not found for city: ${this.city}`);
            }
            this.latitude = geocodingResult.latitude || 0;
            this.longitude = geocodingResult.longitude || 0;
            // persist locationKey if returned (important for AccuWeather)
            this.locationKey = geocodingResult.locationKey || this.locationKey;

            // Create location data from geocoding result
            this.location = {
                id: geocodingResult.name,
                name: geocodingResult.name || '',
                country: geocodingResult.country || '',
                state: geocodingResult.state || '',
                lat: geocodingResult.latitude,
                lon: geocodingResult.longitude,
                locationKey: geocodingResult.locationKey,
            };

            this.initialized = true;
        } catch (error) {
            console.error('Error initializing weather service:', error);
            throw error;
        }
    }

    // Get cached location data or reinitialize if needed
    public async getLocationData(): Promise<Location> {
        if (!this.initialized || !this.location) {
            await this.initialize();
        }
        return this.location as Location;
    }

    // Get geocoding data for a city name
    private async getGeocodingData(
        cityName: string,
        provider?: WeatherProvider,
    ): Promise<GeocodingResult | null> {
        if (!cityName) {
            console.warn('City name is empty, cannot fetch geocoding data');
            return Promise.resolve(null);
        }
        try {
            // Use weatherApi to geocode city name with correct parameter syntax
            const response = await weatherApi.geocodeLocation(cityName, i18n.language, provider);
            return response.data || null;
        } catch (error) {
            console.error('Error fetching geocoding data:', error);
            return null;
        }
    }

    public async getWeatherForecast(): Promise<WeatherForecast | null> {
        if (!this.provider) {
            console.warn('Weather provider is not set, cannot fetch forecast');
            return null;
        }
        switch (this.provider) {
            case WeatherProvider.Openweather:
                return this.getOpenWeatherForecast();
            case WeatherProvider.Accuweather:
                return this.getAccuWeatherForecast();
            default:
                console.warn('Unsupported weather provider:', this.provider);
                return null;
        }
    }

    // Get current, hourly, and daily weather data (OpenWeather)
    public async getOpenWeatherForecast(): Promise<WeatherForecast | null> {
        // Ensure service is initialized
        if (!this.initialized) {
            await this.initialize();
        }

        // Provider must be OpenWeather for this method
        if (this.provider !== WeatherProvider.Openweather) {
            console.warn('OpenWeather forecast requested but provider is not OpenWeather');
            return null;
        }

        // Latitude and longitude are required
        if (!this.latitude || !this.longitude) {
            console.warn('Latitude and longitude are required to fetch OpenWeather forecast');
            return null;
        }

        try {
            // Call the API to get forecast data
            const response = await weatherApi.getOpenWeatherForecast(
                this.latitude,
                this.longitude,
                5,
            );
            return response.data || null;
        } catch (error) {
            console.error('Error fetching OpenWeather forecast data:', error);
            return null;
        }
    }

    // Get AccuWeather forecast using locationKey
    public async getAccuWeatherForecast(): Promise<WeatherForecast | null> {
        // Ensure service is initialized
        if (!this.initialized) {
            await this.initialize();
        }

        // Provider must be AccuWeather for this method
        if (this.provider !== WeatherProvider.Accuweather) {
            console.warn('AccuWeather forecast requested but provider is not AccuWeather');
            return null;
        }

        // locationKey is required for AccuWeather
        const keyFromLocation = this.location?.locationKey || this.locationKey;
        if (!keyFromLocation) {
            console.warn(
                'AccuWeather provider selected but no locationKey is available; ensure geocoding provided a locationKey',
            );
            return null;
        }

        const numericKey = Number(keyFromLocation);
        if (!Number.isFinite(numericKey)) {
            console.error('Invalid AccuWeather locationKey, expected a numeric value');
            return null;
        }

        try {
            const response = await weatherApi.getAccuWeatherForecast(numericKey, 5);
            return response.data || null;
        } catch (error) {
            console.error('Error fetching AccuWeather forecast data:', error);
            return null;
        }
    }

    // Get air quality data
    public async getAirQuality(): Promise<AirQualityData | null> {
        if (!this.latitude || !this.longitude) {
            await this.initialize();
            if (!this.latitude || !this.longitude) {
                return null;
            }
        }
        try {
            // Call the API to get air quality data
            const response = await weatherApi.getAirQuality(this.latitude, this.longitude);
            return response.data || null;
        } catch (error) {
            console.error('Error fetching air quality data:', error);
            return null;
        }
    }
}
