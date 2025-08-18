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
import org.springframework.core.io.ClassPathResource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;
import pl.qprogramming.daily.dto.*;
import pl.qprogramming.daily.service.weather.mapper.WeatherMapper;
import pl.qprogramming.daily.service.weather.model.GeocodingResponse;
import pl.qprogramming.daily.service.weather.model.OpenMeteoAirQuality;
import pl.qprogramming.daily.service.weather.model.OpenMeteoWeatherResponse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static pl.qprogramming.daily.service.weather.WeatherConstants.*;

@ExtendWith(MockitoExtension.class)
class WeatherServiceTest {

    private static final String TEST_CITY = "Warsaw";
    private static final String TEST_LANGUAGE = "pl";
    private static final int TEST_COUNT = 1;
    private static final double TEST_LATITUDE = 52.2316;
    private static final double TEST_LONGITUDE = 21.0062;
    private static final Integer TEST_DAYS = 5;
    private static final Integer TEST_HOURS = 24;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private WeatherMapper weatherMapper;

    @Spy
    @InjectMocks
    private WeatherService weatherService;

    private ObjectMapper objectMapper;
    private GeocodingResponse geocodingResponse;
    private OpenMeteoWeatherResponse currentWeatherResponse;
    private OpenMeteoWeatherResponse forecastResponse;
    private OpenMeteoAirQuality airQualityResponse;
    private GeocodingResult geocodingResult;
    private WeatherData weatherData;
    private WeatherForecast weatherForecast;
    private AirQualityData airQualityData;

    @BeforeEach
    void setUp() throws IOException {
        objectMapper = new ObjectMapper();
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // Load test data from JSON files
        geocodingResponse = objectMapper.readValue(
                new ClassPathResource("weather/geocoding_response.json").getInputStream(),
                GeocodingResponse.class);

        currentWeatherResponse = objectMapper.readValue(
                new ClassPathResource("weather/current_weather.json").getInputStream(),
                OpenMeteoWeatherResponse.class);

        forecastResponse = objectMapper.readValue(
                new ClassPathResource("weather/weather_forecast.json").getInputStream(),
                OpenMeteoWeatherResponse.class);

        airQualityResponse = objectMapper.readValue(
                new ClassPathResource("weather/air_quality.json").getInputStream(),
                OpenMeteoAirQuality.class);

        // Create correctly structured DTO objects for mapper responses based on actual generated classes
        geocodingResult = new GeocodingResult()
                .name("Warsaw")
                .latitude(TEST_LATITUDE)
                .longitude(TEST_LONGITUDE)
                .country("Poland");

        // Set up CurrentWeather object
        CurrentWeather currentWeather = new CurrentWeather()
                .temperature(22.5)
                .weatherCode(1)
                .windSpeed(15.2)
                .humidity(65);

        // Set up WeatherData object
        weatherData = new WeatherData()
                .current(currentWeather)
                .location(new Location().lat(TEST_LATITUDE).lon(TEST_LONGITUDE));

        // Set up WeatherForecast object
        List<Forecast> forecasts = new ArrayList<>();
        for (int i = 0; i < TEST_DAYS; i++) {
            forecasts.add(new Forecast());
        }

        List<HourlyForecast> hourlyForecasts = new ArrayList<>();
        for (int i = 0; i < TEST_HOURS; i++) {
            hourlyForecasts.add(new HourlyForecast());
        }

        weatherForecast = new WeatherForecast()
                .current(currentWeather)
                .location(new Location().lat(TEST_LATITUDE).lon(TEST_LONGITUDE))
                .forecast(forecasts)
                .hourly(hourlyForecasts);

        // Set up AirQualityData object
        airQualityData = new AirQualityData()
                .location(new Location().lat(TEST_LATITUDE).lon(TEST_LONGITUDE))
                .airQuality(new AirQuality()
                        .aqi(22d)
                        .pm10(12.5)
                        .pm25(8.3)
                        .description("Good"));

        // Replace the injected RestTemplate with our mock
        ReflectionTestUtils.setField(weatherService, "restTemplate", restTemplate);
    }

    @Test
    void geocodeLocation_Success() {
        // Setup mocks
        when(restTemplate.getForObject(contains(OPEN_METEO_GEOCODING_URL), eq(GeocodingResponse.class)))
                .thenReturn(geocodingResponse);
        when(weatherMapper.toGeocodingResponse(any())).thenReturn(geocodingResult);

        // Execute test
        GeocodingResult result = weatherService.geocodeLocation(TEST_CITY, TEST_LANGUAGE, TEST_COUNT);

        // Verify results
        assertNotNull(result);
        assertEquals("Warsaw", result.getName());
        assertEquals(TEST_LATITUDE, result.getLatitude());
        assertEquals(TEST_LONGITUDE, result.getLongitude());
        assertEquals("Poland", result.getCountry());

        // Verify interactions
        verify(restTemplate).getForObject(contains(OPEN_METEO_GEOCODING_URL), eq(GeocodingResponse.class));
        verify(weatherMapper).toGeocodingResponse(any());
    }

