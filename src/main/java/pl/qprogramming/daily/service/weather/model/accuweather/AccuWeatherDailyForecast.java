package pl.qprogramming.daily.service.weather.model.accuweather;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.ZonedDateTime;
import java.util.List;

/**
 * Model representing the daily forecast from AccuWeather API.
 */
@Data
public class AccuWeatherDailyForecast {

    @JsonProperty("Headline")
    private AccuWeatherHeadline headline;

    @JsonProperty("DailyForecasts")
    private List<DailyForecast> dailyForecasts;

    @Data
    public static class AccuWeatherHeadline {
        @JsonProperty("Text")
        private String text;

        @JsonProperty("Category")
        private String category;
    }

    @Data
    public static class DailyForecast {
        @JsonProperty("Date")
        private ZonedDateTime date;

        @JsonProperty("Temperature")
        private Temperature temperature;

        @JsonProperty("Day")
        private DayNight day;

        @JsonProperty("Night")
        private DayNight night;

        @Data
        public static class Temperature {
            @JsonProperty("Minimum")
            private TemperatureValue minimum;

            @JsonProperty("Maximum")
            private TemperatureValue maximum;

            @Data
            public static class TemperatureValue {
                @JsonProperty("Value")
                private Double value;

                @JsonProperty("Unit")
                private String unit;
            }
        }

        @Data
        public static class DayNight {
            @JsonProperty("Icon")
            private Integer icon;

            @JsonProperty("IconPhrase")
            private String iconPhrase;

            @JsonProperty("HasPrecipitation")
            private Boolean hasPrecipitation;

            @JsonProperty("PrecipitationType")
            private String precipitationType;

            @JsonProperty("PrecipitationIntensity")
            private String precipitationIntensity;
        }
    }
}
