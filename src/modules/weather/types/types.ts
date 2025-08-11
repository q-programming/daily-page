export interface WeatherSettings {
    city?: string;
    latitude?: number;
    longitude?: number;
}

export interface GeocodingResult {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    country_code: string;
    admin1?: string;
    timezone?: string;
}

export interface OpenMeteoCurrentWeather {
    temperature_2m: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
    time: string;
    weather_code?: number;
}

export interface OpenMeteoHourlyWeather {
    time: string[];
    temperature_2m: number[];
    wind_speed_10m: number[];
    relative_humidity_2m: number[];
    weather_code?: number[];
}

export interface OpenMeteoDailyWeather {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code?: number[];
}

export interface OpenMeteoWeatherResponse {
    current: OpenMeteoCurrentWeather;
    hourly: OpenMeteoHourlyWeather;
    daily?: OpenMeteoDailyWeather;
    latitude: number;
    longitude: number;
}

export interface OpenMeteoAirQuality {
    current: {
        time: string;
        pm10: number;
        pm2_5: number;
        european_aqi: number;
    };
    hourly: {
        time: string[];
        pm10: number[];
        pm2_5: number[];
        european_aqi: number[];
    };
}

// For compatibility with existing code
export interface CurrentCondition {
    WeatherText: string;
    WeatherIcon: number;
    Temperature: {
        Metric: {
            Value: number;
            Unit: string;
        };
    };
    Wind: {
        Speed: {
            Metric: {
                Value: number;
                Unit: string;
            };
        };
    };
    RelativeHumidity: number;
    UVIndex: number;
}

export interface DailyForecast {
    Date: string;
    Temperature: {
        Minimum: {
            Value: number;
            Unit: string;
        };
        Maximum: {
            Value: number;
            Unit: string;
        };
    };
}

export interface HourlyForecast {
    DateTime: string;
    WeatherIcon: number;
    Temperature: {
        Value: number;
        Unit: string;
    };
    IconPhrase: string;
}

export interface LocationData {
    Key: string;
    LocalizedName: string;
    Country: {
        LocalizedName: string;
    };
    Latitude?: number;
    Longitude?: number;
}

export interface AirQualityData {
    value: number;
    category: string;
}
