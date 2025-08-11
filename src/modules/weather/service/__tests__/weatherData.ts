import type {
    CurrentCondition,
    DailyForecast,
    HourlyForecast,
    LocationData,
    WeatherSettings,
    GeocodingResult,
    OpenMeteoWeatherResponse,
    OpenMeteoAirQuality,
} from '../../types/types.ts';
import { vi } from 'vitest';

// Mock weather settings - Open-Meteo doesn't require API keys
export const mockWeatherSettings: WeatherSettings = {
    city: 'Test City',
};

// Mock geocoding result from Open-Meteo
export const mockGeocodingResult: GeocodingResult = {
    id: 123456,
    name: 'Test City',
    latitude: 51.1079,
    longitude: 17.0385,
    country: 'Test Country',
    country_code: 'TC',
    admin1: 'Test Region',
    timezone: 'Europe/Warsaw',
};

// Mock location data (converted from geocoding result)
export const mockLocationData: LocationData = {
    Key: '123456',
    LocalizedName: 'Test City',
    Country: {
        LocalizedName: 'Test Country',
    },
    Latitude: 51.1079,
    Longitude: 17.0385,
};

// Mock Open-Meteo weather response
export const mockOpenMeteoResponse: OpenMeteoWeatherResponse = {
    latitude: 51.1079,
    longitude: 17.0385,
    current: {
        time: '2025-08-11T12:00:00Z',
        temperature_2m: 25,
        wind_speed_10m: 10,
        relative_humidity_2m: 60,
        weather_code: 0,
    },
    hourly: {
        time: [
            '2025-08-11T12:00:00Z',
            '2025-08-11T13:00:00Z',
            '2025-08-11T14:00:00Z',
            '2025-08-11T15:00:00Z',
            '2025-08-11T16:00:00Z',
        ],
        temperature_2m: [24, 25, 26, 25, 24],
        wind_speed_10m: [10, 11, 12, 10, 9],
        relative_humidity_2m: [60, 58, 55, 57, 62],
        weather_code: [0, 0, 1, 1, 2],
    },
    daily: {
        time: ['2025-08-11', '2025-08-12'],
        temperature_2m_min: [18, 19],
        temperature_2m_max: [28, 29],
        weather_code: [0, 1],
    },
};

// Mock Open-Meteo air quality response
export const mockOpenMeteoAirQualityResponse: OpenMeteoAirQuality = {
    current: {
        time: '2025-08-11T12:00:00Z',
        pm10: 15,
        pm2_5: 10,
        european_aqi: 25,
    },
    hourly: {
        time: [
            '2025-08-11T12:00:00Z',
            '2025-08-11T13:00:00Z',
            '2025-08-11T14:00:00Z',
            '2025-08-11T15:00:00Z',
            '2025-08-11T16:00:00Z',
        ],
        pm10: [15, 16, 17, 16, 15],
        pm2_5: [10, 11, 12, 11, 10],
        european_aqi: [25, 26, 28, 27, 25],
    },
};

// These are the transformed versions that maintain compatibility with the UI components

// Mock current weather conditions
export const mockCurrentCondition: CurrentCondition = {
    WeatherText: 'Clear sky',
    WeatherIcon: 0,
    Temperature: {
        Metric: {
            Value: 25,
            Unit: '°C',
        },
    },
    Wind: {
        Speed: {
            Metric: {
                Value: 10,
                Unit: 'km/h',
            },
        },
    },
    RelativeHumidity: 60,
    UVIndex: 0,
};

// Mock daily forecast data
export const mockDailyForecast: DailyForecast[] = [
    {
        Date: '2025-08-11',
        Temperature: {
            Minimum: {
                Value: 18,
                Unit: '°C',
            },
            Maximum: {
                Value: 28,
                Unit: '°C',
            },
        },
    },
    {
        Date: '2025-08-12',
        Temperature: {
            Minimum: {
                Value: 19,
                Unit: '°C',
            },
            Maximum: {
                Value: 29,
                Unit: '°C',
            },
        },
    },
];

// Mock hourly forecast data
export const mockHourlyForecast: HourlyForecast[] = [
    {
        DateTime: '2025-08-11T12:00:00Z',
        WeatherIcon: 0,
        Temperature: {
            Value: 24,
            Unit: '°C',
        },
        IconPhrase: 'Clear sky',
    },
    {
        DateTime: '2025-08-11T13:00:00Z',
        WeatherIcon: 0,
        Temperature: {
            Value: 25,
            Unit: '°C',
        },
        IconPhrase: 'Clear sky',
    },
];

// Mock air quality data
export const mockAirQuality = {
    value: 25,
    category: 'Fair',
};

// Create a mock WeatherService implementation
export const createMockWeatherService = () => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getLocationData: vi.fn().mockResolvedValue(mockLocationData),
    getCurrentConditions: vi.fn().mockResolvedValue(mockCurrentCondition),
    getHourlyForecast: vi.fn().mockResolvedValue(mockHourlyForecast),
    getDailyForecast: vi.fn().mockResolvedValue(mockDailyForecast),
    getAirQuality: vi.fn().mockResolvedValue(mockAirQuality),
});
