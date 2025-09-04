package pl.qprogramming.daily.service.weather.model.openweather;

import lombok.Data;
import pl.qprogramming.daily.service.weather.model.AirQualityCurrent;
import pl.qprogramming.daily.service.weather.model.AirQualityHourly;

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
