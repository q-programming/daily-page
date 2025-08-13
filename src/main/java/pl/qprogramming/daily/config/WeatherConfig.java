package pl.qprogramming.daily.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
@EnableCaching
public class WeatherConfig {

    @Bean
    public RestTemplate weatherRestTemplate() {
        return new RestTemplate();
    }

    @Bean
    public CacheManager weatherCacheManager() {
        return new ConcurrentMapCacheManager("geocoding", "weather", "forecast", "airQuality");
    }
}
