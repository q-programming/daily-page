package pl.qprogramming.daily.service.weather;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import pl.qprogramming.daily.config.AccuWeatherConfig;
import pl.qprogramming.daily.dto.WeatherForecast;
import pl.qprogramming.daily.service.weather.mapper.AccuWeatherMapper;
import pl.qprogramming.daily.service.weather.model.accuweather.AccuWeatherCurrentConditions;
import pl.qprogramming.daily.service.weather.model.accuweather.AccuWeatherDailyForecast;
import pl.qprogramming.daily.service.weather.model.accuweather.AccuWeatherHourlyForecast;
import pl.qprogramming.daily.service.weather.model.accuweather.AccuWeatherLocation;

import java.util.Arrays;

import static pl.qprogramming.daily.service.weather.WeatherConstants.*;

/**
 * Service for interacting with AccuWeather APIs.
 * <p>
 * This service provides methods to access weather-related data from AccuWeather APIs:
 * <ul>
 *     <li>Location search - get location key by coordinates</li>
 *     <li>Current conditions - get current weather conditions for a location</li>
 *     <li>Daily forecast - get daily weather forecasts</li>
 *     <li>Hourly forecast - get hourly weather forecasts</li>
 * </ul>
 * Methods use caching to minimize API calls and improve performance.
 * </p>
 */
@Service
@Slf4j
public class AccuWeatherService {

    private final RestTemplate restTemplate;
    private final AccuWeatherConfig config;
    private final AccuWeatherMapper mapper;

    /**
     * Constructor for AccuWeatherService.
     *
     * @param config AccuWeather API configuration
     * @param mapper MapStruct mapper for converting between API response models and DTOs
     */
    public AccuWeatherService(AccuWeatherConfig config, AccuWeatherMapper mapper) {
        this.restTemplate = new RestTemplate();
        this.config = config;
        this.mapper = mapper;
    }

    /**
     * Gets the location key for the given coordinates from AccuWeather API.
     *
     * @param latitude  Latitude of the location
     * @param longitude Longitude of the location
     * @return AccuWeatherLocation containing the location key and other details
     */
    @Cacheable(value = "accuweatherLocation", key = "#latitude + '-' + #longitude")
    public AccuWeatherLocation getLocationKey(double latitude, double longitude) {
        try {
            String url = UriComponentsBuilder.fromUriString(ACCU_WEATHER_LOCATION_URL)
                    .queryParam("apikey", config.getApiKey())
                    .queryParam("q", latitude + "," + longitude)
                    .encode()
                    .toUriString();

            log.debug("Requesting location key from AccuWeather for lat: {}, lon: {}", latitude, longitude);
            val response = restTemplate.getForObject(url, AccuWeatherLocation.class);
            log.debug("Response from AccuWeather Location API: {}", response);
            return response;
        } catch (Exception e) {
            log.error("Error fetching location key from AccuWeather for lat: {}, lon: {}: {}", latitude, longitude, e.getMessage());
            return null;
        }
    }

    /**
     * Gets current weather conditions for a location from AccuWeather API.
     *
     * @param locationKey AccuWeather location key
     * @return AccuWeatherCurrentConditions containing current weather data
     */
    @Cacheable(value = "accuweatherCurrentConditions", key = "#locationKey")
    public AccuWeatherCurrentConditions getCurrentConditions(String locationKey) {
        try {
            String url = UriComponentsBuilder.fromUriString(ACCU_WEATHER_CURRENT_CONDITIONS_URL + "/" + locationKey)
                    .queryParam("apikey", config.getApiKey())
                    .queryParam("details", true)
                    .encode()
                    .toUriString();

            log.debug("Requesting current conditions from AccuWeather for location key: {}", locationKey);
            val response = restTemplate.getForObject(url, AccuWeatherCurrentConditions[].class);
            log.debug("Response from AccuWeather Current Conditions API: {}", response);

            // AccuWeather returns an array with a single item
            if (response != null && response.length > 0) {
                return response[0];
            }
            return null;
        } catch (Exception e) {
            log.error("Error fetching current conditions from AccuWeather for location key: {}: {}", locationKey, e.getMessage());
            return null;
        }
    }

