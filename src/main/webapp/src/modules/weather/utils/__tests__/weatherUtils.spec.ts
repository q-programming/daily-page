import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    formatHour,
    getAccuWeatherIcon,
    getAqiInfo,
    getWeatherIcon,
    getWeatherTextFromCode,
    isDaytime,
} from '../weatherUtils';
import i18n from '../../../../i18n/i18n.ts';
import { WeatherProvider } from '@api';

// Save original language
const originalLanguage = i18n.language;

describe('weatherUtils', () => {
    // Set up before each test
    beforeEach(() => {
        // Use sync version for setup
        i18n.changeLanguage('en');
        vi.clearAllMocks();
    });

    // Restore original language after all tests
    afterAll(() => {
        i18n.changeLanguage(originalLanguage);
    });

    describe('isDaytime', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should return true during daytime hours', () => {
            // Set to 12:00 PM
            vi.setSystemTime(new Date('2025-08-11T12:00:00'));
            expect(isDaytime()).toBe(true);

            // Set to 7:00 AM
            vi.setSystemTime(new Date('2025-08-11T07:00:00'));
            expect(isDaytime()).toBe(true);
        });

        it('should return false during nighttime hours', () => {
            // Set to 2:00 AM
            vi.setSystemTime(new Date('2025-08-11T02:00:00'));
            expect(isDaytime()).toBe(false);

            // Set to 10:00 PM (22:00)
            vi.setSystemTime(new Date('2025-08-11T22:00:00'));
            expect(isDaytime()).toBe(false);
        });

        it('should handle datetime parameter correctly', () => {
            expect(isDaytime('2025-08-11T14:00:00Z')).toBe(true);
            expect(isDaytime('2025-08-11T03:00:00Z')).toBe(false);
        });
    });

    describe('getAccuWeatherIcon', () => {
        it('should return correct day icon for daytime AccuWeather codes', () => {
            // Test day icons explicitly passing daytime
            expect(getAccuWeatherIcon(1, '2025-08-11T14:00:00Z')).toBe('wi:day-sunny'); // Sunny
            expect(getAccuWeatherIcon(3, '2025-08-11T14:00:00Z')).toBe('wi:day-cloudy'); // Partly Sunny
            expect(getAccuWeatherIcon(15, '2025-08-11T14:00:00Z')).toBe('wi:thunderstorm'); // T-Storms
        });

        it('should return correct night icon for nighttime AccuWeather codes', () => {
            // Test night icons explicitly passing nighttime
            expect(getAccuWeatherIcon(1, '2025-08-11T03:00:00Z')).toBe('wi:night-clear'); // Clear
            expect(getAccuWeatherIcon(3, '2025-08-11T03:00:00Z')).toBe('wi:night-alt-cloudy'); // Partly Cloudy
            expect(getAccuWeatherIcon(15, '2025-08-11T03:00:00Z')).toBe('wi:thunderstorm'); // T-Storms
        });

        it('should handle night-specific AccuWeather codes correctly', () => {
            expect(getAccuWeatherIcon(33, '2025-08-11T14:00:00Z')).toBe('wi:night-clear'); // Clear (night)
            expect(getAccuWeatherIcon(36, '2025-08-11T03:00:00Z')).toBe('wi:night-alt-cloudy'); // Intermittent Clouds (night)
            expect(getAccuWeatherIcon(41, '2025-08-11T03:00:00Z')).toBe(
                'wi:night-alt-thunderstorm',
            ); // Partly Cloudy w/ T-Storms (night)
        });

        it('should return appropriate icon for weather codes that are the same day or night', () => {
            // These codes have the same icon day or night
            expect(getAccuWeatherIcon(7, '2025-08-11T14:00:00Z')).toBe('wi:cloudy'); // Cloudy
            expect(getAccuWeatherIcon(7, '2025-08-11T03:00:00Z')).toBe('wi:cloudy'); // Cloudy
            expect(getAccuWeatherIcon(11, '2025-08-11T14:00:00Z')).toBe('wi:fog'); // Fog
            expect(getAccuWeatherIcon(11, '2025-08-11T03:00:00Z')).toBe('wi:fog'); // Fog
        });

        it('should return not available icon for unknown weather codes', () => {
            expect(getAccuWeatherIcon(999)).toBe('wi:na');
            expect(getAccuWeatherIcon(-1)).toBe('wi:na');
        });
    });

    describe('getWeatherIcon', () => {
        it('should return AccuWeather icon when provider is ACCUWEATHER', () => {
            // Test some AccuWeather codes with the unified function
            expect(getWeatherIcon(1, WeatherProvider.Accuweather, '2025-08-11T14:00:00Z')).toBe(
                'wi:day-sunny',
            );
            expect(getWeatherIcon(7, WeatherProvider.Accuweather, '2025-08-11T14:00:00Z')).toBe(
                'wi:cloudy',
            );
            expect(getWeatherIcon(33, WeatherProvider.Accuweather, '2025-08-11T03:00:00Z')).toBe(
                'wi:night-clear',
            );
        });

        it('should return OpenWeather icon when provider is OPENMETEO', () => {
            // Test some OpenWeather codes with the unified function
            expect(getWeatherIcon(0, WeatherProvider.Openweather, '2025-08-11T14:00:00Z')).toBe(
                'wi:day-sunny',
            );
            expect(getWeatherIcon(3, WeatherProvider.Openweather, '2025-08-11T14:00:00Z')).toBe(
                'wi:cloudy',
            );
            expect(getWeatherIcon(95, WeatherProvider.Openweather, '2025-08-11T03:00:00Z')).toBe(
                'wi:night-alt-thunderstorm',
            );
        });

        it('should default to OpenWeather icon when provider is not specified', () => {
            // Should fall back to OpenWeather when no provider is specified
            expect(getWeatherIcon(0, undefined, '2025-08-11T14:00:00Z')).toBe('wi:day-sunny');
            expect(getWeatherIcon(3, undefined, '2025-08-11T03:00:00Z')).toBe('wi:cloudy');
        });

        it('should default to OpenWeather icon when provider is unknown', () => {
            // Should fall back to OpenWeather when an unknown provider is specified
            // @ts-expect-error - Deliberately testing with invalid enum value
            expect(getWeatherIcon(0, 'UNKNOWN_PROVIDER', '2025-08-11T14:00:00Z')).toBe(
                'wi:day-sunny',
            );
        });
    });

    describe('getWeatherTextFromCode', () => {
        it('should return translated text for known weather codes', () => {
            expect(getWeatherTextFromCode(0)).toBe('Clear sky');
            expect(getWeatherTextFromCode(1)).toBe('Mainly clear');
            expect(getWeatherTextFromCode(2)).toBe('Partly cloudy');
        });

        it('should return "Unknown" for unknown weather codes', () => {
            expect(getWeatherTextFromCode(999)).toBe('Unknown');
            expect(getWeatherTextFromCode(-1)).toBe('Unknown');
        });
    });

    describe('formatHour', () => {
        it('should format hour correctly in 12-hour format for English', () => {
            i18n.changeLanguage('en');
            const dateString = '2023-07-15T14:30:00+00:00';
            const result = formatHour(dateString);

            // Check for presence of AM/PM indicator (case insensitive)
            expect(result.toLowerCase()).toMatch(/am|pm/);
        });

        it('should format hour correctly in 24-hour format for Polish', () => {
            i18n.changeLanguage('pl');
            const dateString = '2023-07-15T14:30:00+00:00';
            const result = formatHour(dateString);

            // For 24-hour format, typically no AM/PM indicator
            expect(result.toLowerCase()).not.toMatch(/am|pm/);
        });

        it('should fallback to English if no language is set', () => {
            i18n.language = '';
            const dateString = '2023-07-15T14:30:00+00:00';
            const result = formatHour(dateString);

            // Should use default English format
            expect(result.toLowerCase()).toMatch(/am|pm/);
        });
    });

    describe('getAqiInfo', () => {
        it('should return "Good" category for European AQI <= 20', () => {
            const result = getAqiInfo(15);
            expect(result.text).toBe('Good');
            expect(result.color).toBe('#50F0E6');
            expect(result.i18nKey).toBe('weather.airQualityLevels.good');
        });

        it('should return "Fair" category for European AQI between 21 and 40', () => {
            const result = getAqiInfo(30);
            expect(result.text).toBe('Fair');
            expect(result.color).toBe('#50CCAA');
            expect(result.i18nKey).toBe('weather.airQualityLevels.fair');
        });

        it('should return "Moderate" category for European AQI between 41 and 60', () => {
            const result = getAqiInfo(50);
            expect(result.text).toBe('Moderate');
            expect(result.color).toBe('#F0E641');
            expect(result.i18nKey).toBe('weather.airQualityLevels.moderate');
        });

        it('should return "Poor" category for European AQI between 61 and 80', () => {
            const result = getAqiInfo(70);
            expect(result.text).toBe('Poor');
            expect(result.color).toBe('#FF5050');
            expect(result.i18nKey).toBe('weather.airQualityLevels.poor');
        });

        it('should return "Very Poor" category for European AQI between 81 and 100', () => {
            const result = getAqiInfo(90);
            expect(result.text).toBe('Very Poor');
            expect(result.color).toBe('#960032');
            expect(result.i18nKey).toBe('weather.airQualityLevels.veryPoor');
        });

        it('should return "Extremely Poor" category for European AQI > 100', () => {
            const result = getAqiInfo(110);
            expect(result.text).toBe('Extremely Poor');
            expect(result.color).toBe('#7D2181');
            expect(result.i18nKey).toBe('weather.airQualityLevels.extremelyPoor');
        });
    });
});
