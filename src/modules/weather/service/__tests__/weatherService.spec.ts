import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
    OPEN_METEO_AIR_QUALITY_URL,
    OPEN_METEO_FORECAST_URL,
    OPEN_METEO_GEOCODING_URL,
} from '../../config';
import type { WeatherSettings } from '../../types/types.ts';
import {
    mockCurrentCondition,
    mockDailyForecast,
    mockGeocodingResult,
    mockOpenMeteoAirQualityResponse,
    mockOpenMeteoResponse,
} from './weatherData.ts';

// Import the WeatherService directly - no need to mock it as we're testing it directly
import { WeatherService } from '../weatherService.ts';

// Create a mock for localStorage
class LocalStorageMock {
    private store: Record<string, string> = {};

    clear() {
        this.store = {};
    }

    getItem(key: string) {
        return this.store[key] || null;
    }

    setItem(key: string, value: string) {
        this.store[key] = value;
    }

    removeItem(key: string) {
        delete this.store[key];
    }
}

describe('WeatherService', () => {
    let mock: MockAdapter;
    let weatherService: WeatherService;
    let originalLocalStorage: Storage;
    let mockLocalStorage: LocalStorageMock;

    beforeEach(() => {
        // Set up axios mock
        mock = new MockAdapter(axios);

        // Save original localStorage
        originalLocalStorage = window.localStorage;

        // Set up localStorage mock
        mockLocalStorage = new LocalStorageMock();
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true,
        });

        // Create weather service instance with test settings
        const testSettings: WeatherSettings = {
            city: 'Test City',
        };
        weatherService = new WeatherService(testSettings);

        // Clear localStorage before each test
        mockLocalStorage.clear();

        // Spy on console methods to prevent test output pollution
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});

        // Setup standard mocks for geocoding endpoints
        mock.onGet(OPEN_METEO_GEOCODING_URL).reply(200, {
            results: [mockGeocodingResult],
        });
    });

    afterEach(() => {
        // Reset axios mock
        mock.reset();

        // Restore original localStorage
        Object.defineProperty(window, 'localStorage', {
            value: originalLocalStorage,
            writable: true,
        });

        vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should successfully initialize service and fetch location data', async () => {
            // Call initialize method
            await weatherService.initialize();

            // Verify the APIs were called with expected parameters
            const searchCall = mock.history.get.find(
                (call) => call.url === OPEN_METEO_GEOCODING_URL,
            );
            expect(searchCall?.params).toEqual({
                name: 'Test City',
                language: expect.any(String),
                count: 1,
            });

            // After initialization, location data should be available
            const locationData = await weatherService.getLocationData();
            expect(locationData.LocalizedName).toEqual('Test City');
            expect(locationData.Country.LocalizedName).toEqual('Test Country');
        });

        it('should throw error when location data cannot be fetched', async () => {
            // Reset mocks to return errors
            mock.reset();
            mock.onGet(OPEN_METEO_GEOCODING_URL).reply(404);

            // Expect initialization to fail
            await expect(weatherService.initialize()).rejects.toThrow();
        });

        it('should not reinitialize if already initialized', async () => {
            // First initialization
            await weatherService.initialize();

            // Reset mock history
            mock.resetHistory();

            // Second initialization should not make API calls
            await weatherService.initialize();
            expect(mock.history.get.length).toBe(0);
        });
    });

    describe('Location Data', () => {
        it('should retrieve geocoding data for a city', async () => {
            mock.resetHistory();
            // Initialize the service which will call getGeocodingData internally
            await weatherService.initialize();

            // Verify the API was called with expected parameters for city search
            const searchCall = mock.history.get.find(
                (call) => call.url === OPEN_METEO_GEOCODING_URL,
            );
            expect(searchCall?.params).toEqual({
                name: 'Test City',
                language: expect.any(String),
                count: 1,
            });

            // The test validates that the initialization properly handles location retrieval
            const locationData = await weatherService.getLocationData();
            expect(locationData.LocalizedName).toBe('Test City');
            expect(locationData.Latitude).toBe(51.1079);
            expect(locationData.Longitude).toBe(17.0385);
        });

        it('getLocationData should initialize service if needed', async () => {
            // Call method without initializing first
            const locationData = await weatherService.getLocationData();

            // Should have initialized and returned data
            expect(locationData).toMatchObject({
                LocalizedName: 'Test City',
                Country: { LocalizedName: 'Test Country' },
            });
        });

        it('should properly store coordinates after initialization', async () => {
            // Initialize service first
            await weatherService.initialize();
            mock.resetHistory();

            // Mock endpoints for weather data
            mock.onGet(OPEN_METEO_FORECAST_URL).reply(200, mockOpenMeteoResponse);

            // Call a method that uses the coordinates internally
            await weatherService.getCurrentConditions();

            // Verify that the correct URL with coordinates was called
            const weatherCall = mock.history.get.find(
                (call) => call.url === OPEN_METEO_FORECAST_URL,
            );
            expect(weatherCall).toBeTruthy();
            expect(weatherCall?.params).toMatchObject({
                latitude: 51.1079,
                longitude: 17.0385,
            });
        });
    });

    describe('Weather Data', () => {
        beforeEach(async () => {
            // Initialize service before each test in this block
            await weatherService.initialize();

            // Clear API call history
            mock.resetHistory();

            // Setup mock for weather data
            mock.onGet(OPEN_METEO_FORECAST_URL).reply(200, mockOpenMeteoResponse);
        });

        it('getCurrentConditions should return current weather conditions', async () => {
            // Call the method
            const conditions = await weatherService.getCurrentConditions();

            // Assert
            expect(conditions).toEqual(mockCurrentCondition);
            expect(conditions?.WeatherText).toBe('Clear sky');
            expect(conditions?.Temperature.Metric.Value).toBe(25);

            // Verify the API was called with expected parameters
            expect(mock.history.get[0].params).toMatchObject({
                latitude: 51.1079,
                longitude: 17.0385,
                current: expect.any(String),
                hourly: expect.any(String),
            });
        });

        it('getDailyForecast should return daily forecast data', async () => {
            // Call the method
            const forecast = await weatherService.getDailyForecast();

            // Assert
            expect(forecast).toEqual(mockDailyForecast);
            expect(forecast?.[0].Temperature.Maximum.Value).toBe(28);
        });

        it('getHourlyForecast should return hourly forecast data', async () => {
            // Call the method
            const forecast = await weatherService.getHourlyForecast();

            // Assert
            expect(forecast?.length).toBeGreaterThan(0);
            expect(forecast?.[0].Temperature.Value).toBe(24);
        });

        it('getAirQuality should return air quality data', async () => {
            // Mock the air quality API response
            mock.onGet(OPEN_METEO_AIR_QUALITY_URL).reply(200, mockOpenMeteoAirQualityResponse);

            // Call the method
            const airQuality = await weatherService.getAirQuality();

            // Assert
            expect(airQuality?.value).toBe(25);
            expect(airQuality?.category).toBe('Fair');

            // Verify the API was called with expected parameters
            expect(mock.history.get[0].params).toMatchObject({
                latitude: 51.1079,
                longitude: 17.0385,
            });
        });

        it('should correctly use the AQI categorization for European AQI', () => {
            // Test the AQI category method with European AQI ranges
            expect(weatherService.getAqiCategory(10)).toBe('Good');
            expect(weatherService.getAqiCategory(30)).toBe('Fair');
            expect(weatherService.getAqiCategory(50)).toBe('Moderate');
            expect(weatherService.getAqiCategory(70)).toBe('Poor');
            expect(weatherService.getAqiCategory(90)).toBe('Very Poor');
            expect(weatherService.getAqiCategory(110)).toBe('Extremely Poor');
        });
    });

    describe('Caching', () => {
        beforeEach(async () => {
            await weatherService.initialize();
            mock.resetHistory();

            // Setup mock for weather data
            mock.onGet(OPEN_METEO_FORECAST_URL).reply(200, mockOpenMeteoResponse);
        });

        it('should use cached data when available and not expired', async () => {
            // First call - should hit the API
            await weatherService.getCurrentConditions();
            expect(mock.history.get.length).toBe(1);

            mock.resetHistory();

            // Second call - should use cache
            await weatherService.getCurrentConditions();
            expect(mock.history.get.length).toBe(0); // No new API calls
        });

        it('should request fresh data when cache is manually cleared', async () => {
            // First call - should hit the API
            await weatherService.getCurrentConditions();
            expect(mock.history.get.length).toBe(1);

            // Clear the localStorage
            mockLocalStorage.clear();
            mock.resetHistory();

            // Second call - should hit the API again
            await weatherService.getCurrentConditions();
            expect(mock.history.get.length).toBe(1);
        });
    });
});
