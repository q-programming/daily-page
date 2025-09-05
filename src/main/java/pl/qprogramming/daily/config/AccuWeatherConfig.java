package pl.qprogramming.daily.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for AccuWeather API.
 */
@Configuration
@ConfigurationProperties(prefix = "accuweather")
@Getter
@Setter
public class AccuWeatherConfig {
    private String apiKey;
}
