export interface WeatherSettings {
    apiKey: string;
    iqairApiKey: string;
    locationKey?: string;
    city?: string;
}

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
}

export interface AirQualityData {
    value: number;
    category: string;
}
