package pl.qprogramming.daily.service.weather.model;

import lombok.Data;

/**
 * Model for the Open-Meteo weather response
 */
@Data
public class OpenMeteoWeatherResponse {
    private OpenMeteoCurrentWeather current;
    private OpenMeteoHourlyWeather hourly;
    private OpenMeteoDailyWeather daily;
    private double latitude;
    private double longitude;
    private double elevation;
    private String timezone;
}
