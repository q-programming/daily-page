package pl.qprogramming.daily.service.weather.model;

import lombok.Data;

/**
 * Model for the Open-Meteo air quality response
 */
@Data
public class OpenMeteoAirQuality {
    private AirQualityCurrent current;
    private AirQualityHourly hourly;
    private double latitude;
    private double longitude;
    private double elevation;
    private String timezone;
}
