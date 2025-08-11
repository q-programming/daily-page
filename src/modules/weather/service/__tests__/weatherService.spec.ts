import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { ACCUWEATHER_BASE_URL, AIRQ_BASE_URL } from '../../config';
import type { WeatherSettings } from '../../types/types.ts';
import {
    mockAirQualityResponse,
    mockCurrentCondition,
    mockDailyForecast,
    mockHourlyForecast,
    mockLocationData,
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
            apiKey: 'test-api-key',
            iqairApiKey: 'test-iqair-key',
            city: 'Test City',
        };
        weatherService = new WeatherService(testSettings);

        // Clear localStorage before each test
        mockLocalStorage.clear();

        // Spy on console methods to prevent test output pollution
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});

        // Setup standard mocks for location endpoints
        mock.onGet(`${ACCUWEATHER_BASE_URL}/locations/v1/cities/search`).reply(200, [
            mockLocationData,
        ]);
        mock.onGet(`${ACCUWEATHER_BASE_URL}/locations/v1/123456`).reply(200, mockLocationData);
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
                (call) => call.url === `${ACCUWEATHER_BASE_URL}/locations/v1/cities/search`,
            );
            expect(searchCall?.params).toEqual({
                apikey: 'test-api-key',
                q: 'Test City',
                language: expect.any(String),
            });

            // After initialization, location data should be available
            const locationData = await weatherService.getLocationData();
            expect(locationData).toEqual(mockLocationData);
        });

        it('should throw error when location data cannot be fetched', async () => {
            // Reset mocks to return errors
            mock.reset();
            mock.onGet(`${ACCUWEATHER_BASE_URL}/locations/v1/cities/search`).reply(404);

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
        // Testing private methods using type casting
        it('should retrieve location key for a city', async () => {
            // Access the private method using type assertion
            // Note: This test is modified to work with the updated implementation
            // where getLocationKey is now private
            mock.resetHistory();
            // Initialize the service which will call getLocationKey internally
            await weatherService.initialize();
            // Verify the API was called with expected parameters for city search
            const searchCall = mock.history.get.find(
                (call) => call.url === `${ACCUWEATHER_BASE_URL}/locations/v1/cities/search`,
            );
            expect(searchCall?.params).toEqual({
                apikey: 'test-api-key',
                q: 'Test City',
                language: expect.any(String),
            });
            // The test validates that the initialization properly handles location key retrieval
            const locationData = await weatherService.getLocationData();
            expect(locationData.Key).toBe('123456');
        });

        it('getLocationData should initialize service if needed', async () => {
            // Call method without initializing first
            const locationData = await weatherService.getLocationData();

            // Should have initialized and returned data
            expect(locationData).toEqual(mockLocationData);
        });

        it('should properly manage the location key internally', async () => {
            // Initialize service first
            await weatherService.initialize();
            mock.resetHistory();

            // Mock endpoints for methods that use the location key
            mock.onGet(`${ACCUWEATHER_BASE_URL}/currentconditions/v1/123456`).reply(200, [
                mockCurrentCondition,
            ]);

            // Call a method that uses the location key internally
            await weatherService.getCurrentConditions();

            // Verify that the correct URL with the location key was called
            const conditionsCall = mock.history.get.find(
                (call) => call.url === `${ACCUWEATHER_BASE_URL}/currentconditions/v1/123456`,
            );
            expect(conditionsCall).toBeTruthy();
        });
    });

    describe('Weather Data', () => {
        beforeEach(async () => {
            // Initialize service before each test in this block
            await weatherService.initialize();

            // Clear API call history
            mock.resetHistory();
        });

        it('getCurrentConditions should return current weather conditions', async () => {
            // Mock the API response
            mock.onGet(`${ACCUWEATHER_BASE_URL}/currentconditions/v1/123456`).reply(200, [
                mockCurrentCondition,
            ]);

            // Call the method
            const conditions = await weatherService.getCurrentConditions();

            // Assert
            expect(conditions).toEqual(mockCurrentCondition);
            expect(conditions?.WeatherText).toBe('Sunny');
            expect(conditions?.Temperature.Metric.Value).toBe(25);

            // Verify the API was called with expected parameters
            expect(mock.history.get[0].params).toEqual({
                apikey: 'test-api-key',
                details: true,
                language: expect.any(String),
            });
        });

        it('getDailyForecast should return daily forecast data', async () => {
            // Mock the API response
            mock.onGet(`${ACCUWEATHER_BASE_URL}/forecasts/v1/daily/5day/123456`).reply(200, {
                DailyForecasts: mockDailyForecast,
            });

            // Call the method
            const forecast = await weatherService.getDailyForecast();

            // Assert
            expect(forecast).toEqual(mockDailyForecast);
            expect(forecast?.[0].Temperature.Maximum.Value).toBe(28);
        });

        it('getHourlyForecast should return hourly forecast data', async () => {
            // Mock the API response
            mock.onGet(`${ACCUWEATHER_BASE_URL}/forecasts/v1/hourly/12hour/123456`).reply(
                200,
                mockHourlyForecast,
            );

            // Call the method
            const forecast = await weatherService.getHourlyForecast();

            // Assert
            expect(forecast).toEqual(mockHourlyForecast);
            expect(forecast?.[0].Temperature.Value).toBe(24);
        });

        it('getAirQuality should return air quality data', async () => {
            // Mock the API response - use city and country names from location data
            mock.onGet(AIRQ_BASE_URL + '/v2/nearest_city').reply(200, mockAirQualityResponse);

            // Call the method
            const airQuality = await weatherService.getAirQuality();

            // Assert
            expect(airQuality?.value).toBe(35);
            expect(airQuality?.category).toBe('Good');

            // Verify the API was called with expected parameters
            expect(mock.history.get[0].params).toEqual({
                city: 'Test City',
                country: 'Test Country',
                key: 'test-iqair-key',
            });
        });

        it('should correctly use the AQI categorization', () => {
            // Test the AQI category method directly
            expect(weatherService.getAqiCategory(30)).toBe('Good');
            expect(weatherService.getAqiCategory(75)).toBe('Moderate');
            expect(weatherService.getAqiCategory(120)).toBe('Unhealthy for Sensitive Groups');
            expect(weatherService.getAqiCategory(180)).toBe('Unhealthy');
            expect(weatherService.getAqiCategory(250)).toBe('Very Unhealthy');
            expect(weatherService.getAqiCategory(350)).toBe('Hazardous');
        });
    });

    describe('Caching', () => {
        beforeEach(async () => {
            await weatherService.initialize();
            mock.resetHistory();
        });

        it('should use cached data when available and not expired', async () => {
            // Mock the API response
            mock.onGet(`${ACCUWEATHER_BASE_URL}/currentconditions/v1/123456`).reply(200, [
                mockCurrentCondition,
            ]);

            // First call - should hit the API
            await weatherService.getCurrentConditions();
            expect(mock.history.get.length).toBe(1);

            mock.resetHistory();

            // Second call - should use cache
            await weatherService.getCurrentConditions();
            expect(mock.history.get.length).toBe(0); // No new API calls
        });

        it('should request fresh data when cache is manually cleared', async () => {
            // Mock the API response
            mock.onGet(`${ACCUWEATHER_BASE_URL}/currentconditions/v1/123456`).reply(200, [
                mockCurrentCondition,
            ]);

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
