package pl.qprogramming.daily.api;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import pl.qprogramming.daily.service.weather.WeatherService;
import pl.qprogramming.daily.dto.AirQualityData;
import pl.qprogramming.daily.dto.GeocodingResult;
import pl.qprogramming.daily.dto.WeatherData;
import pl.qprogramming.daily.dto.WeatherForecast;

@Service
@RequiredArgsConstructor
class WeatherApiDelegateImpl implements WeatherApiDelegate {

    private final WeatherService weatherService;

    @Override
    public ResponseEntity<GeocodingResult> geocodeLocation(String name, String language, Integer count) {
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // Use default values if not provided
        String lang = language != null ? language : "en";
        int limit = count != null ? count : 1;

        GeocodingResult result = weatherService.geocodeLocation(name, lang, limit);

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

        AirQualityData airQualityData = weatherService.getAirQuality(lat, lon);

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

        WeatherData weatherData = weatherService.getCurrentWeather(lat, lon);

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

        WeatherForecast forecast = weatherService.getWeatherForecast(lat, lon, days, hours);

        if (forecast == null) {
            return ResponseEntity.internalServerError().build();
        }

        return ResponseEntity.ok(forecast);
    }
}
