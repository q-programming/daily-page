package pl.qprogramming.daily.service.weather.model.accuweather;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.ZonedDateTime;
import java.util.List;

/**
 * Model representing the hourly forecast from AccuWeather API.
 */
@Data
public class AccuWeatherHourlyForecast {

    private List<HourlyForecastItem> hourlyForecasts;

    @Data
    public static class HourlyForecastItem {
        @JsonProperty("DateTime")
        private ZonedDateTime dateTime;

        @JsonProperty("WeatherIcon")
        private Integer weatherIcon;

        @JsonProperty("IconPhrase")
        private String iconPhrase;

        @JsonProperty("HasPrecipitation")
        private Boolean hasPrecipitation;

        @JsonProperty("IsDaylight")
        private Boolean isDaylight;

        @JsonProperty("Temperature")
        private Temperature temperature;

        @JsonProperty("Wind")
        private Wind wind;

        @JsonProperty("RelativeHumidity")
        private Integer relativeHumidity;

        @Data
        public static class Temperature {
            @JsonProperty("Value")
            private Double value;

            @JsonProperty("Unit")
            private String unit;
        }

        @Data
        public static class Wind {
            @JsonProperty("Speed")
            private Speed speed;

            @JsonProperty("Direction")
            private Direction direction;

            @Data
            public static class Speed {
                @JsonProperty("Value")
                private Double value;

                @JsonProperty("Unit")
                private String unit;
            }

            @Data
            public static class Direction {
                @JsonProperty("Degrees")
                private Integer degrees;

                @JsonProperty("Localized")
                private String localized;
            }
        }
    }
}
