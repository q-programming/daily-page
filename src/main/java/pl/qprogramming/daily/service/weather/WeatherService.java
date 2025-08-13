package pl.qprogramming.daily.service.weather;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

@Service
@Slf4j
@RequiredArgsConstructor
public class WeatherService {

    private final RestTemplate restTemplate;
    private final WeatherMapper weatherMapper;

    /**
     * Get geocoding data for a city name
     */
    @Cacheable(value = "geocoding", key = "#cityName + '-' + #language")
    public GeocodingResult geocodeLocation(String cityName, String language, int count) {
        if (cityName == null || cityName.trim().isEmpty()) {
            return null;
        }
        // Create a base URI without encoding the parameters
        String url = OPEN_METEO_GEOCODING_URL + "?name=" + cityName +
                "&language=" + (language != null ? language : "en") +
                "&count=" + count;
        try {
            GeocodingResponse response = restTemplate.getForObject(url, GeocodingResponse.class);
            log.debug("Response from Open-Meteo Geocoding API: {}", response);
            if (response != null && response.getResults() != null && !response.getResults().isEmpty()) {
                GeocodingResponse.GeocodingResult result = response.getResults().get(0);
                return weatherMapper.toGeocodingResponse(result);
            }
            return null;
        } catch (Exception e) {
            log.error("Error geocoding location '{}': {}", cityName, e.getMessage());
            return null;
        }
    }

    /**
     * Get current weather data for a location
     */
    @Cacheable(value = "currentWeather", key = "#latitude + '-' + #longitude")
    public WeatherData getCurrentWeather(double latitude, double longitude) {
        try {
            String url = UriComponentsBuilder.fromUriString(OPEN_METEO_FORECAST_URL)
                    .queryParam("latitude", latitude)
                    .queryParam("longitude", longitude)
                    .queryParam("current", "temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m")
                    .queryParam("timezone", "auto")
                    .encode()
                    .toUriString();

            OpenMeteoWeatherResponse response = restTemplate.getForObject(url, OpenMeteoWeatherResponse.class);
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
     * Get weather forecast for a location
     */
    @Cacheable(value = "forecast", key = "#latitude + '-' + #longitude + '-' + #days")
    public WeatherForecast getWeatherForecast(double latitude, double longitude, Integer days, Integer hours) {
        try {
            String url = UriComponentsBuilder.fromUriString(OPEN_METEO_FORECAST_URL)
                    .queryParam("latitude", latitude)
                    .queryParam("longitude", longitude)
                    .queryParam("current", "temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m")
                    .queryParam("daily", "weather_code,temperature_2m_max,temperature_2m_min")
                    .queryParam("hourly", "weather_code,temperature_2m,wind_speed_10m,relative_humidity_2m")
                    .queryParam("forecast_days", days)
                    .queryParam("forecast_hours", hours)
                    .queryParam("timezone", "auto")
                    .encode()
                    .toUriString();

            OpenMeteoWeatherResponse response = restTemplate.getForObject(url, OpenMeteoWeatherResponse.class);
            log.debug("Response from Open-Meteo Forecast : {}", response);
            if (response == null || response.getDaily() == null) {
                return null;
            }
            // Create context wrapper objects and pass them to the mapper
            WeatherMapper.DaysContext daysContext = new WeatherMapper.DaysContext(days);
            WeatherMapper.HoursContext hoursContext = new WeatherMapper.HoursContext(hours);
            return weatherMapper.toWeatherForecast(response, daysContext, hoursContext);
        } catch (Exception e) {
            log.error("Error fetching weather forecast for lat: {}, lon: {}, days: {}: {}", latitude, longitude, days, e.getMessage());
            return null;
        }
    }

    /**
     * Get air quality data for a location
     */
    @Cacheable(value = "airQuality", key = "#latitude + '-' + #longitude")
    public AirQualityData getAirQuality(double latitude, double longitude) {
        try {
            String url = UriComponentsBuilder.fromUriString(OPEN_METEO_AIR_QUALITY_URL)
                    .queryParam("latitude", latitude)
                    .queryParam("longitude", longitude)
                    .queryParam("current", "pm10,pm2_5,european_aqi")
                    .encode()
                    .toUriString();
            OpenMeteoAirQuality response = restTemplate.getForObject(url, OpenMeteoAirQuality.class);
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


    /**
     * Get air quality description based on European AQI
     */
    private String getAirQualityDescription(double aqi) {
        if (aqi < 20) {
            return "Good";
        } else if (aqi < 40) {
            return "Fair";
        } else if (aqi < 60) {
            return "Moderate";
        } else if (aqi < 80) {
            return "Poor";
        } else if (aqi < 100) {
            return "Very Poor";
        } else {
            return "Extremely Poor";
        }
    }

    /**
     * Get weather description based on weather code
     */
    private String getWeatherDescription(int weatherCode) {
        // Implement mapping from weather code to description
        // This is a simplified example, you may want to use an enum or a more complex mapping
        switch (weatherCode) {
            case 0:
                return "Clear sky";
            case 1:
                return "Mainly clear";
            case 2:
                return "Partly cloudy";
            case 3:
                return "Overcast";
            case 45:
            case 48:
                return "Fog";
            case 51:
            case 53:
            case 55:
                return "Drizzle";
            case 61:
            case 63:
            case 65:
                return "Rain";
            case 71:
            case 73:
            case 75:
                return "Snow";
            case 80:
            case 81:
            case 82:
                return "Rain showers";
            case 85:
            case 86:
                return "Snow showers";
            case 95:
            case 96:
            case 99:
                return "Thunderstorm";
            default:
                return "Unknown";
        }
    }
}
