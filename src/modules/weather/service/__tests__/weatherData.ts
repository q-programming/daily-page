import type {
    CurrentCondition,
    DailyForecast,
    HourlyForecast,
    LocationData,
    WeatherSettings,
} from '../../types/types.ts';
import { vi } from 'vitest';

// Mock weather settings
export const mockWeatherSettings: WeatherSettings = {
    apiKey: 'test-api-key',
    iqairApiKey: 'test-iqair-key',
    city: 'Test City',
};

// Mock location data
export const mockLocationData: LocationData = {
    Key: '123456',
    LocalizedName: 'Test City',
    Country: {
        LocalizedName: 'Test Country',
    },
};

// Mock current weather conditions
export const mockCurrentCondition: CurrentCondition = {
    WeatherText: 'Sunny',
    WeatherIcon: 1,
    Temperature: {
        Metric: {
            Value: 25,
            Unit: 'C',
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
    UVIndex: 3,
};

// Mock daily forecast data
export const mockDailyForecast: DailyForecast[] = [
    {
        Date: '2025-08-11T07:00:00Z',
        Temperature: {
            Minimum: {
                Value: 18,
                Unit: 'C',
            },
            Maximum: {
                Value: 28,
                Unit: 'C',
            },
        },
    },
    {
        Date: '2025-08-12T07:00:00Z',
        Temperature: {
            Minimum: {
                Value: 19,
                Unit: 'C',
            },
            Maximum: {
                Value: 29,
                Unit: 'C',
            },
        },
    },
];

// Mock hourly forecast data
export const mockHourlyForecast: HourlyForecast[] = [
    {
        DateTime: '2025-08-11T12:00:00Z',
        WeatherIcon: 1,
        Temperature: {
            Value: 24,
            Unit: 'C',
        },
        IconPhrase: 'Sunny',
    },
    {
        DateTime: '2025-08-11T13:00:00Z',
        WeatherIcon: 1,
        Temperature: {
            Value: 25,
            Unit: 'C',
        },
        IconPhrase: 'Sunny',
    },
];

// Mock air quality response
export const mockAirQualityResponse = {
    status: 'success',
    data: {
        current: {
            pollution: {
                aqius: 35,
            },
        },
    },
};

// Mock air quality data
export const mockAirQuality = {
    value: 35,
    category: 'Good',
};

// Create a mock WeatherService implementation
export const createMockWeatherService = () => ({
    getLocationKey: vi.fn().mockResolvedValue(mockLocationData.Key),
    getCurrentConditions: vi.fn().mockResolvedValue(mockCurrentCondition),
    getHourlyForecast: vi.fn().mockResolvedValue(mockHourlyForecast),
    getDailyForecast: vi.fn().mockResolvedValue(mockDailyForecast),
    getLocation: vi.fn().mockResolvedValue(mockLocationData),
    getAirQuality: vi.fn().mockResolvedValue(mockAirQuality),
});
