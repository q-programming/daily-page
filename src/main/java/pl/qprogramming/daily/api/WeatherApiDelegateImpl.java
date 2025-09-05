package pl.qprogramming.daily.api;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import pl.qprogramming.daily.dto.AirQualityData;
import pl.qprogramming.daily.dto.GeocodingResult;
import pl.qprogramming.daily.dto.WeatherForecast;
import pl.qprogramming.daily.dto.WeatherProvider;
import pl.qprogramming.daily.service.weather.AccuWeatherService;
import pl.qprogramming.daily.service.weather.GeoCodingService;
import pl.qprogramming.daily.service.weather.OpenWeatherService;

import java.math.BigDecimal;

@Service
@Slf4j
class WeatherApiDelegateImpl implements WeatherApiDelegate {

    private final OpenWeatherService openWeatherService;
    private final AccuWeatherService accuWeatherService;
    private final GeoCodingService geoCodingService;

    /**
     * Constructor that injects both weather services and configuration.
     */
    public WeatherApiDelegateImpl(
            OpenWeatherService openWeatherService,
            AccuWeatherService accuWeatherService,
            GeoCodingService geoCodingService) {
        this.openWeatherService = openWeatherService;
        this.accuWeatherService = accuWeatherService;
        this.geoCodingService = geoCodingService;
    }

    @Override
    public ResponseEntity<GeocodingResult> geocodeLocation(String name, String language, WeatherProvider provider, Integer count) {
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        String lang = language != null ? language : "en";
        int limit = count != null ? count : 1;
        GeocodingResult result;
        if (provider == WeatherProvider.ACCUWEATHER) {
            result = geoCodingService.getAccuLocationKey(name, lang);
        } else {
            result = geoCodingService.geocodeLocation(name, lang, limit);
        }
        if (result == null) {
            return ResponseEntity.ok().build();
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
    public ResponseEntity<WeatherForecast> getAccuWeatherForecast(BigDecimal locationKey, Integer days, Integer hours) {
        if (locationKey == null) {
            return ResponseEntity.badRequest().build();
        }
        val forecast = accuWeatherService.getWeatherForecast(locationKey.toPlainString(), days, hours);
        if (forecast == null) {
            return ResponseEntity.internalServerError().build();
        }
        return ResponseEntity.ok(forecast);
    }

    @Override
    public ResponseEntity<WeatherForecast> getOpenWeatherForecast(Double lat, Double lon, Integer days, Integer hours) {
        if (lat == null || lon == null) {
            return ResponseEntity.badRequest().build();
        }
        log.debug("Using OpenMeteo provider for forecast");
        val forecast = openWeatherService.getWeatherForecast(lat, lon, days, hours);
        if (forecast == null) {
            return ResponseEntity.internalServerError().build();
        }
        return ResponseEntity.ok(forecast);
    }
}
