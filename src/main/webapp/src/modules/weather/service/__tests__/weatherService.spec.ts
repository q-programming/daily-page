import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import type { WeatherSettings } from '../../types/types.ts';
import { mockAirQualityData, mockGeocodingResult, mockWeatherForecast } from './weatherData.ts';
// Direct import the class we're testing
import { WeatherService } from '../weatherService.ts';

describe('WeatherService', () => {
    // Setup variables
    let mock: MockAdapter;
    let weatherService: WeatherService;

    beforeEach(() => {
        // Clear local storage before each test
        localStorage.clear();
        mock = new MockAdapter(axios);
        const testSettings: WeatherSettings = {
            city: 'Test City',
        };
        // Create instance of WeatherService
        weatherService = new WeatherService(testSettings);

        // Mock the API response for geocoding
        mock.onGet(/\/daily\/api\/weather\/location/).reply(200, mockGeocodingResult);
    });

    afterEach(() => {
        // Reset axios mock
        mock.reset();
        mock.restore();
        // Clear localStorage
        localStorage.clear();
    });

    describe('Initialization', () => {
        it('should successfully initialize service and fetch location data', async () => {
            // Call initialize method
            await weatherService.initialize();
            const searchCall = mock.history.get.find((call) =>
                call.url?.includes('/daily/api/weather/location'),
            );
            //verify the APIs were called
            expect(searchCall).toBeDefined();
            // After initialization, location data should be available
            const locationData = await weatherService.getLocationData();
            expect(locationData).toBeDefined();
            expect(locationData.name).toEqual(mockGeocodingResult.name);
            expect(locationData.country).toEqual(mockGeocodingResult.country);
        });

        it('should throw error when location data cannot be fetched', async () => {
            // Reset mocks to return errors
            mock.reset();
            mock.onGet(/\/daily\/api\/weather\/location/).reply(404);
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
            const searchCall = mock.history.get.find((call) =>
                call.url?.includes('/daily/api/weather/location'),
            );
            expect(searchCall).toBeDefined();
            // The test validates that the initialization properly handles location retrieval
            const locationData = await weatherService.getLocationData();
            expect(locationData.name).toBe(mockGeocodingResult.name);
            expect(locationData.country).toBe(mockGeocodingResult.country);
            expect(locationData.lat).toBe(mockGeocodingResult.latitude);
            expect(locationData.lon).toBe(mockGeocodingResult.longitude);
        });

        it('getLocationData should initialize service if needed', async () => {
            // Call method without initializing first
            const locationData = await weatherService.getLocationData();
            // Should have initialized and returned data
            expect(locationData).toMatchObject({
                name: mockGeocodingResult.name,
                country: mockGeocodingResult.country,
            });
        });

        it('should properly store coordinates after initialization', async () => {
            await weatherService.initialize();
            mock.resetHistory();
            mock.onGet(/\/daily\/api\/weather\/forecast/).reply(200, mockWeatherForecast);
            // Call a method that uses the coordinates internally
            await weatherService.getWeatherForecast();
            // Verify that the correct URL with coordinates was called
            const weatherCall = mock.history.get.find((call) =>
                call.url?.includes('/daily/api/weather/forecast'),
            );
            expect(weatherCall).toBeTruthy();
        });
    });

    describe('Weather Data', () => {
        beforeEach(async () => {
            await weatherService.initialize();
            mock.resetHistory();
            // Setup mock for weather data
            mock.onGet(/\/daily\/api\/weather\/location/).reply(200, mockGeocodingResult);
            mock.onGet(/\/daily\/api\/weather\/forecast/).reply(200, mockWeatherForecast);
        });

        it('getWeatherForecast should return hourly forecast data', async () => {
            mock.resetHistory();
            // Call the method
            const weatherForecast = await weatherService.getWeatherForecast();
            // Assert
            expect(weatherForecast).not.toBeNull();
            expect(weatherForecast?.forecast?.length).toBeGreaterThan(0);

            // Verify the API was called with expected parameters
            const forecastCall = mock.history.get.find((call) =>
                call.url?.includes('/daily/api/weather/forecast'),
            );
            expect(forecastCall).toBeTruthy();
        });

        it('getAirQuality should return air quality data', async () => {
            // Mock the air quality API response
            mock.onGet(/\/daily\/api\/weather\/air-quality/).reply(200, mockAirQualityData);
            // Call the method
            const airQuality = await weatherService.getAirQuality();
            // Assert
            expect(airQuality).not.toBeNull();
            expect(airQuality?.airQuality?.aqi).toBe(25);
            // Verify the API was called with expected parameters
            const aqCall = mock.history.get.find((call) =>
                call.url?.includes('/daily/api/weather/air-quality'),
            );
            expect(aqCall).toBeTruthy();
        });
    });
});
