package pl.qprogramming.daily.service.weather.model;

import lombok.Data;
import java.util.List;

/**
 * Model for the Open-Meteo hourly weather data
 */
@Data
public class OpenMeteoHourlyWeather {
    private List<String> time;
    private List<Double> temperature_2m;
    private List<Double> wind_speed_10m;
    private List<Integer> relative_humidity_2m;
    private List<Integer> weather_code;
}