    /**
     * Gets daily forecast for a location from AccuWeather API.
     *
     * @param locationKey AccuWeather location key
     * @param days Number of days (default is 5, max is 5 for free accounts)
     * @return AccuWeatherDailyForecast containing daily forecast data
     */
    @Cacheable(value = "accuweatherDailyForecast", key = "#locationKey + '-' + #days")
    public AccuWeatherDailyForecast getDailyForecast(String locationKey, Integer days) {
        try {
            // AccuWeather free tier only supports 5-day forecasts
            int forecastDays = Math.min(days != null ? days : 5, 5);

            String url = UriComponentsBuilder.fromUriString(ACCU_WEATHER_FORECAST_URL + "/" + locationKey)
                    .queryParam("apikey", config.getApiKey())
                    .queryParam("details", true)
                    .queryParam("metric", true)
                    .encode()
                    .toUriString();

            log.debug("Requesting daily forecast from AccuWeather for location key: {}, days: {}", locationKey, forecastDays);
            val response = restTemplate.getForObject(url, AccuWeatherDailyForecast.class);
            log.debug("Response from AccuWeather Daily Forecast API: {}", response);
            return response;
        } catch (Exception e) {
            log.error("Error fetching daily forecast from AccuWeather for location key: {}, days: {}: {}", locationKey, days, e.getMessage());
            return null;
        }
    }

    /**
     * Gets hourly forecast for a location from AccuWeather API.
     *
     * @param locationKey AccuWeather location key
     * @param hours Number of hours (default is 12, max is 12 for free accounts)
     * @return AccuWeatherHourlyForecast containing hourly forecast data
     */
    @Cacheable(value = "accuweatherHourlyForecast", key = "#locationKey + '-' + #hours")
    public AccuWeatherHourlyForecast getHourlyForecast(String locationKey, Integer hours) {
        try {
            // AccuWeather free tier only supports 12-hour forecasts
            int forecastHours = Math.min(hours != null ? hours : 12, 12);

            String url = UriComponentsBuilder.fromUriString(ACCU_WEATHER_HOURLY_FORECAST_URL + "/" + locationKey)
                    .queryParam("apikey", config.getApiKey())
                    .queryParam("details", true)
                    .queryParam("metric", true)
                    .encode()
                    .toUriString();

            log.debug("Requesting hourly forecast from AccuWeather for location key: {}, hours: {}", locationKey, forecastHours);
            val response = restTemplate.getForObject(url, AccuWeatherHourlyForecast.HourlyForecastItem[].class);
            log.debug("Response from AccuWeather Hourly Forecast API: {}", Arrays.toString(response));

            if (response != null) {
                AccuWeatherHourlyForecast hourlyForecast = new AccuWeatherHourlyForecast();
                hourlyForecast.setHourlyForecasts(Arrays.asList(response));
                return hourlyForecast;
            }
            return null;
        } catch (Exception e) {
            log.error("Error fetching hourly forecast from AccuWeather for location key: {}, hours: {}: {}", locationKey, hours, e.getMessage());
            return null;
        }
    }

    /**
     * Gets complete weather forecast for a geographic location.
     * <p>
     * This method retrieves location key, current conditions, daily forecast, and hourly forecast
     * from AccuWeather APIs and combines them into a single WeatherForecast object.
     * </p>
     *
     * @param latitude Latitude of the location
     * @param longitude Longitude of the location
     * @param days Number of days to forecast
     * @param hours Number of hours to forecast
     * @return WeatherForecast containing current, daily, and hourly weather data
     */
    @Cacheable(value = FORECAST_CACHE, key = "'accu-' + #latitude + '-' + #longitude + '-' + #days")
    public WeatherForecast getWeatherForecast(double latitude, double longitude, Integer days, Integer hours) {
        try {
            log.info("Fetching weather forecast from AccuWeather for lat: {}, lon: {}, days: {}, hours: {}",
                    latitude, longitude, days, hours);

            // Step 1: Get location key
            AccuWeatherLocation location = getLocationKey(latitude, longitude);
            if (location == null) {
                log.error("Failed to get location key from AccuWeather for lat: {}, lon: {}", latitude, longitude);
                return new WeatherForecast();
            }

            String locationKey = location.getKey();

            // Step 2: Get current conditions
            AccuWeatherCurrentConditions currentConditions = getCurrentConditions(locationKey);

            // Step 3: Get daily forecast
            AccuWeatherDailyForecast dailyForecast = getDailyForecast(locationKey, days);

            // Step 4: Get hourly forecast
            AccuWeatherHourlyForecast hourlyForecast = getHourlyForecast(locationKey, hours);

            // Step 5: Use MapStruct mapper to combine everything into a WeatherForecast object
            return mapper.createWeatherForecast(location, currentConditions, dailyForecast, hourlyForecast);

        } catch (Exception e) {
            log.error("Error fetching weather forecast from AccuWeather for lat: {}, lon: {}: {}",
                    latitude, longitude, e.getMessage());
            return new WeatherForecast();
        }
    }
}
