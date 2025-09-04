package pl.qprogramming.daily.service.weather.model.openweather;

import lombok.Data;

/**
 * Model for the Open-Meteo current weather data
 */
@Data
public class OpenMeteoCurrentWeather {
    private double temperature_2m;
    private double wind_speed_10m;
    private int relative_humidity_2m;
    private String time;
    private int weather_code;
}
