package pl.qprogramming.daily.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for AccuWeather API.
 */
@Configuration
@ConfigurationProperties(prefix = "accuweather")
public class AccuWeatherConfig {
    private String apiKey;
    private String locationUrl;
    private String currentConditionsUrl;
    private String forecastUrl;
    private String hourlyForecastUrl;

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getLocationUrl() {
        return locationUrl;
    }

    public void setLocationUrl(String locationUrl) {
        this.locationUrl = locationUrl;
    }

    public String getCurrentConditionsUrl() {
        return currentConditionsUrl;
    }

    public void setCurrentConditionsUrl(String currentConditionsUrl) {
        this.currentConditionsUrl = currentConditionsUrl;
    }

    public String getForecastUrl() {
        return forecastUrl;
    }

    public void setForecastUrl(String forecastUrl) {
        this.forecastUrl = forecastUrl;
    }

    public String getHourlyForecastUrl() {
        return hourlyForecastUrl;
    }

    public void setHourlyForecastUrl(String hourlyForecastUrl) {
        this.hourlyForecastUrl = hourlyForecastUrl;
    }
}