    @Test
    void geocodeLocation_NullCityName() {
        // Execute test with null city name
        GeocodingResult result = weatherService.geocodeLocation(null, TEST_LANGUAGE, TEST_COUNT);

        // Verify result is null
        assertNull(result);

        // Verify no interactions with external services
        verifyNoInteractions(restTemplate);
        verifyNoInteractions(weatherMapper);
    }

    @Test
    void geocodeLocation_EmptyCityName() {
        // Execute test with empty city name
        GeocodingResult result = weatherService.geocodeLocation("", TEST_LANGUAGE, TEST_COUNT);

        // Verify result is null
        assertNull(result);

        // Verify no interactions with external services
        verifyNoInteractions(restTemplate);
        verifyNoInteractions(weatherMapper);
    }

    @Test
    void geocodeLocation_ApiError() {
        // Setup mocks to simulate API error
        when(restTemplate.getForObject(contains(OPEN_METEO_GEOCODING_URL), eq(GeocodingResponse.class)))
                .thenThrow(new RuntimeException("API Error"));

        // Execute test
        GeocodingResult result = weatherService.geocodeLocation(TEST_CITY, TEST_LANGUAGE, TEST_COUNT);

        // Verify result is null due to error
        assertNull(result);

        // Verify interactions
        verify(restTemplate).getForObject(contains(OPEN_METEO_GEOCODING_URL), eq(GeocodingResponse.class));
        verifyNoInteractions(weatherMapper);
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
        GeocodingResult result = weatherService.geocodeLocation(TEST_CITY, TEST_LANGUAGE, TEST_COUNT);

        // Verify result is null due to empty results
        assertNull(result);

        // Verify interactions
        verify(restTemplate).getForObject(contains(OPEN_METEO_GEOCODING_URL), eq(GeocodingResponse.class));
        verifyNoInteractions(weatherMapper);
    }

    @Test
    void getCurrentWeather_Success() {
        // Setup mocks
        when(restTemplate.getForObject(contains(OPEN_METEO_FORECAST_URL), eq(OpenMeteoWeatherResponse.class)))
                .thenReturn(currentWeatherResponse);
        when(weatherMapper.toWeatherData(any())).thenReturn(weatherData);

        // Execute test
        WeatherData result = weatherService.getCurrentWeather(TEST_LATITUDE, TEST_LONGITUDE);

        // Verify results
        assertNotNull(result);
        assertNotNull(result.getCurrent());
        assertEquals(22.5, result.getCurrent().getTemperature());
        assertEquals(1, result.getCurrent().getWeatherCode());
        assertEquals(15.2, result.getCurrent().getWindSpeed());
        assertEquals(65, result.getCurrent().getHumidity());

        // Verify interactions
        verify(restTemplate).getForObject(contains(OPEN_METEO_FORECAST_URL), eq(OpenMeteoWeatherResponse.class));
        verify(weatherMapper).toWeatherData(currentWeatherResponse);
    }

    @Test
    void getCurrentWeather_ApiError() {
        // Setup mocks to simulate API error
        when(restTemplate.getForObject(contains(OPEN_METEO_FORECAST_URL), eq(OpenMeteoWeatherResponse.class)))
                .thenThrow(new RuntimeException("API Error"));

        // Execute test
        WeatherData result = weatherService.getCurrentWeather(TEST_LATITUDE, TEST_LONGITUDE);

        // Verify result is null due to error
        assertNull(result);

        // Verify interactions
        verify(restTemplate).getForObject(contains(OPEN_METEO_FORECAST_URL), eq(OpenMeteoWeatherResponse.class));
        verifyNoInteractions(weatherMapper);
    }

    @Test
    void getCurrentWeather_NullResponse() {
        // Setup mocks to return null response
        when(restTemplate.getForObject(contains(OPEN_METEO_FORECAST_URL), eq(OpenMeteoWeatherResponse.class)))
                .thenReturn(null);

        // Execute test
        WeatherData result = weatherService.getCurrentWeather(TEST_LATITUDE, TEST_LONGITUDE);

        // Verify result is null due to null response
        assertNull(result);

        // Verify interactions
        verify(restTemplate).getForObject(contains(OPEN_METEO_FORECAST_URL), eq(OpenMeteoWeatherResponse.class));
        verifyNoInteractions(weatherMapper);
    }

