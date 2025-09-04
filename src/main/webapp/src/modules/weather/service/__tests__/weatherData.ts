import type {
    AirQuality,
    AirQualityData,
    CurrentWeather,
    Forecast,
    GeocodingResult,
    HourlyForecast,
    Location,
    WeatherData,
    WeatherForecast,
} from '@api';
import { vi } from 'vitest';

// Mock geocoding result
export const mockGeocodingResult: GeocodingResult = {
    name: 'Test City',
    latitude: 51.1079,
    longitude: 17.0385,
    country: 'Test Country',
    timezone: 'Europe/Warsaw',
};

// Mock location data
export const mockLocation: Location = {
    name: 'Test City',
    country: 'Test Country',
    state: 'Test Region',
    lat: 51.1079,
    lon: 17.0385,
};

// Mock current weather data
export const mockCurrentWeather: CurrentWeather = {
    temperature: 25,
    windSpeed: 10,
    humidity: 60,
    weatherCode: 0,
};

// Mock weather data response
export const mockWeatherData: WeatherData = {
    location: mockLocation,
    current: mockCurrentWeather,
};

// Mock daily forecast data
export const mockDailyForecast: Forecast[] = [
    {
        date: '2025-08-11',
        tempMin: 18,
        tempMax: 28,
        weatherCode: 0,
        humidity: 60,
        pressure: 1015,
    },
    {
        date: '2025-08-12',
        tempMin: 19,
        tempMax: 29,
        weatherCode: 1,
        humidity: 58,
        pressure: 1016,
    },
];

// Mock hourly forecast
export const mockHourlyData: HourlyForecast[] = [
    {
        time: '2025-08-11T12:00:00Z',
        temperature: 24,
        weatherCode: 0,
    },
    {
        time: '2025-08-11T13:00:00Z',
        temperature: 25,
        weatherCode: 0,
    },
    {
        time: '2025-08-11T14:00:00Z',
        temperature: 26,
        weatherCode: 1,
    },
    {
        time: '2025-08-11T15:00:00Z',
        temperature: 25,
        weatherCode: 1,
    },
    {
        time: '2025-08-11T16:00:00Z',
        temperature: 24,
        weatherCode: 2,
    },
];

// Mock weather forecast response
export const mockWeatherForecast: WeatherForecast = {
    forecast: mockDailyForecast,
    hourly: mockHourlyData,
    current: mockCurrentWeather,
};

// Mock air quality data
export const mockAirQuality: AirQuality = {
    pm10: 15,
    pm2_5: 10,
    aqi: 25,
    timestamp: '2025-08-11T12:00:00Z',
    description: 'Fair',
};

// Mock air quality data response
export const mockAirQualityData: AirQualityData = {
    location: mockLocation,
    airQuality: mockAirQuality,
};

// Create a mock OpenWeatherService implementation
export const createMockWeatherService = () => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getLocationData: vi.fn().mockResolvedValue(mockLocation),
    getCurrentConditions: vi.fn().mockResolvedValue(mockWeatherData),
    getHourlyForecast: vi.fn().mockResolvedValue(mockWeatherForecast),
    getDailyForecast: vi.fn().mockResolvedValue(mockWeatherForecast),
    getAirQuality: vi.fn().mockResolvedValue(mockAirQualityData),
    getAqiCategory: vi.fn().mockImplementation((value) => {
        if (value <= 20) return 'Good';
        if (value <= 40) return 'Fair';
        if (value <= 60) return 'Moderate';
        if (value <= 80) return 'Poor';
        if (value <= 100) return 'Very Poor';
        return 'Extremely Poor';
    }),
});
