/**
 * This file maps AccuWeather icon codes to Iconify weather icons
 */
import i18n from '../../../i18n/i18n.ts';
// Map AccuWeather icon codes to Iconify weather icons
export const getWeatherIcon = (iconCode: number): string => {
    // The mapping is based on AccuWeather icon codes
    // https://developer.accuweather.com/weather-icons
    const iconMap: Record<number, string> = {
        1: 'wi:day-sunny', // Sunny
        2: 'wi:day-sunny', // Mostly Sunny
        3: 'wi:day-cloudy', // Partly Sunny
        4: 'wi:day-cloudy', // Intermittent Clouds
        5: 'wi:day-haze', // Hazy Sunshine
        6: 'wi:day-cloudy', // Mostly Cloudy
        7: 'wi:cloudy', // Cloudy
        8: 'wi:cloudy', // Dreary
        11: 'wi:fog', // Fog
        12: 'wi:showers', // Showers
        13: 'wi:day-showers', // Mostly Cloudy w/ Showers
        14: 'wi:day-showers', // Partly Sunny w/ Showers
        15: 'wi:thunderstorm', // T-Storms
        16: 'wi:day-thunderstorm', // Mostly Cloudy w/ T-Storms
        17: 'wi:day-thunderstorm', // Partly Sunny w/ T-Storms
        18: 'wi:rain', // Rain
        19: 'wi:snow', // Flurries
        20: 'wi:day-snow', // Mostly Cloudy w/ Flurries
        21: 'wi:day-snow', // Partly Sunny w/ Flurries
        22: 'wi:snow', // Snow
        23: 'wi:day-snow', // Mostly Cloudy w/ Snow
        24: 'wi:snowflake-cold', // Ice
        25: 'wi:sleet', // Sleet
        26: 'wi:rain-mix', // Freezing Rain
        29: 'wi:rain-mix', // Rain and Snow
        30: 'wi:hot', // Hot
        31: 'wi:snowflake-cold', // Cold
        32: 'wi:strong-wind', // Windy
        33: 'wi:night-clear', // Clear (night)
        34: 'wi:night-clear', // Mostly Clear (night)
        35: 'wi:night-alt-cloudy', // Partly Cloudy (night)
        36: 'wi:night-alt-cloudy', // Intermittent Clouds (night)
        37: 'wi:night-alt-cloudy', // Hazy (night)
        38: 'wi:night-alt-cloudy', // Mostly Cloudy (night)
        39: 'wi:night-alt-showers', // Partly Cloudy w/ Showers (night)
        40: 'wi:night-alt-showers', // Mostly Cloudy w/ Showers (night)
        41: 'wi:night-alt-thunderstorm', // Partly Cloudy w/ T-Storms (night)
        42: 'wi:night-alt-thunderstorm', // Mostly Cloudy w/ T-Storms (night)
        43: 'wi:night-alt-snow', // Mostly Cloudy w/ Flurries (night)
        44: 'wi:night-alt-snow', // Mostly Cloudy w/ Snow (night)
    };

    return iconMap[iconCode] || 'wi:na'; // Return mapped icon or "not available" icon
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

// Get AQI category text and color based on value
export const getAqiInfo = (value: number): { text: string; color: string; i18nKey: string } => {
    if (value <= 50) {
        return {
            text: 'Good',
            color: '#00E400',
            i18nKey: 'weather.airQualityLevels.good',
        };
    } else if (value <= 100) {
        return {
            text: 'Moderate',
            color: '#FFFF00',
            i18nKey: 'weather.airQualityLevels.moderate',
        };
    } else if (value <= 150) {
        return {
            text: 'Unhealthy for Sensitive Groups',
            color: '#FF7E00',
            i18nKey: 'weather.airQualityLevels.unhealthySensitive',
        };
    } else if (value <= 200) {
        return {
            text: 'Unhealthy',
            color: '#FF0000',
            i18nKey: 'weather.airQualityLevels.unhealthy',
        };
    } else if (value <= 300) {
        return {
            text: 'Very Unhealthy',
            color: '#99004C',
            i18nKey: 'weather.airQualityLevels.veryUnhealthy',
        };
    } else {
        return {
            text: 'Hazardous',
            color: '#7E0023',
            i18nKey: 'weather.airQualityLevels.hazardous',
        };
    }
};
