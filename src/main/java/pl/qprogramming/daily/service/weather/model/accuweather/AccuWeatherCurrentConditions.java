package pl.qprogramming.daily.service.weather.model.accuweather;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.ZonedDateTime;

/**
 * Model representing the current weather conditions from AccuWeather API.
 */
@Data
public class AccuWeatherCurrentConditions {

    @JsonProperty("LocalObservationDateTime")
    private ZonedDateTime localObservationDateTime;

    @JsonProperty("WeatherIcon")
    private Integer weatherIcon;

    @JsonProperty("WeatherText")
    private String weatherText;

    @JsonProperty("Temperature")
    private AccuWeatherTemperature temperature;

    @JsonProperty("RelativeHumidity")
    private Integer relativeHumidity;

    @JsonProperty("Wind")
    private AccuWeatherWind wind;

    @JsonProperty("UVIndex")
    private Integer uvIndex;

    @Data
    public static class AccuWeatherTemperature {
        @JsonProperty("Metric")
        private AccuWeatherTemperatureUnit metric;

        @JsonProperty("Imperial")
        private AccuWeatherTemperatureUnit imperial;
    }

    @Data
    public static class AccuWeatherTemperatureUnit {
        @JsonProperty("Value")
        private Double value;

        @JsonProperty("Unit")
        private String unit;
    }

    @Data
    public static class AccuWeatherWind {
        @JsonProperty("Direction")
        private AccuWeatherWindDirection direction;

        @JsonProperty("Speed")
        private AccuWeatherWindSpeed speed;
    }

    @Data
    public static class AccuWeatherWindDirection {
        @JsonProperty("Degrees")
        private Integer degrees;

        @JsonProperty("Localized")
        private String localized;
    }

    @Data
    public static class AccuWeatherWindSpeed {
        @JsonProperty("Metric")
        private AccuWeatherWindSpeedUnit metric;

        @JsonProperty("Imperial")
        private AccuWeatherWindSpeedUnit imperial;
    }

    @Data
    public static class AccuWeatherWindSpeedUnit {
        @JsonProperty("Value")
        private Double value;

        @JsonProperty("Unit")
        private String unit;
    }
}
