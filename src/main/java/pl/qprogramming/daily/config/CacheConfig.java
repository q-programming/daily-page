package pl.qprogramming.daily.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

/**
 * Configuration for application caching and related services.
 * <p>
 * This class configures:
 * - RestTemplate for making API calls to external services
 * - Cache configuration with different expiration times:
 *   - Weather caches: 1 hour expiration
 *   - Calendar caches: 5 minutes expiration
 * </p>
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Constants for cache names.
     */
    public static class CacheNames {
        // Weather caches - 1 hour expiration
        public static final String GEOCODING = "geocoding";
        public static final String CURRENT_WEATHER = "currentWeather";
        public static final String FORECAST = "forecast";
        public static final String AIR_QUALITY = "airQuality";

        // Calendar caches - 5 minutes expiration
        public static final String CALENDAR_LIST = "calendarList";
        public static final String CALENDAR_EVENTS = "calendarEvents";

        private CacheNames() {
            // Prevent instantiation
        }
    }

    /**
     * Configures the primary cache manager with 1 hour expiration time for weather data.
     *
     * @return CacheManager for weather-related caches
     */
    @Bean
    @Primary
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCacheNames(Arrays.asList(
                CacheNames.GEOCODING,
                CacheNames.CURRENT_WEATHER,
                CacheNames.FORECAST,
                CacheNames.AIR_QUALITY
        ));
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(1, TimeUnit.HOURS)
                .initialCapacity(10)
                .maximumSize(100));
        return cacheManager;
    }

    /**
     * Configures a secondary cache manager with 5 minute expiration time for calendar data.
     *
     * @return CacheManager for calendar-related caches
     */
    @Bean
    public CacheManager calendarCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCacheNames(Arrays.asList(
                CacheNames.CALENDAR_LIST,
                CacheNames.CALENDAR_EVENTS
        ));
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .initialCapacity(10)
                .maximumSize(100));
        return cacheManager;
    }
}
