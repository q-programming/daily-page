package pl.qprogramming.daily.service.weather.model.accuweather;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Model representing the location information returned by AccuWeather API.
 */
@Data
public class AccuWeatherLocation {

    @JsonProperty("Key")
    private String key;

    @JsonProperty("LocalizedName")
    private String localizedName;

    @JsonProperty("Country")
    private AccuWeatherCountry country;

    @JsonProperty("AdministrativeArea")
    private AccuWeatherAdministrativeArea administrativeArea;

    @JsonProperty("GeoPosition")
    private AccuWeatherGeoPosition geoPosition;

    @Data
    public static class AccuWeatherCountry {
        @JsonProperty("ID")
        private String id;

        @JsonProperty("LocalizedName")
        private String localizedName;
    }

    @Data
    public static class AccuWeatherAdministrativeArea {
        @JsonProperty("ID")
        private String id;

        @JsonProperty("LocalizedName")
        private String localizedName;
    }

    @Data
    public static class AccuWeatherGeoPosition {
        @JsonProperty("Latitude")
        private double latitude;

        @JsonProperty("Longitude")
        private double longitude;
    }
}
