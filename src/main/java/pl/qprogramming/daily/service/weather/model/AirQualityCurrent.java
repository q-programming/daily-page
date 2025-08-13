package pl.qprogramming.daily.service.weather.model;

import lombok.Data;

/**
 * Model for the Open-Meteo air quality current data
 */
@Data
public class AirQualityCurrent {
    private String time;
    private double pm10;
    private double pm2_5;
    private double european_aqi;
}
