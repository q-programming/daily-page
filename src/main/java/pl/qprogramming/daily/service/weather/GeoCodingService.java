package pl.qprogramming.daily.service.weather;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import pl.qprogramming.daily.dto.GeocodingResult;
import pl.qprogramming.daily.service.weather.mapper.GeoCodingMapper;
import pl.qprogramming.daily.service.weather.model.GeocodingResponse;

import static pl.qprogramming.daily.service.weather.WeatherConstants.*;

@Slf4j
@Service
public class GeoCodingService {

    private final RestTemplate restTemplate;
    private final GeoCodingMapper geoCodingMapper;

    public GeoCodingService(GeoCodingMapper goecodingMapper) {
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
}
