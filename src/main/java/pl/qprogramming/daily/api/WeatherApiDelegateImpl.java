package pl.qprogramming.daily.api;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import pl.qprogramming.daily.dto.*;
import pl.qprogramming.daily.service.weather.AccuWeatherService;
import pl.qprogramming.daily.service.weather.GeoCodingService;
import pl.qprogramming.daily.service.weather.OpenWeatherService;

@Service
@Slf4j
class WeatherApiDelegateImpl implements WeatherApiDelegate {

    private final OpenWeatherService openWeatherService;
    private final AccuWeatherService accuWeatherService;
    private final GeoCodingService geoCodingService;
    private final String weatherProvider;

    /**
     * Constructor that injects both weather services and configuration.
     */
    public WeatherApiDelegateImpl(
            OpenWeatherService openWeatherService,
            AccuWeatherService accuWeatherService,
            GeoCodingService geoCodingService,
            @Value("${weather.provider:openmeteo}") String weatherProvider) {
        this.openWeatherService = openWeatherService;
        this.accuWeatherService = accuWeatherService;
        this.geoCodingService = geoCodingService;
        this.weatherProvider = weatherProvider;
        log.info("Weather API initialized with provider: {}", weatherProvider);
    }

    @Override
    public ResponseEntity<GeocodingResult> geocodeLocation(String name, String language, Integer count) {
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // Use default values if not provided
        String lang = language != null ? language : "en";
        int limit = count != null ? count : 1;

        GeocodingResult result = geoCodingService.geocodeLocation(name, lang, limit);

        if (result == null) {
            return ResponseEntity.ok().build(); // Return empty result, not an error
        }

        return ResponseEntity.ok(result);
    }

    @Override
    public ResponseEntity<AirQualityData> getAirQuality(Double lat, Double lon) {
        if (lat == null || lon == null) {
            return ResponseEntity.badRequest().build();
        }

        // Currently only OpenWeather service supports air quality data
        AirQualityData airQualityData = openWeatherService.getAirQuality(lat, lon);

        if (airQualityData == null) {
            return ResponseEntity.internalServerError().build();
        }

        return ResponseEntity.ok(airQualityData);
    }

    @Override
    public ResponseEntity<WeatherData> getCurrentWeather(Double lat, Double lon) {
        if (lat == null || lon == null) {
            return ResponseEntity.badRequest().build();
        }

        WeatherData weatherData;
        if (shouldUseAccuWeather()) {
            log.debug("Using AccuWeather provider for current weather");
            return ResponseEntity.ok().build();
        } else {
            weatherData = openWeatherService.getCurrentWeather(lat, lon);
        }

        if (weatherData == null) {
            return ResponseEntity.internalServerError().build();
        }

        return ResponseEntity.ok(weatherData);
    }

    @Override
    public ResponseEntity<WeatherForecast> getWeatherForecast(Double lat, Double lon, Integer days, Integer hours) {
        if (lat == null || lon == null) {
            return ResponseEntity.badRequest().build();
        }
        WeatherForecast forecast;
        if (shouldUseAccuWeather()) {
            log.debug("Using AccuWeather provider for forecast");
            forecast = accuWeatherService.getWeatherForecast(lat, lon, days, hours);
        } else {
            log.debug("Using OpenMeteo provider for forecast");
            forecast = openWeatherService.getWeatherForecast(lat, lon, days, hours);
        }

        if (forecast == null) {
            return ResponseEntity.internalServerError().build();
        }

        return ResponseEntity.ok(forecast);
    }

    /**
     * Determines if AccuWeather should be used based on configuration.
     *
     * @return true if AccuWeather should be used, false otherwise
     */
    private boolean shouldUseAccuWeather() {
        return WeatherProvider.ACCUWEATHER.equals(WeatherProvider.fromValue(weatherProvider));
    }
}
