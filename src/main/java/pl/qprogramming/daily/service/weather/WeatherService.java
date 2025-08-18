package pl.qprogramming.daily.service.weather;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import pl.qprogramming.daily.dto.AirQualityData;
import pl.qprogramming.daily.dto.GeocodingResult;
import pl.qprogramming.daily.dto.WeatherData;
import pl.qprogramming.daily.dto.WeatherForecast;
import pl.qprogramming.daily.service.weather.mapper.WeatherMapper;
import pl.qprogramming.daily.service.weather.model.GeocodingResponse;
import pl.qprogramming.daily.service.weather.model.OpenMeteoAirQuality;
import pl.qprogramming.daily.service.weather.model.OpenMeteoWeatherResponse;

import static pl.qprogramming.daily.service.weather.WeatherConstants.*;

/**
 * Service for interacting with Open-Meteo weather APIs.
 * <p>
 * This service provides methods to access various weather-related data from Open-Meteo APIs:
 * <ul>
 *     <li>Geocoding - convert city names to geographic coordinates</li>
 *     <li>Current weather - get current weather conditions for a location</li>
 *     <li>Weather forecast - get daily and hourly weather forecasts</li>
 *     <li>Air quality - get air quality metrics for a location</li>
 * </ul>
 * All methods use caching to minimize API calls and improve performance.
 * </p>
 */
@Service
@Slf4j
public class WeatherService {

    private final RestTemplate restTemplate;
    private final WeatherMapper weatherMapper;

    /**
     * Constructor for WeatherService.
     * Initializes a RestTemplate for making HTTP requests to weather APIs.
     *
     * @param weatherMapper Mapper for converting between API response models and DTOs
     */
    public WeatherService(WeatherMapper weatherMapper) {
        this.restTemplate = new RestTemplate();
        this.weatherMapper = weatherMapper;
    }

    /**
     * Gets geocoding data for a city name.
     *
     * @param cityName Name of the city to geocode
     * @param language Language code for the response (defaults to "en" if null)
     * @param count Maximum number of results to return
     * @return GeocodingResult containing location data or null if not found or error occurs
     */
    @Cacheable(value = GEOCODING_CACHE, key = "#cityName + '-' + #language")
    public GeocodingResult geocodeLocation(String cityName, String language, int count) {
        if (cityName == null || cityName.trim().isEmpty()) {
            return null;
        }

        // Build the URL manually to preserve Polish characters instead of encoding them
        String baseUrl = OPEN_METEO_GEOCODING_URL + "?";
        String params = PARAM_NAME + "=" + cityName + "&" +
                PARAM_LANGUAGE + "=" + (language != null ? language : DEFAULT_LANGUAGE) + "&" +
                PARAM_COUNT + "=" + count;
        String url = baseUrl + params;

        try {
            val response = restTemplate.getForObject(url, GeocodingResponse.class);
            log.debug("Response from Open-Meteo Geocoding API: {}", response);
            if (response != null && response.getResults() != null && !response.getResults().isEmpty()) {
                val result = response.getResults().get(0);
                return weatherMapper.toGeocodingResponse(result);
            }
            return null;
        } catch (Exception e) {
            log.error("Error geocoding location '{}': {}", cityName, e.getMessage());
            return null;
        }
    }

    /**
     * Gets current weather data for a geographic location.
     * <p>
     * This method retrieves the current weather conditions for the specified
     * coordinates by calling the Open-Meteo Forecast API. The data includes
     * temperature, weather code, wind speed, and humidity. Results are cached
     * to reduce API calls.
     * </p>
     *
     * @param latitude Latitude of the location
     * @param longitude Longitude of the location
     * @return WeatherData containing current weather conditions or null if error occurs
     */
    @Cacheable(value = CURRENT_WEATHER_CACHE, key = "#latitude + '-' + #longitude")
    public WeatherData getCurrentWeather(double latitude, double longitude) {
        try {
            String url = UriComponentsBuilder.fromUriString(OPEN_METEO_FORECAST_URL)
                    .queryParam(PARAM_LATITUDE, latitude)
                    .queryParam(PARAM_LONGITUDE, longitude)
                    .queryParam(PARAM_CURRENT, CURRENT_WEATHER_PARAMS)
                    .queryParam(PARAM_TIMEZONE, TIMEZONE_AUTO)
                    .encode()
                    .toUriString();

            val response = restTemplate.getForObject(url, OpenMeteoWeatherResponse.class);
            log.debug("Response from Open-Meteo Current Weather API: {}", response);
            if (response == null || response.getCurrent() == null) {
                return null;
            }
            return weatherMapper.toWeatherData(response);
        } catch (Exception e) {
            log.error("Error fetching current weather for lat: {}, lon: {}: {}", latitude, longitude, e.getMessage());
            return null;
        }
    }

