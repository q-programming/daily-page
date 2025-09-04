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
import pl.qprogramming.daily.service.weather.model.openweather.OpenMeteoAirQuality;
import pl.qprogramming.daily.service.weather.model.openweather.OpenMeteoWeatherResponse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static pl.qprogramming.daily.service.weather.WeatherConstants.*;

@ExtendWith(MockitoExtension.class)
class OpenWeatherServiceTest {

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
    private OpenWeatherService openWeatherService;

    private ObjectMapper objectMapper;
    private OpenMeteoWeatherResponse currentWeatherResponse;
    private OpenMeteoWeatherResponse forecastResponse;
    private OpenMeteoAirQuality airQualityResponse;
    private WeatherData weatherData;
    private WeatherForecast weatherForecast;
    private AirQualityData airQualityData;

    @BeforeEach
    void setUp() throws IOException {
        objectMapper = new ObjectMapper();
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // Load test data from JSON files

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
        ReflectionTestUtils.setField(openWeatherService, "restTemplate", restTemplate);
    }



    @Test
    void getCurrentWeather_Success() {
        // Setup mocks
        when(restTemplate.getForObject(contains(OPEN_METEO_FORECAST_URL), eq(OpenMeteoWeatherResponse.class)))
                .thenReturn(currentWeatherResponse);
        when(weatherMapper.toWeatherData(any())).thenReturn(weatherData);

        // Execute test
        WeatherData result = openWeatherService.getCurrentWeather(TEST_LATITUDE, TEST_LONGITUDE);

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
        WeatherData result = openWeatherService.getCurrentWeather(TEST_LATITUDE, TEST_LONGITUDE);

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
        WeatherData result = openWeatherService.getCurrentWeather(TEST_LATITUDE, TEST_LONGITUDE);

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
        WeatherForecast result = openWeatherService.getWeatherForecast(TEST_LATITUDE, TEST_LONGITUDE, TEST_DAYS, TEST_HOURS);

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
        WeatherForecast result = openWeatherService.getWeatherForecast(TEST_LATITUDE, TEST_LONGITUDE, TEST_DAYS, TEST_HOURS);

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
        WeatherForecast result = openWeatherService.getWeatherForecast(TEST_LATITUDE, TEST_LONGITUDE, TEST_DAYS, TEST_HOURS);

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
        AirQualityData result = openWeatherService.getAirQuality(TEST_LATITUDE, TEST_LONGITUDE);

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
        AirQualityData result = openWeatherService.getAirQuality(TEST_LATITUDE, TEST_LONGITUDE);

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
        AirQualityData result = openWeatherService.getAirQuality(TEST_LATITUDE, TEST_LONGITUDE);

        // Verify result is null due to null response
        assertNull(result);

        // Verify interactions
        verify(restTemplate).getForObject(contains(OPEN_METEO_AIR_QUALITY_URL), eq(OpenMeteoAirQuality.class));
        verifyNoInteractions(weatherMapper);
    }
}
