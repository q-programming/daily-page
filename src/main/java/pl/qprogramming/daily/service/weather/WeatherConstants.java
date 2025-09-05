package pl.qprogramming.daily.service.weather;

/**
 * Constants for the Weather API.
 * <p>
 * This class provides constant values used throughout the weather service components,
 * including API URLs, cache configuration, and query parameter names and values.
 * </p>
 */
public class WeatherConstants {

    private WeatherConstants() {
        // Prevent instantiation
    }

    // Open-Meteo API URLs
    public static final String OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
    public static final String OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
    public static final String OPEN_METEO_AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

    // AccuWeather API URLs
    public static final String ACCU_WEATHER_LOCATION_URL = "http://dataservice.accuweather.com/locations/v1/cities/geoposition/search";
    public static final String ACCU_WEATHER_CURRENT_CONDITIONS_URL = "http://dataservice.accuweather.com/currentconditions/v1";
    public static final String ACCU_WEATHER_FORECAST_URL = "http://dataservice.accuweather.com/forecasts/v1/daily/5day";
    public static final String ACCU_WEATHER_HOURLY_FORECAST_URL = "http://dataservice.accuweather.com/forecasts/v1/hourly/12hour";
    public static final String ACCU_WEATHER_CITY_SEARCH_URL = "http://dataservice.accuweather.com/locations/v1/cities/search";

    // Geocoding parameters
    public static final String PARAM_NAME = "name";
    public static final String PARAM_LANGUAGE = "language";
    public static final String PARAM_COUNT = "count";
    public static final String DEFAULT_LANGUAGE = "en";

    // Weather parameters
    public static final String PARAM_LATITUDE = "latitude";
    public static final String PARAM_LONGITUDE = "longitude";
    public static final String PARAM_CURRENT = "current";
    public static final String PARAM_DAILY = "daily";
    public static final String PARAM_HOURLY = "hourly";
    public static final String PARAM_FORECAST_DAYS = "forecast_days";
    public static final String PARAM_FORECAST_HOURS = "forecast_hours";
    public static final String PARAM_TIMEZONE = "timezone";
    public static final String TIMEZONE_AUTO = "auto";

    // Weather data fields
    public static final String CURRENT_WEATHER_PARAMS = "temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m";
    public static final String DAILY_WEATHER_PARAMS = "weather_code,temperature_2m_max,temperature_2m_min";
    public static final String HOURLY_WEATHER_PARAMS = "weather_code,temperature_2m,wind_speed_10m,relative_humidity_2m";

    // Air quality parameters
    public static final String AIR_QUALITY_PARAMS = "pm10,pm2_5,european_aqi";
}
