/**
 * This file maps Open-Meteo weather codes to Iconify weather icons
 */
import i18n from '../../../i18n/i18n.ts';

/**
 * Determines if it's currently daytime based on the hour
 * @param datetime Optional datetime string. If not provided, uses current time
 * @returns boolean - true if it's daytime, false if it's nighttime
 */
export const isDaytime = (datetime?: string): boolean => {
    const date = datetime ? new Date(datetime) : new Date();
    const hour = date.getHours();

    // Consider daytime between 6 AM and 8 PM (20:00)
    return hour >= 6 && hour < 20;
};

// Map Open-Meteo WMO weather codes to Iconify weather icons
// Reference: https://open-meteo.com/en/docs/weather-api
export const getWeatherIcon = (weatherCode: number, datetime?: string): string => {
    const isDay = isDaytime(datetime);

    // Define both day and night versions of weather icons
    const iconMap: Record<number, { day: string; night: string }> = {
        0: { day: 'wi:day-sunny', night: 'wi:night-clear' }, // Clear sky
        1: { day: 'wi:day-cloudy', night: 'wi:night-alt-cloudy' }, // Mainly clear
        2: { day: 'wi:cloud', night: 'wi:cloud' }, // Partly cloudy
        3: { day: 'wi:cloudy', night: 'wi:cloudy' }, // Overcast
        45: { day: 'wi:fog', night: 'wi:fog' }, // Fog
        48: { day: 'wi:fog', night: 'wi:fog' }, // Depositing rime fog
        51: { day: 'wi:day-showers', night: 'wi:night-alt-showers' }, // Light drizzle
        53: { day: 'wi:showers', night: 'wi:showers' }, // Moderate drizzle
        55: { day: 'wi:showers', night: 'wi:showers' }, // Dense drizzle
        56: { day: 'wi:sleet', night: 'wi:sleet' }, // Light freezing drizzle
        57: { day: 'wi:sleet', night: 'wi:sleet' }, // Dense freezing drizzle
        61: { day: 'wi:day-rain', night: 'wi:night-alt-rain' }, // Slight rain
        63: { day: 'wi:rain', night: 'wi:rain' }, // Moderate rain
        65: { day: 'wi:rain', night: 'wi:rain' }, // Heavy rain
        66: { day: 'wi:rain-mix', night: 'wi:rain-mix' }, // Light freezing rain
        67: { day: 'wi:rain-mix', night: 'wi:rain-mix' }, // Heavy freezing rain
        71: { day: 'wi:day-snow', night: 'wi:night-alt-snow' }, // Slight snow fall
        73: { day: 'wi:snow', night: 'wi:snow' }, // Moderate snow fall
        75: { day: 'wi:snow', night: 'wi:snow' }, // Heavy snow fall
        77: { day: 'wi:snowflake-cold', night: 'wi:snowflake-cold' }, // Snow grains
        80: { day: 'wi:day-showers', night: 'wi:night-alt-showers' }, // Slight rain showers
        81: { day: 'wi:showers', night: 'wi:showers' }, // Moderate rain showers
        82: { day: 'wi:showers', night: 'wi:showers' }, // Violent rain showers
        85: { day: 'wi:day-snow', night: 'wi:night-alt-snow' }, // Slight snow showers
        86: { day: 'wi:snow', night: 'wi:snow' }, // Heavy snow showers
        95: { day: 'wi:day-thunderstorm', night: 'wi:night-alt-thunderstorm' }, // Thunderstorm
        96: { day: 'wi:day-thunderstorm', night: 'wi:night-alt-thunderstorm' }, // Thunderstorm with slight hail
        99: { day: 'wi:thunderstorm', night: 'wi:thunderstorm' }, // Thunderstorm with heavy hail
    };

    // Return the appropriate icon based on time of day, or "not available" icon if not found
    if (weatherCode in iconMap) {
        return isDay ? iconMap[weatherCode].day : iconMap[weatherCode].night;
    }

    return 'wi:na'; // Return "not available" icon if weather code not found
};

// Get weather description text from Open-Meteo WMO weather code
export const getWeatherTextFromCode = (weatherCode: number): string => {
    // Use i18n to get the translated weather status
    return i18n.t(`weather.status.${weatherCode}`, {
        defaultValue: i18n.t('weather.status.unknown'),
    });
};

// Format time from API to display time
export const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const locale = i18n.language || 'en';
    return date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Format hour from API time
export const formatHour = (dateString: string): string => {
    const date = new Date(dateString);
    const locale = i18n.language || 'en';

    // More elegant approach using Intl.DateTimeFormat
    const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        // Use 24-hour format for Polish, 12-hour for others
        hour12: !locale.startsWith('pl'),
    };
    return new Intl.DateTimeFormat(locale, options).format(date);
};

// Get AQI category text and color based on European AQI value
export const getAqiInfo = (value: number): { text: string; color: string; i18nKey: string } => {
    // European Air Quality Index ranges
    if (value <= 20) {
        return {
            text: 'Good',
            color: '#50F0E6',
            i18nKey: 'weather.airQualityLevels.good',
        };
    } else if (value <= 40) {
        return {
            text: 'Fair',
            color: '#50CCAA',
            i18nKey: 'weather.airQualityLevels.fair',
        };
    } else if (value <= 60) {
        return {
            text: 'Moderate',
            color: '#F0E641',
            i18nKey: 'weather.airQualityLevels.moderate',
        };
    } else if (value <= 80) {
        return {
            text: 'Poor',
            color: '#FF5050',
            i18nKey: 'weather.airQualityLevels.poor',
        };
    } else if (value <= 100) {
        return {
            text: 'Very Poor',
            color: '#960032',
            i18nKey: 'weather.airQualityLevels.veryPoor',
        };
    } else {
        return {
            text: 'Extremely Poor',
            color: '#7D2181',
            i18nKey: 'weather.airQualityLevels.extremelyPoor',
        };
    }
};
