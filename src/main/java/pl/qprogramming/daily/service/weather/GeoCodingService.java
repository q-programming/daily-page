package pl.qprogramming.daily.service.weather;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import pl.qprogramming.daily.config.AccuWeatherConfig;
import pl.qprogramming.daily.dto.GeocodingResult;
import pl.qprogramming.daily.service.weather.mapper.GeoCodingMapper;
import pl.qprogramming.daily.service.weather.model.GeocodingResponse;
import pl.qprogramming.daily.service.weather.model.accuweather.AccuWeatherLocation;

import static pl.qprogramming.daily.config.CacheConfig.CacheNames.ACCU_GEOCODING_CACHE;
import static pl.qprogramming.daily.config.CacheConfig.CacheNames.GEOCODING_CACHE;
import static pl.qprogramming.daily.service.weather.WeatherConstants.*;

@Slf4j
@Service
public class GeoCodingService {

    private final RestTemplate restTemplate;
    private final GeoCodingMapper geoCodingMapper;
    private final AccuWeatherConfig config;

    public GeoCodingService(GeoCodingMapper goecodingMapper, AccuWeatherConfig config) {
        this.config = config;
        this.restTemplate = new RestTemplate();
        this.geoCodingMapper = goecodingMapper;
    }

    /**
     * Gets geocoding data for a city name.
     *
     * @param cityName Name of the city to geocode
     * @param language Language code for the response (defaults to "en" if null)
     * @param count Maximum number of results to return
     * @return GeocodingResult containing location data or null if not found or error occurs
     */
    @Cacheable(value = GEOCODING_CACHE, key = "#cityName + '-' + #language")
    public GeocodingResult geocodeLocation(String cityName, String language, int count) {
        if (cityName == null || cityName.trim().isEmpty()) {
            return null;
        }

        // Build the URL manually to preserve Polish characters instead of encoding them
        String baseUrl = OPEN_METEO_GEOCODING_URL + "?";
        String params = PARAM_NAME + "=" + cityName + "&" +
                PARAM_LANGUAGE + "=" + (language != null ? language : DEFAULT_LANGUAGE) + "&" +
                PARAM_COUNT + "=" + count;
        String url = baseUrl + params;

        try {
            val response = restTemplate.getForObject(url, GeocodingResponse.class);
            log.debug("Response from Open-Meteo Geocoding API: {}", response);
            if (response != null && response.getResults() != null && !response.getResults().isEmpty()) {
                val result = response.getResults().get(0);
                return geoCodingMapper.toGeocodingResponse(result);
            }
            return null;
        } catch (Exception e) {
            log.error("Error geocoding location '{}': {}", cityName, e.getMessage());
            return null;
        }
    }

    /**
     * Gets the location (including key) by city name using AccuWeather city search API.
     * AccuWeather returns an array of locations, we take the first one.
     */
    @Cacheable(value = ACCU_GEOCODING_CACHE, key = "#cityName + '-' + #language")
    public GeocodingResult getAccuLocationKey(String cityName, String language) {
        try {
            String url = UriComponentsBuilder.fromUriString(ACCU_WEATHER_CITY_SEARCH_URL)
                    .queryParam("apikey", config.getApiKey())
                    .queryParam("q", cityName)
                    .queryParam("language", language != null ? language : DEFAULT_LANGUAGE)
                    .encode()
                    .toUriString();

            log.debug("Requesting location key from AccuWeather for city: {}", cityName);
            val response = restTemplate.getForObject(url, AccuWeatherLocation[].class);
            if (response != null && response.length > 0) {
                return geoCodingMapper.toGeocodingResponse(response[0]);
            }
            return null;
        } catch (Exception e) {
            log.error("Error fetching location key from AccuWeather for city '{}': {}", cityName, e.getMessage());
            return null;
        }
    }

    /**
     * Retrieves location details by location key.
     * @deprecated don't use as it drains api usage quota very fast
     */
    @Cacheable(value = "accuweatherLocationDetails", key = "#locationKey + '-' + #language")
    public AccuWeatherLocation getAccuLocationDetails(String locationKey, String language) {
        try {
            String url = UriComponentsBuilder.fromUriString(ACCU_WEATHER_CURRENT_CONDITIONS_URL)
                    // go up to base host and use locations details endpoint
                    .replacePath("/locations/v1/" + locationKey)
                    .queryParam("apikey", config.getApiKey())
                    .queryParam("language", language != null ? language : DEFAULT_LANGUAGE)
                    .encode()
                    .toUriString();

            log.debug("Requesting location details from AccuWeather for key: {}", locationKey);
            return restTemplate.getForObject(url, AccuWeatherLocation.class);
        } catch (Exception e) {
            log.error("Error fetching location details from AccuWeather for key {}: {}", locationKey, e.getMessage());
            return null;
        }
    }
}
