package pl.qprogramming.daily.service.weather.model;

import lombok.Data;
import java.util.List;

/**
 * Model for the Open-Meteo daily weather data
 */
@Data
public class OpenMeteoDailyWeather {
    private List<String> time;
    private List<Double> temperature_2m_max;
    private List<Double> temperature_2m_min;
    private List<Integer> weather_code;
}
