import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Divider,
    Grid,
    useTheme,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { WeatherService } from '../service/weatherService.ts';
import type {
    WeatherSettings,
    CurrentCondition,
    HourlyForecast,
    LocationData,
    AirQualityData,
} from '../types/types.ts';
import { getWeatherIcon, formatHour, getAqiInfo } from '../utils/weatherUtils.ts';

interface WeatherCardProps {
    settings: WeatherSettings;
}

export const WeatherCard = ({ settings }: WeatherCardProps) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentConditions, setCurrentConditions] = useState<CurrentCondition | null>(null);
    const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
    const [locationData, setLocationData] = useState<LocationData | null>(null);
    const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
    const [minMaxTemp, setMinMaxTemp] = useState<{
        min: number;
        max: number;
    } | null>(null);
    const [weatherService, setWeatherService] = useState<WeatherService | null>(null);

    // Create and initialize weather service
    useEffect(() => {
        const initWeatherService = async () => {
            if (!settings.city) {
                setError('City is required. Please add it in settings.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // Initialize weather service with current settings
                const service = new WeatherService(settings);
                // Initialize the service - this will handle location lookup internally
                await service.initialize();
                setWeatherService(service);
            } catch (err) {
                console.error('Error initializing weather service:', err);
                setError(
                    'Failed to initialize weather service. Please check your city name and try again.',
                );
                setLoading(false);
            }
        };

        initWeatherService().then(() => {
            setLoading(false);
        });
    }, [settings]);

    // Fetch weather data when weatherService is available
    useEffect(() => {
        const fetchWeatherData = async () => {
            if (!weatherService) return;

            try {
                setLoading(true);
                // Fetch all data in parallel
                const [conditions, hourly, location, airQualityData, dailyForecast] =
                    await Promise.all([
                        weatherService.getCurrentConditions(),
                        weatherService.getHourlyForecast(),
                        weatherService.getLocationData(),
                        weatherService.getAirQuality(),
                        weatherService.getDailyForecast(),
                    ]);
                setCurrentConditions(conditions);
                setHourlyForecast(hourly?.slice(0, 5) || []); // Get first 5 hours
                setLocationData(location);
                setAirQuality(airQualityData);

                // Get min/max from daily forecast
                if (dailyForecast && dailyForecast.length > 0) {
                    setMinMaxTemp({
                        min: dailyForecast[0].Temperature.Minimum.Value,
                        max: dailyForecast[0].Temperature.Maximum.Value,
                    });
                }

                setError(null);
            } catch (err) {
                console.error('Error fetching weather data:', err);
                setError('Failed to fetch weather data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchWeatherData();
    }, [weatherService]);
    if (loading) {
        return (
            <Card sx={{ minWidth: 275, textAlign: 'center', p: 2 }}>
                <CardContent>
                    <CircularProgress />
                    <Typography variant='body2' mt={2}>
                        {t('weather.loading')}
                    </Typography>
                </CardContent>
            </Card>
        );
    }
    if (error) {
        return (
            <Card
                sx={{
                    minWidth: 275,
                    p: 2,
                    bgcolor:
                        theme.palette.mode === 'dark'
                            ? theme.palette.error.dark
                            : theme.palette.error.light,
                }}
            >
                <CardContent>
                    <Typography variant='h6' color='error'>
                        {t('Error')}
                    </Typography>
                    <Typography variant='body2'>{error}</Typography>
                </CardContent>
            </Card>
        );
    }
    if (!currentConditions || !locationData) {
        return (
            <Card sx={{ minWidth: 275, p: 2 }}>
                <CardContent>
                    <Typography variant='body2'>{t('weather.noData')}</Typography>
                </CardContent>
            </Card>
        );
    }

    const aqiInfo = airQuality
        ? getAqiInfo(airQuality.value)
        : {
              text: 'Unknown',
              color: '#999',
              i18nKey: 'weather.airQualityLevels.unknown',
          };

    return (
        <Card sx={{ width: '100%', borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
                {/* Current Weather Section */}
                <Grid container spacing={2} alignItems='center'>
                    {/* Weather Icon and Condition */}
                    <Grid size={{ xs: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                boxShadow: 0,
                            }}
                        >
                            <Icon
                                icon={getWeatherIcon(currentConditions.WeatherIcon)}
                                width={64}
                                height={64}
                                color={theme.palette.primary.main}
                            />
                            <Typography variant='h6' sx={{ mt: 1 }}>
                                {currentConditions.WeatherText}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                                {locationData.LocalizedName}, {locationData.Country.LocalizedName}
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Temperature */}
                    <Grid size={{ xs: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                boxShadow: 0,
                            }}
                        >
                            <Typography variant='h3'>
                                {Math.round(currentConditions.Temperature.Metric.Value)}°C
                            </Typography>
                            {minMaxTemp && (
                                <Typography variant='body2' color='text.secondary'>
                                    {t('weather.min')}: {Math.round(minMaxTemp.min)}°C /{' '}
                                    {t('weather.max')}: {Math.round(minMaxTemp.max)}°C
                                </Typography>
                            )}
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Hourly Forecast Section */}
                <Grid container spacing={1} justifyContent='space-between'>
                    {hourlyForecast.map((hour, index) => (
                        <Grid key={index} size={{ xs: 2 }} sx={{ textAlign: 'center' }}>
                            <Typography variant='caption'>{formatHour(hour.DateTime)}</Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    height: '24px',
                                }}
                            >
                                <Icon
                                    icon={getWeatherIcon(hour.WeatherIcon)}
                                    width={24}
                                    height={24}
                                    color={theme.palette.primary.main}
                                />
                            </Box>
                            <Typography variant='caption'>
                                {Math.round(hour.Temperature.Value)}°C
                            </Typography>
                        </Grid>
                    ))}
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Wind Speed and Air Quality Section */}
                <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                        <Box display='flex' flexDirection='column' alignItems='center'>
                            <Typography variant='subtitle2'>{t('weather.windSpeed')}</Typography>
                            <Box display='flex' alignItems='center'>
                                <Icon
                                    icon='wi:strong-wind'
                                    width={24}
                                    height={24}
                                    color={theme.palette.primary.main}
                                />
                                <Typography variant='body2' ml={1}>
                                    {currentConditions.Wind.Speed.Metric.Value}{' '}
                                    {currentConditions.Wind.Speed.Metric.Unit}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                        <Box display='flex' flexDirection='column' alignItems='center'>
                            <Typography variant='subtitle2'>{t('weather.airQuality')}</Typography>
                            <Box display='flex' alignItems='center'>
                                <Box
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        bgcolor: aqiInfo.color,
                                        mr: 1,
                                    }}
                                />
                                <Typography variant='body2'>
                                    {airQuality
                                        ? `${airQuality.value} - ${t(aqiInfo.i18nKey)}`
                                        : t(aqiInfo.i18nKey)}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};
