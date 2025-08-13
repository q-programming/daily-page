import {
    type AirQualityData,
    Configuration,
    type GeocodingResult,
    type Location,
    WeatherApi,
    type WeatherForecast,
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
                this.latitude = geocodingResult.latitude || 0;
                this.longitude = geocodingResult.longitude || 0;

                // Create location data from geocoding result
                this.location = {
                    id: geocodingResult.name,
                    name: geocodingResult.name || '',
                    country: geocodingResult.country || '',
                    state: geocodingResult.state || '',
                    lat: geocodingResult.latitude,
                    lon: geocodingResult.longitude,
                };
            }
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
    private async getGeocodingData(cityName: string): Promise<GeocodingResult | null> {
        if (!cityName) {
            console.warn('City name is empty, cannot fetch geocoding data');
            return Promise.resolve(null);
        }

        try {
            // Use weatherApi to geocode city name with correct parameter syntax
            const response = await weatherApi.geocodeLocation(cityName, i18n.language);
            return response.data || null;
        } catch (error) {
            console.error('Error fetching geocoding data:', error);
            return null;
        }
    }

    // Get current, hourly, and daily weather data
    public async getWeatherForecast(): Promise<WeatherForecast | null> {
        if (!this.latitude || !this.longitude) {
            await this.initialize();
            if (!this.latitude || !this.longitude) {
                return null;
            }
        }
        try {
            // Call the API to get forecast data
            const response = await weatherApi.getWeatherForecast(this.latitude, this.longitude, 5);
            return response.data || null;
        } catch (error) {
            console.error('Error fetching hourly forecast data:', error);
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