    /**
     * Gets weather forecast for a geographic location.
     * <p>
     * This method retrieves both daily and hourly weather forecasts for the
     * specified coordinates by calling the Open-Meteo Forecast API. The data
     * includes temperature, weather code, wind speed, and humidity. The forecast
     * can be limited by number of days and hours. Results are cached to reduce API calls.
     * </p>
     *
     * @param latitude Latitude of the location
     * @param longitude Longitude of the location
     * @param days Number of days to forecast
     * @param hours Number of hours to forecast
     * @return WeatherForecast containing daily and hourly forecast data or null if error occurs
     */
    @Cacheable(value = FORECAST_CACHE, key = "#latitude + '-' + #longitude + '-' + #days")
    public WeatherForecast getWeatherForecast(double latitude, double longitude, Integer days, Integer hours) {
        try {
            String url = UriComponentsBuilder.fromUriString(OPEN_METEO_FORECAST_URL)
                    .queryParam(PARAM_LATITUDE, latitude)
                    .queryParam(PARAM_LONGITUDE, longitude)
                    .queryParam(PARAM_CURRENT, CURRENT_WEATHER_PARAMS)
                    .queryParam(PARAM_DAILY, DAILY_WEATHER_PARAMS)
                    .queryParam(PARAM_HOURLY, HOURLY_WEATHER_PARAMS)
                    .queryParam(PARAM_FORECAST_DAYS, days)
                    .queryParam(PARAM_FORECAST_HOURS, hours)
                    .queryParam(PARAM_TIMEZONE, TIMEZONE_AUTO)
                    .encode()
                    .toUriString();

            val response = restTemplate.getForObject(url, OpenMeteoWeatherResponse.class);
            log.debug("Response from Open-Meteo Forecast: {}", response);
            if (response == null || response.getDaily() == null) {
                return null;
            }
            // Create context wrapper objects and pass them to the mapper
            val daysContext = new WeatherMapper.DaysContext(days);
            val hoursContext = new WeatherMapper.HoursContext(hours);
            return weatherMapper.toWeatherForecast(response, daysContext, hoursContext);
        } catch (Exception e) {
            log.error("Error fetching weather forecast for lat: {}, lon: {}, days: {}: {}", latitude, longitude, days, e.getMessage());
            return null;
        }
    }

    /**
     * Gets air quality data for a geographic location.
     * <p>
     * This method retrieves current air quality metrics for the specified
     * coordinates by calling the Open-Meteo Air Quality API. The data includes
     * PM10, PM2.5, and European Air Quality Index. Results are cached to reduce API calls.
     * </p>
     *
     * @param latitude Latitude of the location
     * @param longitude Longitude of the location
     * @return AirQualityData containing air quality metrics or null if error occurs
     */
    @Cacheable(value = AIR_QUALITY_CACHE, key = "#latitude + '-' + #longitude")
    public AirQualityData getAirQuality(double latitude, double longitude) {
        try {
            String url = UriComponentsBuilder.fromUriString(OPEN_METEO_AIR_QUALITY_URL)
                    .queryParam(PARAM_LATITUDE, latitude)
                    .queryParam(PARAM_LONGITUDE, longitude)
                    .queryParam(PARAM_CURRENT, AIR_QUALITY_PARAMS)
                    .encode()
                    .toUriString();
            val response = restTemplate.getForObject(url, OpenMeteoAirQuality.class);
            log.debug("Response from Open-Meteo Air Quality API: {}", response);
            if (response == null || response.getCurrent() == null) {
                return null;
            }
            return weatherMapper.toAirQualityData(response);
        } catch (Exception e) {
            log.error("Error fetching air quality data for lat: {}, lon: {}: {}", latitude, longitude, e.getMessage());
            return null;
        }
    }
}
