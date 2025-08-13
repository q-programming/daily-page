package pl.qprogramming.daily.service.weather.mapper;

import lombok.Getter;
import org.mapstruct.*;
import pl.qprogramming.daily.dto.*;
import pl.qprogramming.daily.service.weather.model.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface WeatherMapper {
    // Wrapper classes to make context parameter types unique
    @Getter
    class DaysContext {
        private final Integer days;
        public DaysContext(Integer days) {
            this.days = days;
        }
    }

    @Getter
    class HoursContext {
        private final Integer hours;
        public HoursContext(Integer hours) {
            this.hours = hours;
        }
    }

    @Mapping(source = "response.relative_humidity_2m", target = "humidity")
    @Mapping(source = "response.temperature_2m", target = "temperature")
    @Mapping(source = "response.wind_speed_10m", target = "windSpeed")
    @Mapping(source = "response.weather_code", target = "weatherCode")
    CurrentWeather toCurrentWeather(OpenMeteoCurrentWeather response);

    @Mapping(source = "response.latitude", target = "location.lat")
    @Mapping(source = "response.longitude", target = "location.lon")
    @Mapping(source = "response.daily", target = "forecast", qualifiedByName = "dailyToForecastList")
    @Mapping(source = "response.hourly", target = "hourly", qualifiedByName = "hourlyToHourlyForecastList")
    @Mapping(source = "response.current", target = "current")
    WeatherForecast toWeatherForecast(OpenMeteoWeatherResponse response, @Context DaysContext daysContext, @Context HoursContext hoursContext);

    @Mapping(source = "response.latitude", target = "location.lat")
    @Mapping(source = "response.longitude", target = "location.lon")
    @Mapping(source = "response.current.weather_code", target = "current.weatherCode")
    @Mapping(source = "response.current.temperature_2m", target = "current.temperature")
    @Mapping(source = "response.current.wind_speed_10m", target = "current.windSpeed")
    @Mapping(source = "response.current.relative_humidity_2m", target = "current.humidity")
    WeatherData toWeatherData(OpenMeteoWeatherResponse response);

    @Named("dailyToForecastList")
    default List<Forecast> dailyToForecastList(OpenMeteoDailyWeather daily, @Context DaysContext daysContext) {
        if (daily == null || daily.getTime() == null || daily.getTime().isEmpty()) {
            return new ArrayList<>();
        }

        Integer days = daysContext != null ? daysContext.getDays() : null;
        int size = Math.min(days != null ? days : Integer.MAX_VALUE, daily.getTime().size());

        return IntStream.range(0, size)
                .mapToObj(i -> {
                    Forecast forecast = new Forecast();

                    // Set date
                    if (daily.getTime() != null && i < daily.getTime().size()) {
                        forecast.setDate(stringToLocalDate(daily.getTime(), i));
                    }

                    // Set tempMin
                    if (daily.getTemperature_2m_min() != null && i < daily.getTemperature_2m_min().size()) {
                        forecast.setTempMin(daily.getTemperature_2m_min().get(i));
                    }

                    // Set tempMax
                    if (daily.getTemperature_2m_max() != null && i < daily.getTemperature_2m_max().size()) {
                        forecast.setTempMax(daily.getTemperature_2m_max().get(i));
                    }

                    // Set weatherCode
                    if (daily.getWeather_code() != null && i < daily.getWeather_code().size()) {
                        forecast.setWeatherCode(daily.getWeather_code().get(i));
                    }

                    return forecast;
                })
                .collect(Collectors.toList());
    }

    @Named("hourlyToHourlyForecastList")
    default List<HourlyForecast> hourlyToHourlyForecastList(OpenMeteoHourlyWeather hourly, @Context HoursContext hoursContext) {
        if (hourly == null || hourly.getTime() == null || hourly.getTime().isEmpty()) {
            return new ArrayList<>();
        }

        Integer hours = hoursContext != null ? hoursContext.getHours() : null;
        int size = Math.min(hours != null ? hours : Integer.MAX_VALUE, hourly.getTime().size());

        return IntStream.range(0, size)
                .mapToObj(i -> {
                    HourlyForecast forecast = new HourlyForecast();

                    // Set time
                    if (hourly.getTime() != null && i < hourly.getTime().size()) {
                        forecast.setTime(stringToOffsetDateTime(hourly.getTime(), i));
                    }

                    // Set temperature
                    if (hourly.getTemperature_2m() != null && i < hourly.getTemperature_2m().size()) {
                        forecast.setTemperature(hourly.getTemperature_2m().get(i));
                    }

                    // Set weatherCode
                    if (hourly.getWeather_code() != null && i < hourly.getWeather_code().size()) {
                        forecast.setWeatherCode(hourly.getWeather_code().get(i));
                    }

                    // Set windSpeed
                    if (hourly.getWind_speed_10m() != null && i < hourly.getWind_speed_10m().size()) {
                        forecast.setWindSpeed(hourly.getWind_speed_10m().get(i));
                    }

                    // Set humidity
                    if (hourly.getRelative_humidity_2m() != null && i < hourly.getRelative_humidity_2m().size()) {
                        forecast.setHumidity(hourly.getRelative_humidity_2m().get(i));
                    }

                    return forecast;
                })
                .collect(Collectors.toList());
    }

    @Mapping(source = "response.latitude", target = "location.lat")
    @Mapping(source = "response.longitude", target = "location.lon")
    @Mapping(source = "response.current.european_aqi", target = "airQuality.aqi")
    @Mapping(source = "response.current.pm10", target = "airQuality.pm10")
    @Mapping(source = "response.current.pm2_5", target = "airQuality.pm25")
    @Mapping(source = "response.current.european_aqi", target = "airQuality.description")
    AirQualityData toAirQualityData(OpenMeteoAirQuality response);

    @Mapping(source = "name", target = "name")
    @Mapping(source = "latitude", target = "latitude")
    @Mapping(source = "longitude", target = "longitude")
    @Mapping(source = "country", target = "country")
    @Mapping(source = "timezone", target = "timezone")
    GeocodingResult toGeocodingResponse(GeocodingResponse.GeocodingResult response);

    @Named("stringToLocalDate")
    default LocalDate stringToLocalDate(List<String> dates, int index) {
        if (dates != null && index < dates.size()) {
            return LocalDate.parse(dates.get(index));
        }
        return null;
    }

    @Named("stringToOffsetDateTime")
    default OffsetDateTime stringToOffsetDateTime(List<String> times, int index) {
        if (times != null && index < times.size()) {
            String timeStr = times.get(index);
            try {
                // Try parsing as OffsetDateTime directly (if it has offset info)
                return OffsetDateTime.parse(timeStr);
            } catch (Exception e) {
                // If direct parsing fails, parse as LocalDateTime and convert to OffsetDateTime with system default zone
                if (timeStr.length() == 16) { // Format like "2025-08-13T11:00"
                    return java.time.LocalDateTime.parse(timeStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                            .atZone(java.time.ZoneId.systemDefault())
                            .toOffsetDateTime();
                } else {
                    // Try other formats if needed
                    return java.time.LocalDateTime.parse(timeStr)
                            .atZone(java.time.ZoneId.systemDefault())
                            .toOffsetDateTime();
                }
            }
        }
        return null;
    }

    /**
     * Converts time string in ISO format to hour of day (0-23)
     */
    @Named("extractHourOfDay")
    default Integer extractHourOfDay(List<String> times, int index) {
        if (times != null && index < times.size()) {
            OffsetDateTime dateTime = OffsetDateTime.parse(times.get(index));
            return dateTime.getHour();
        }
        return null;
    }

    /**
     * Converts time string in ISO format to a formatted time string (e.g., "14:30")
     */
    @Named("formatTimeOfDay")
    default String formatTimeOfDay(List<String> times, int index) {
        if (times != null && index < times.size()) {
            OffsetDateTime dateTime = OffsetDateTime.parse(times.get(index));
            return dateTime.format(DateTimeFormatter.ofPattern("HH:mm"));
        }
        return null;
    }

    /**
     * Helper method to determine air quality description based on AQI value
     */
    default String getAirQualityDescription(Integer aqi) {
        if (aqi == null) {
            return "Unknown";
        } else if (aqi <= 20) {
            return "Good";
        } else if (aqi <= 40) {
            return "Fair";
        } else if (aqi <= 60) {
            return "Moderate";
        } else if (aqi <= 80) {
            return "Poor";
        } else if (aqi <= 100) {
            return "Very Poor";
        } else {
            return "Extremely Poor";
        }
    }
}
