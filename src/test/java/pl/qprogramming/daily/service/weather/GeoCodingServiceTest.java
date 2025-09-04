package pl.qprogramming.daily.service.weather;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;
import pl.qprogramming.daily.dto.GeocodingResult;
import pl.qprogramming.daily.service.weather.mapper.GeoCodingMapper;
import pl.qprogramming.daily.service.weather.mapper.WeatherMapper;
import pl.qprogramming.daily.service.weather.model.GeocodingResponse;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static pl.qprogramming.daily.service.weather.WeatherConstants.OPEN_METEO_GEOCODING_URL;

@ExtendWith(MockitoExtension.class)
class GeoCodingServiceTest {
    private static final String TEST_CITY = "Warsaw";
    private static final String TEST_LANGUAGE = "pl";
    private static final int TEST_COUNT = 1;
    private static final double TEST_LATITUDE = 52.2316;
    private static final double TEST_LONGITUDE = 21.0062;
    private ObjectMapper objectMapper;
    private GeocodingResponse geocodingResponse;
    private GeocodingResult geocodingResult;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private GeoCodingMapper geoCodingMapper;


    @Spy
    @InjectMocks
    private GeoCodingService geoCodingService;

    @BeforeEach
    void setup() throws IOException {
        objectMapper = new ObjectMapper();
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // Load test data from JSON files
        geocodingResponse = objectMapper.readValue(
                new ClassPathResource("weather/geocoding_response.json").getInputStream(),
                GeocodingResponse.class);
        geocodingResult = new GeocodingResult()
                .name("Warsaw")
                .latitude(TEST_LATITUDE)
                .longitude(TEST_LONGITUDE)
                .country("Poland");
        // Replace the injected RestTemplate with our mock
        ReflectionTestUtils.setField(geoCodingService, "restTemplate", restTemplate);
    }

    @Test
    void geocodeLocation_Success() {
        // Setup mocks
        when(restTemplate.getForObject(contains(OPEN_METEO_GEOCODING_URL), eq(GeocodingResponse.class)))
                .thenReturn(geocodingResponse);
        when(geoCodingMapper.toGeocodingResponse(any())).thenReturn(geocodingResult);

        // Execute test
        GeocodingResult result = geoCodingService.geocodeLocation(TEST_CITY, TEST_LANGUAGE, TEST_COUNT);

        // Verify results
        assertNotNull(result);
        assertEquals("Warsaw", result.getName());
        assertEquals(TEST_LATITUDE, result.getLatitude());
        assertEquals(TEST_LONGITUDE, result.getLongitude());
        assertEquals("Poland", result.getCountry());

        // Verify interactions
        verify(restTemplate).getForObject(contains(OPEN_METEO_GEOCODING_URL), eq(GeocodingResponse.class));
        verify(geoCodingMapper).toGeocodingResponse(any());
    }

    @Test
    void geocodeLocation_NullCityName() {
        // Execute test with null city name
        GeocodingResult result = geoCodingService.geocodeLocation(null, TEST_LANGUAGE, TEST_COUNT);

        // Verify result is null
        assertNull(result);

        // Verify no interactions with external services
        verifyNoInteractions(restTemplate);
        verifyNoInteractions(geoCodingMapper);
    }

    @Test
    void geocodeLocation_EmptyCityName() {
        // Execute test with empty city name
        GeocodingResult result = geoCodingService.geocodeLocation("", TEST_LANGUAGE, TEST_COUNT);

        // Verify result is null
        assertNull(result);

        // Verify no interactions with external services
        verifyNoInteractions(restTemplate);
        verifyNoInteractions(geoCodingMapper);
    }

    @Test
    void geocodeLocation_ApiError() {
        // Setup mocks to simulate API error
        when(restTemplate.getForObject(contains(OPEN_METEO_GEOCODING_URL), eq(GeocodingResponse.class)))
                .thenThrow(new RuntimeException("API Error"));

        // Execute test
        GeocodingResult result = geoCodingService.geocodeLocation(TEST_CITY, TEST_LANGUAGE, TEST_COUNT);

        // Verify result is null due to error
        assertNull(result);

        // Verify interactions
        verify(restTemplate).getForObject(contains(OPEN_METEO_GEOCODING_URL), eq(GeocodingResponse.class));
        verifyNoInteractions(geoCodingMapper);
    }

    @Test
    void geocodeLocation_EmptyResults() {
        // Create response with empty results
        GeocodingResponse emptyResponse = new GeocodingResponse();
        emptyResponse.setResults(java.util.Collections.emptyList());

        // Setup mocks
        when(restTemplate.getForObject(contains(OPEN_METEO_GEOCODING_URL), eq(GeocodingResponse.class)))
                .thenReturn(emptyResponse);

        // Execute test
        GeocodingResult result = geoCodingService.geocodeLocation(TEST_CITY, TEST_LANGUAGE, TEST_COUNT);

        // Verify result is null due to empty results
        assertNull(result);

        // Verify interactions
        verify(restTemplate).getForObject(contains(OPEN_METEO_GEOCODING_URL), eq(GeocodingResponse.class));
        verifyNoInteractions(geoCodingMapper);
    }

}