    @Test
    void getWeatherForecast_Success() {
        // Setup mocks
        when(restTemplate.getForObject(contains(OPEN_METEO_FORECAST_URL), eq(OpenMeteoWeatherResponse.class)))
                .thenReturn(forecastResponse);
        when(weatherMapper.toWeatherForecast(any(), any(), any())).thenReturn(weatherForecast);

        // Execute test
        WeatherForecast result = weatherService.getWeatherForecast(TEST_LATITUDE, TEST_LONGITUDE, TEST_DAYS, TEST_HOURS);

        // Verify results
        assertNotNull(result);
        assertNotNull(result.getCurrent());
        assertEquals(22.5, result.getCurrent().getTemperature());
        assertEquals(TEST_DAYS, result.getForecast().size());
        assertEquals(TEST_HOURS, result.getHourly().size());

        // Verify interactions
        verify(restTemplate).getForObject(contains(OPEN_METEO_FORECAST_URL), eq(OpenMeteoWeatherResponse.class));
        verify(weatherMapper).toWeatherForecast(eq(forecastResponse), any(), any());
    }

    @Test
    void getWeatherForecast_ApiError() {
        // Setup mocks to simulate API error
        when(restTemplate.getForObject(contains(OPEN_METEO_FORECAST_URL), eq(OpenMeteoWeatherResponse.class)))
                .thenThrow(new RuntimeException("API Error"));

        // Execute test
        WeatherForecast result = weatherService.getWeatherForecast(TEST_LATITUDE, TEST_LONGITUDE, TEST_DAYS, TEST_HOURS);

        // Verify result is null due to error
        assertNull(result);

        // Verify interactions
        verify(restTemplate).getForObject(contains(OPEN_METEO_FORECAST_URL), eq(OpenMeteoWeatherResponse.class));
        verifyNoInteractions(weatherMapper);
    }

    @Test
    void getWeatherForecast_NullResponse() {
        // Setup mocks to return null response
        when(restTemplate.getForObject(contains(OPEN_METEO_FORECAST_URL), eq(OpenMeteoWeatherResponse.class)))
                .thenReturn(null);

        // Execute test
        WeatherForecast result = weatherService.getWeatherForecast(TEST_LATITUDE, TEST_LONGITUDE, TEST_DAYS, TEST_HOURS);

        // Verify result is null due to null response
        assertNull(result);

        // Verify interactions
        verify(restTemplate).getForObject(contains(OPEN_METEO_FORECAST_URL), eq(OpenMeteoWeatherResponse.class));
        verifyNoInteractions(weatherMapper);
    }

    @Test
    void getAirQuality_Success() {
        // Setup mocks
        when(restTemplate.getForObject(contains(OPEN_METEO_AIR_QUALITY_URL), eq(OpenMeteoAirQuality.class)))
                .thenReturn(airQualityResponse);
        when(weatherMapper.toAirQualityData(any())).thenReturn(airQualityData);

        // Execute test
        AirQualityData result = weatherService.getAirQuality(TEST_LATITUDE, TEST_LONGITUDE);

        // Verify results
        assertNotNull(result);
        assertNotNull(result.getAirQuality());
        assertEquals(12.5, result.getAirQuality().getPm10());
        assertEquals(8.3, result.getAirQuality().getPm25());
        assertEquals(22, result.getAirQuality().getAqi());

        // Verify interactions
        verify(restTemplate).getForObject(contains(OPEN_METEO_AIR_QUALITY_URL), eq(OpenMeteoAirQuality.class));
        verify(weatherMapper).toAirQualityData(airQualityResponse);
    }

    @Test
    void getAirQuality_ApiError() {
        // Setup mocks to simulate API error
        when(restTemplate.getForObject(contains(OPEN_METEO_AIR_QUALITY_URL), eq(OpenMeteoAirQuality.class)))
                .thenThrow(new RuntimeException("API Error"));

        // Execute test
        AirQualityData result = weatherService.getAirQuality(TEST_LATITUDE, TEST_LONGITUDE);

        // Verify result is null due to error
        assertNull(result);

        // Verify interactions
        verify(restTemplate).getForObject(contains(OPEN_METEO_AIR_QUALITY_URL), eq(OpenMeteoAirQuality.class));
        verifyNoInteractions(weatherMapper);
    }

    @Test
    void getAirQuality_NullResponse() {
        // Setup mocks to return null response
        when(restTemplate.getForObject(contains(OPEN_METEO_AIR_QUALITY_URL), eq(OpenMeteoAirQuality.class)))
                .thenReturn(null);

        // Execute test
        AirQualityData result = weatherService.getAirQuality(TEST_LATITUDE, TEST_LONGITUDE);

        // Verify result is null due to null response
        assertNull(result);

        // Verify interactions
        verify(restTemplate).getForObject(contains(OPEN_METEO_AIR_QUALITY_URL), eq(OpenMeteoAirQuality.class));
        verifyNoInteractions(weatherMapper);
    }
}
