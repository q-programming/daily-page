package pl.qprogramming.daily.service.weather.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import pl.qprogramming.daily.dto.*;
import pl.qprogramming.daily.service.weather.model.accuweather.AccuWeatherCurrentConditions;
import pl.qprogramming.daily.service.weather.model.accuweather.AccuWeatherDailyForecast;
import pl.qprogramming.daily.service.weather.model.accuweather.AccuWeatherHourlyForecast;
import pl.qprogramming.daily.service.weather.model.accuweather.AccuWeatherLocation;

import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.List;

/**
 * MapStruct mapper for converting AccuWeather API models to application DTOs.
 */
@Mapper(componentModel = "spring")
public interface AccuWeatherMapper {

    @Mapping(source = "key", target = "id")
    @Mapping(source = "localizedName", target = "name")
    @Mapping(source = "country.localizedName", target = "country")
    @Mapping(source = "administrativeArea.localizedName", target = "state")
    @Mapping(source = "geoPosition.latitude", target = "lat")
    @Mapping(source = "geoPosition.longitude", target = "lon")
    Location mapLocation(AccuWeatherLocation location);

    /**
     * Maps an AccuWeatherCurrentConditions to a CurrentWeather object.
     */
    @Mapping(source = "temperature.metric.value", target = "temperature")
    @Mapping(source = "weatherIcon", target = "weatherCode")
    @Mapping(source = "wind.speed.metric.value", target = "windSpeed")
    @Mapping(source = "relativeHumidity", target = "humidity")
    CurrentWeather mapToCurrentWeather(AccuWeatherCurrentConditions conditions);

    /**
     * Maps an AccuWeatherCurrentConditions to a WeatherData object.
     */
    default WeatherData mapToWeatherData(AccuWeatherLocation location, AccuWeatherCurrentConditions conditions) {
        if (conditions == null) {
            return new WeatherData();
        }

        WeatherData weatherData = new WeatherData();

        // Set location
        if (location != null) {
            weatherData.setLocation(mapLocation(location));
        }

        // Set current weather
        weatherData.setCurrent(mapToCurrentWeather(conditions));

        return weatherData;
    }

    @Mapping(source = "dateTime", target = "time", qualifiedByName = "zonedToOffsetDateTime")
    @Mapping(source = "temperature.value", target = "temperature")
    @Mapping(source = "weatherIcon", target = "weatherCode")
    @Mapping(source = "wind.speed.value", target = "windSpeed")
    @Mapping(source = "relativeHumidity", target = "humidity")
    HourlyForecast mapHourlyForecast(AccuWeatherHourlyForecast.HourlyForecastItem hourlyItem);

    List<HourlyForecast> mapHourlyForecasts(List<AccuWeatherHourlyForecast.HourlyForecastItem> hourlyItems);

    @Mapping(source = "date", target = "date", qualifiedByName = "zonedToLocalDate")
    @Mapping(source = "temperature.maximum.value", target = "tempMax")
    @Mapping(source = "temperature.minimum.value", target = "tempMin")
    @Mapping(source = "day.icon", target = "weatherCode")
    Forecast mapDailyForecast(AccuWeatherDailyForecast.DailyForecast dailyForecast);

    List<Forecast> mapDailyForecasts(List<AccuWeatherDailyForecast.DailyForecast> dailyForecasts);

    /**
     * Creates a complete WeatherForecast from AccuWeather API data.
     */
    default WeatherForecast createWeatherForecast(
            AccuWeatherLocation location,
            AccuWeatherCurrentConditions currentConditions,
            AccuWeatherDailyForecast dailyForecast,
            AccuWeatherHourlyForecast hourlyForecast) {

        WeatherForecast forecast = new WeatherForecast();

        // Map location
        if (location != null) {
            forecast.setLocation(mapLocation(location));
        }

        // Map current weather
        if (currentConditions != null) {
            CurrentWeather currentWeather = mapToCurrentWeather(currentConditions);
            forecast.setCurrent(currentWeather);
        }

        // Map daily forecasts
        if (dailyForecast != null && dailyForecast.getDailyForecasts() != null) {
            List<Forecast> dailyForecasts = mapDailyForecasts(dailyForecast.getDailyForecasts());
            forecast.setForecast(dailyForecasts);
        }

        // Map hourly forecasts
        if (hourlyForecast != null && hourlyForecast.getHourlyForecasts() != null) {
            List<HourlyForecast> hourlyForecasts = mapHourlyForecasts(hourlyForecast.getHourlyForecasts());
            forecast.setHourly(hourlyForecasts);
        }

        // Set provider
        forecast.setProvider(WeatherProvider.ACCUWEATHER);

        return forecast;
    }

    /**
     * Converts ZonedDateTime to OffsetDateTime.
     */
    @Named("zonedToOffsetDateTime")
    default OffsetDateTime zonedToOffsetDateTime(ZonedDateTime dateTime) {
        return dateTime != null ? dateTime.toOffsetDateTime() : null;
    }

    /**
     * Converts ZonedDateTime to LocalDate.
     */
    @Named("zonedToLocalDate")
    default java.time.LocalDate zonedToLocalDate(ZonedDateTime dateTime) {
        return dateTime != null ? dateTime.toLocalDate() : null;
    }
}
