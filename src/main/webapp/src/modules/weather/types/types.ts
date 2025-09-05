import type { WeatherProvider } from '@api';

export interface WeatherSettings {
    city?: string;
    latitude?: number;
    longitude?: number;
    locationKey?: string;
    provider?: WeatherProvider;
}
