/**
 * This file maps Open-Meteo weather codes to Iconify weather icons
 */
import i18n from '../../../i18n/i18n.ts';
import { WeatherProvider } from '@api';

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

// Choose the appropriate weather icon based on provider and weather code
export const getWeatherIcon = (
    weatherCode: number,
    provider?: WeatherProvider,
    datetime?: string,
): string => {
    if (provider === WeatherProvider.Accuweather) {
        return getAccuWeatherIcon(weatherCode, datetime);
    }
    // Default to OpenWeather icon mapping
    return getOpenWeatherIcon(weatherCode, datetime);
};

// Map Open-Meteo WMO weather codes to Iconify weather icons
// Reference: https://open-meteo.com/en/docs/weather-api
export const getOpenWeatherIcon = (weatherCode: number, datetime?: string): string => {
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

// Map AccuWeather icon codes to Iconify weather icons
// Reference: https://developer.accuweather.com/weather-icons
export const getAccuWeatherIcon = (weatherCode: number, datetime?: string): string => {
    const isDay = isDaytime(datetime);

    // Define both day and night versions of weather icons for AccuWeather codes
    const iconMap: Record<number, { day: string; night: string }> = {
        1: { day: 'wi:day-sunny', night: 'wi:night-clear' }, // Sunny / Clear
        2: { day: 'wi:day-sunny', night: 'wi:night-clear' }, // Mostly Sunny / Mostly Clear
        3: { day: 'wi:day-cloudy', night: 'wi:night-alt-cloudy' }, // Partly Sunny / Partly Cloudy
        4: { day: 'wi:day-cloudy', night: 'wi:night-alt-cloudy' }, // Intermittent Clouds
        5: { day: 'wi:day-haze', night: 'wi:night-fog' }, // Hazy Sunshine / Hazy Moonlight
        6: { day: 'wi:cloud', night: 'wi:cloud' }, // Mostly Cloudy
        7: { day: 'wi:cloudy', night: 'wi:cloudy' }, // Cloudy
        8: { day: 'wi:cloudy', night: 'wi:cloudy' }, // Dreary (Overcast)
        11: { day: 'wi:fog', night: 'wi:fog' }, // Fog
        12: { day: 'wi:day-showers', night: 'wi:night-alt-showers' }, // Showers
        13: { day: 'wi:day-rain', night: 'wi:night-alt-rain' }, // Mostly Cloudy w/ Showers
        14: { day: 'wi:day-cloudy', night: 'wi:night-alt-cloudy' }, // Partly Sunny w/ Showers
        15: { day: 'wi:thunderstorm', night: 'wi:thunderstorm' }, // T-Storms
        16: { day: 'wi:day-thunderstorm', night: 'wi:night-alt-thunderstorm' }, // Mostly Cloudy w/ T-Storms
        17: { day: 'wi:day-thunderstorm', night: 'wi:night-alt-thunderstorm' }, // Partly Sunny w/ T-Storms
        18: { day: 'wi:rain', night: 'wi:rain' }, // Rain
        19: { day: 'wi:day-snow', night: 'wi:night-alt-snow' }, // Flurries
        20: { day: 'wi:day-cloudy', night: 'wi:night-alt-cloudy' }, // Mostly Cloudy w/ Flurries
        21: { day: 'wi:day-cloudy', night: 'wi:night-alt-cloudy' }, // Partly Sunny w/ Flurries
        22: { day: 'wi:snow', night: 'wi:snow' }, // Snow
        23: { day: 'wi:day-cloudy', night: 'wi:night-alt-cloudy' }, // Mostly Cloudy w/ Snow
        24: { day: 'wi:sleet', night: 'wi:sleet' }, // Ice
        25: { day: 'wi:sleet', night: 'wi:sleet' }, // Sleet
        26: { day: 'wi:rain-mix', night: 'wi:rain-mix' }, // Freezing Rain
        29: { day: 'wi:rain-mix', night: 'wi:rain-mix' }, // Rain and Snow
        30: { day: 'wi:thermometer', night: 'wi:thermometer' }, // Hot
        31: { day: 'wi:snowflake-cold', night: 'wi:snowflake-cold' }, // Cold
        32: { day: 'wi:strong-wind', night: 'wi:strong-wind' }, // Windy
        33: { day: 'wi:night-clear', night: 'wi:night-clear' }, // Clear (night)
        34: { day: 'wi:night-alt-cloudy', night: 'wi:night-alt-cloudy' }, // Mostly Clear (night)
        35: { day: 'wi:night-alt-cloudy', night: 'wi:night-alt-cloudy' }, // Partly Cloudy (night)
        36: { day: 'wi:night-alt-cloudy', night: 'wi:night-alt-cloudy' }, // Intermittent Clouds (night)
        37: { day: 'wi:night-fog', night: 'wi:night-fog' }, // Hazy Moonlight
        38: { day: 'wi:cloud', night: 'wi:cloud' }, // Mostly Cloudy (night)
        39: { day: 'wi:night-alt-showers', night: 'wi:night-alt-showers' }, // Partly Cloudy w/ Showers (night)
        40: { day: 'wi:night-alt-rain', night: 'wi:night-alt-rain' }, // Mostly Cloudy w/ Showers (night)
        41: { day: 'wi:night-alt-thunderstorm', night: 'wi:night-alt-thunderstorm' }, // Partly Cloudy w/ T-Storms (night)
        42: { day: 'wi:night-alt-thunderstorm', night: 'wi:night-alt-thunderstorm' }, // Mostly Cloudy w/ T-Storms (night)
        43: { day: 'wi:night-alt-cloudy', night: 'wi:night-alt-cloudy' }, // Mostly Cloudy w/ Flurries (night)
        44: { day: 'wi:night-alt-snow', night: 'wi:night-alt-snow' }, // Mostly Cloudy w/ Snow (night)
    };

    // Return the appropriate icon based on time of day, or "not available" icon if not found
    if (weatherCode in iconMap) {
        return isDay ? iconMap[weatherCode].day : iconMap[weatherCode].night;
    }

    return 'wi:na'; // Return "not available" icon if weather code not found
};

// Get weather description text from Open-Meteo WMO weather code
export const getWeatherTextFromCode = (weatherCode: number, provider?: WeatherProvider): string => {
    // Decide which translation namespace to use based on provider
    if (provider === WeatherProvider.Accuweather) {
        return i18n.t(`weather.accuStatus.${weatherCode}`, {
            defaultValue: i18n.t('weather.openStatus.unknown'),
        });
    }

    // Default to Open-Meteo WMO codes
    return i18n.t(`weather.openStatus.${weatherCode}`, {
        defaultValue: i18n.t('weather.openStatus.unknown'),
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
