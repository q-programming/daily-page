import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { ACCUWEATHER_BASE_URL, AIRQ_BASE_URL, WeatherService } from '../weatherService.ts';
import type { WeatherSettings } from '../../types/types.ts';
import {
    mockAirQualityResponse,
    mockCurrentCondition,
    mockDailyForecast,
    mockHourlyForecast,
    mockLocationData,
} from './weatherData.ts';

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

    it('getLocationKey should return location key', async () => {
        // Mock the API response
        mock.onGet(`${ACCUWEATHER_BASE_URL}/locations/v1/cities/search`).reply(200, [
            mockLocationData,
        ]);

        // Call the method
        const locationKey = await weatherService.getLocationKey('Test City');

        // Assert
        expect(locationKey).toBe('123456');

        // Verify the API was called with expected parameters
        expect(mock.history.get[0].params).toEqual({
            apikey: 'test-api-key',
            q: 'Test City',
            language: expect.any(String),
        });
    });

    it('getCurrentConditions should return current weather conditions', async () => {
        // Mock the API response
        mock.onGet(`${ACCUWEATHER_BASE_URL}/currentconditions/v1/123456`).reply(200, [
            mockCurrentCondition,
        ]);

        // Call the method
        const conditions = await weatherService.getCurrentConditions('123456');

        // Assert
        expect(conditions).toEqual(mockCurrentCondition);
        expect(conditions.WeatherText).toBe('Sunny');
        expect(conditions.Temperature.Metric.Value).toBe(25);

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
        const forecast = await weatherService.getDailyForecast('123456');

        // Assert
        expect(forecast).toEqual(mockDailyForecast);
        expect(forecast.length).toBe(2);
        expect(forecast[0].Temperature.Maximum.Value).toBe(28);

        // Verify the API was called with expected parameters
        expect(mock.history.get[0].params).toEqual({
            apikey: 'test-api-key',
            metric: true,
            language: expect.any(String),
        });
    });

    it('getHourlyForecast should return hourly forecast data', async () => {
        // Mock the API response
        mock.onGet(`${ACCUWEATHER_BASE_URL}/forecasts/v1/hourly/12hour/123456`).reply(
            200,
            mockHourlyForecast,
        );

        // Call the method
        const forecast = await weatherService.getHourlyForecast('123456');

        // Assert
        expect(forecast).toEqual(mockHourlyForecast);
        expect(forecast.length).toBe(2);
        expect(forecast[0].Temperature.Value).toBe(24);

        // Verify the API was called with expected parameters
        expect(mock.history.get[0].params).toEqual({
            apikey: 'test-api-key',
            metric: true,
            language: expect.any(String),
        });
    });

    it('getAirQuality should return air quality data', async () => {
        // Mock the location endpoint
        mock.onGet(`${ACCUWEATHER_BASE_URL}/locations/v1/123456`).reply(200, mockLocationData);

        // Mock the air quality endpoint
        mock.onGet(`${AIRQ_BASE_URL}/v2/nearest_city`).reply(200, mockAirQualityResponse);

        // Call the method
        const airQuality = await weatherService.getAirQuality('123456');

        // Assert
        expect(airQuality.value).toBe(35);
        expect(airQuality.category).toBe('Good');

        // Verify the IQAir API was called with expected parameters
        const iqairCall = mock.history.get.find(
            (call) => call.url === `${AIRQ_BASE_URL}/v2/nearest_city`,
        );
        expect(iqairCall?.params).toEqual({
            city: 'Test City',
            state: '',
            country: 'Test Country',
            key: 'test-iqair-key',
        });
    });

    it('should use cached data when available and valid', async () => {
        // Prepare mock cached data
        const cachedData = {
            timestamp: Date.now(), // current time (cache is fresh)
            data: mockCurrentCondition,
        };
        localStorage.setItem('weather_current_123456', JSON.stringify(cachedData));

        // Call the method (should use cache)
        const conditions = await weatherService.getCurrentConditions('123456');

        // Assert result is from cache
        expect(conditions).toEqual(mockCurrentCondition);

        // Verify the API was NOT called
        expect(mock.history.get.length).toBe(0);
    });

    it('should fetch new data when cache is expired', async () => {
        // Prepare expired cached data (2 hours old)
        const expiredCache = {
            timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
            data: { ...mockCurrentCondition, WeatherText: 'Outdated' },
        };
        localStorage.setItem('weather_current_123456', JSON.stringify(expiredCache));

        // Mock the API response for fresh data
        mock.onGet(`${ACCUWEATHER_BASE_URL}/currentconditions/v1/123456`).reply(200, [
            mockCurrentCondition,
        ]);

        // Call the method
        const conditions = await weatherService.getCurrentConditions('123456');

        // Assert we got fresh data, not cached
        expect(conditions.WeatherText).toBe('Sunny');

        // Verify the API was called to get fresh data
        expect(mock.history.get.length).toBe(1);
    });

    it('should handle API errors gracefully', async () => {
        // Mock the API to return an error
        mock.onGet(`${ACCUWEATHER_BASE_URL}/locations/v1/cities/search`).reply(500, {
            message: 'Server error',
        });

        // Call the method and expect it to throw
        await expect(weatherService.getLocationKey('Test City')).rejects.toThrow();
    });

    it('should return unknown air quality when IQAir API key is not provided', async () => {
        // Create a weather service instance without IQAir API key
        const settingsWithoutIQAir: WeatherSettings = {
            apiKey: 'test-api-key',
            iqairApiKey: '', // Empty IQAir API key
            city: 'Test City',
        };
        const serviceWithoutIQAir = new WeatherService(settingsWithoutIQAir);

        // Mock the location endpoint just to be safe
        mock.onGet(`${ACCUWEATHER_BASE_URL}/locations/v1/123456`).reply(200, mockLocationData);

        // Call the method
        const airQuality = await serviceWithoutIQAir.getAirQuality('123456');

        // Assert default values are returned
        expect(airQuality.value).toBe(0);
        expect(airQuality.category).toBe('Unknown');

        // Verify no call was made to the IQAir API
        const iqairCalls = mock.history.get.filter(
            (call) => call.url === `${AIRQ_BASE_URL}/v2/nearest_city`,
        );
        expect(iqairCalls.length).toBe(0);
    });

    it('should handle IQAir API errors gracefully', async () => {
        // Mock the location endpoint
        mock.onGet(`${ACCUWEATHER_BASE_URL}/locations/v1/123456`).reply(200, mockLocationData);

        // Mock the air quality endpoint to return an error
        mock.onGet(`${AIRQ_BASE_URL}/v2/nearest_city`).reply(500, { message: 'Server error' });

        // Call the method
        const airQuality = await weatherService.getAirQuality('123456');

        // Should return default values when API fails
        expect(airQuality.value).toBe(0);
        expect(airQuality.category).toBe('Unknown');
    });

    it('should handle invalid IQAir API responses gracefully', async () => {
        // Mock the location endpoint
        mock.onGet(`${ACCUWEATHER_BASE_URL}/locations/v1/123456`).reply(200, mockLocationData);

        // Mock the air quality endpoint to return invalid data
        mock.onGet(`${AIRQ_BASE_URL}/v2/nearest_city`).reply(200, {
            status: 'success',
            data: null,
        });

        // Call the method
        const airQuality = await weatherService.getAirQuality('123456');

        // Should return default values when API response is invalid
        expect(airQuality.value).toBe(0);
        expect(airQuality.category).toBe('Unknown');
    });

    it('should categorize AQI values correctly', async () => {
        // Test different AQI values by accessing the private method via a hack
        const getAqiCategory = weatherService.getAqiCategory.bind(weatherService);

        // Test all category boundaries
        expect(getAqiCategory(30)).toBe('Good'); // 0-50: Good
        expect(getAqiCategory(50)).toBe('Good'); // Edge case
        expect(getAqiCategory(51)).toBe('Moderate'); // 51-100: Moderate
        expect(getAqiCategory(100)).toBe('Moderate'); // Edge case
        expect(getAqiCategory(101)).toBe('Unhealthy for Sensitive Groups'); // 101-150
        expect(getAqiCategory(150)).toBe('Unhealthy for Sensitive Groups'); // Edge case
        expect(getAqiCategory(151)).toBe('Unhealthy'); // 151-200
        expect(getAqiCategory(200)).toBe('Unhealthy'); // Edge case
        expect(getAqiCategory(201)).toBe('Very Unhealthy'); // 201-300
        expect(getAqiCategory(300)).toBe('Very Unhealthy'); // Edge case
        expect(getAqiCategory(301)).toBe('Hazardous'); // 301+
        expect(getAqiCategory(500)).toBe('Hazardous');
    });

    it('should return location details', async () => {
        // Mock the API response
        mock.onGet(`${ACCUWEATHER_BASE_URL}/locations/v1/123456`).reply(200, mockLocationData);

        // Call the method
        const location = await weatherService.getLocation('123456');

        // Assert
        expect(location).toEqual(mockLocationData);

        // Verify the API was called with expected parameters
        expect(mock.history.get[0].params).toEqual({
            apikey: 'test-api-key',
            language: expect.any(String),
        });
    });

    it('should handle location details API errors', async () => {
        // Mock the API to return an error
        mock.onGet(`${ACCUWEATHER_BASE_URL}/locations/v1/123456`).reply(500, {
            message: 'Server error',
        });

        // Call the method and expect it to throw
        await expect(weatherService.getLocation('123456')).rejects.toThrow();
    });
});
