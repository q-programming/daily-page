package pl.qprogramming.daily.service.weather;

/**
 * Constants for the Weather API.
 */
public class WeatherConstants {

    private WeatherConstants() {
        // Prevent instantiation
    }

    public static final String OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
    public static final String OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
    public static final String OPEN_METEO_AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

    // Cache duration in milliseconds
    public static final long CACHE_DURATION = 60 * 60 * 1000; // 1 hour
}
