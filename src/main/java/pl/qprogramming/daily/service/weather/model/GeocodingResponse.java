package pl.qprogramming.daily.service.weather.model;

import lombok.Data;
import java.util.List;

/**
 * Model for geocoding response from Open-Meteo
 */
@Data
public class GeocodingResponse {
    private List<GeocodingResult> results;

    @Data
    public static class GeocodingResult {
        private long id;
        private String name;
        private double latitude;
        private double longitude;
        private String country;
        private String country_code;
        private String admin1;
        private String timezone;
    }
}
