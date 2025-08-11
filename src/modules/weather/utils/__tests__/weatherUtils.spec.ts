import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    formatHour,
    getAqiInfo,
    getWeatherIcon,
    isDaytime,
    getWeatherTextFromCode,
} from '../weatherUtils';
import i18n from '../../../../i18n/i18n';

// Mock the i18n module
vi.mock('../../../../i18n/i18n', () => ({
    default: {
        language: 'en',
        changeLanguage: vi.fn(),
        t: vi.fn((key: string) => {
            const translations: Record<string, string> = {
                'weather.status.0': 'Clear sky',
                'weather.status.1': 'Mainly clear',
                'weather.status.2': 'Partly cloudy',
                'weather.status.unknown': 'Unknown',
            };
            return translations[key] || key;
        }),
    },
}));

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

describe('getWeatherIcon', () => {
    it('should return correct day icon for daytime weather codes', () => {
        // Test day icons explicitly passing daytime
        expect(getWeatherIcon(0, '2025-08-11T14:00:00Z')).toBe('wi:day-sunny');
        expect(getWeatherIcon(1, '2025-08-11T14:00:00Z')).toBe('wi:day-cloudy');
        expect(getWeatherIcon(95, '2025-08-11T14:00:00Z')).toBe('wi:day-thunderstorm');
    });

    it('should return correct night icon for nighttime weather codes', () => {
        // Test night icons explicitly passing nighttime
        expect(getWeatherIcon(0, '2025-08-11T03:00:00Z')).toBe('wi:night-clear');
        expect(getWeatherIcon(1, '2025-08-11T03:00:00Z')).toBe('wi:night-alt-cloudy');
        expect(getWeatherIcon(95, '2025-08-11T03:00:00Z')).toBe('wi:night-alt-thunderstorm');
    });

    it('should return appropriate icon for weather codes that are the same day or night', () => {
        // These codes have the same icon day or night
        expect(getWeatherIcon(3, '2025-08-11T14:00:00Z')).toBe('wi:cloudy');
        expect(getWeatherIcon(3, '2025-08-11T03:00:00Z')).toBe('wi:cloudy');
        expect(getWeatherIcon(45, '2025-08-11T14:00:00Z')).toBe('wi:fog');
        expect(getWeatherIcon(45, '2025-08-11T03:00:00Z')).toBe('wi:fog');
    });

    it('should return not available icon for unknown weather codes', () => {
        expect(getWeatherIcon(999)).toBe('wi:na');
        expect(getWeatherIcon(-1)).toBe('wi:na');
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
    const originalLanguage = i18n.language;

    beforeEach(() => {
        // Reset mock before each test
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Restore original language after each test
        i18n.language = originalLanguage;
    });

    it('should format hour correctly in 12-hour format for English', () => {
        i18n.language = 'en';
        const dateString = '2023-07-15T14:30:00+00:00';
        const result = formatHour(dateString);

        // Check for presence of AM/PM indicator (case insensitive)
        expect(result.toLowerCase()).toMatch(/am|pm/);
    });

    it('should format hour correctly in 24-hour format for Polish', () => {
        i18n.language = 'pl';
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
