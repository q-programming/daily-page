import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatHour, getAqiInfo, getWeatherIcon } from '../weatherUtils';
import i18n from '../../../../i18n/i18n';

// Mock the i18n module
vi.mock('../../../../i18n/i18n', () => ({
    default: {
        language: 'en',
        changeLanguage: vi.fn(),
    },
}));
describe('getWeatherIcon', () => {
    it('should return correct icon for known weather codes', () => {
        expect(getWeatherIcon(1)).toBe('wi:day-sunny');
        expect(getWeatherIcon(7)).toBe('wi:cloudy');
        expect(getWeatherIcon(15)).toBe('wi:thunderstorm');
        expect(getWeatherIcon(33)).toBe('wi:night-clear');
    });

    it('should return not available icon for unknown weather codes', () => {
        expect(getWeatherIcon(999)).toBe('wi:na');
        expect(getWeatherIcon(-1)).toBe('wi:na');
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
    it('should return "Good" category for AQI <= 50', () => {
        const result = getAqiInfo(50);
        expect(result.text).toBe('Good');
        expect(result.color).toBe('#00E400');
        expect(result.i18nKey).toBe('weather.airQualityLevels.good');
    });

    it('should return "Moderate" category for AQI between 51 and 100', () => {
        const result = getAqiInfo(75);
        expect(result.text).toBe('Moderate');
        expect(result.color).toBe('#FFFF00');
        expect(result.i18nKey).toBe('weather.airQualityLevels.moderate');
    });

    it('should return "Unhealthy for Sensitive Groups" category for AQI between 101 and 150', () => {
        const result = getAqiInfo(125);
        expect(result.text).toBe('Unhealthy for Sensitive Groups');
        expect(result.color).toBe('#FF7E00');
        expect(result.i18nKey).toBe('weather.airQualityLevels.unhealthySensitive');
    });

    it('should return "Unhealthy" category for AQI between 151 and 200', () => {
        const result = getAqiInfo(175);
        expect(result.text).toBe('Unhealthy');
        expect(result.color).toBe('#FF0000');
        expect(result.i18nKey).toBe('weather.airQualityLevels.unhealthy');
    });

    it('should return "Very Unhealthy" category for AQI between 201 and 300', () => {
        const result = getAqiInfo(250);
        expect(result.text).toBe('Very Unhealthy');
        expect(result.color).toBe('#99004C');
        expect(result.i18nKey).toBe('weather.airQualityLevels.veryUnhealthy');
    });

    it('should return "Hazardous" category for AQI > 300', () => {
        const result = getAqiInfo(350);
        expect(result.text).toBe('Hazardous');
        expect(result.color).toBe('#7E0023');
        expect(result.i18nKey).toBe('weather.airQualityLevels.hazardous');
    });
});
