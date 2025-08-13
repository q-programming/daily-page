package pl.qprogramming.daily.service.weather.model;

import lombok.Data;
import java.util.List;

/**
 * Model for the Open-Meteo hourly air quality data
 */
@Data
public class AirQualityHourly {
    private List<String> time;
    private List<Double> pm10;
    private List<Double> pm2_5;
    private List<Double> european_aqi;
}
