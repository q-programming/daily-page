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
        public static final String GEOCODING_CACHE = "geocoding";
        public static final String ACCU_GEOCODING_CACHE = "accu_geocoding";
        public static final String FORECAST_CACHE = "forecast";
        public static final String ACCU_FORECAST_CACHE = "accu_forecast";
        public static final String AIR_QUALITY_CACHE = "airQuality";

        // Calendar caches - 5 minutes expiration
        public static final String CALENDAR_LIST_CACHE = "calendarList";
        public static final String CALENDAR_EVENTS_CACHE = "calendarEvents";

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
                CacheNames.GEOCODING_CACHE,
                CacheNames.ACCU_GEOCODING_CACHE,
                CacheNames.FORECAST_CACHE,
                CacheNames.ACCU_FORECAST_CACHE,
                CacheNames.AIR_QUALITY_CACHE
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
                CacheNames.CALENDAR_LIST_CACHE,
                CacheNames.CALENDAR_EVENTS_CACHE
        ));
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .initialCapacity(10)
                .maximumSize(100));
        return cacheManager;
    }
}
