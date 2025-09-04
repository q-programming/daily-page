import { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    Grid,
    Typography,
    useTheme,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { WeatherService } from '../service/weatherService.ts';
import type { AirQualityData, CurrentWeather, HourlyForecast, Location } from '@api';
import type { WeatherProvider } from '@api';
import type { WeatherSettings } from '../types/types.ts';
import {
    formatHour,
    getAqiInfo,
    getWeatherIcon,
    getWeatherTextFromCode,
} from '../utils/weatherUtils.ts';

interface WeatherCardProps {
    settings: WeatherSettings;
}

export const WeatherCard = ({ settings }: WeatherCardProps) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [warn, setWarn] = useState<string | null>(null);
    const [currentConditions, setCurrentConditions] = useState<CurrentWeather | undefined>(
        undefined,
    );
    const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[] | undefined>(undefined);
    const [locationData, setLocationData] = useState<Location | null>(null);
    const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
    const [minMaxTemp, setMinMaxTemp] = useState<{
        min: number;
        max: number;
    } | null>(null);
    const [weatherService, setWeatherService] = useState<WeatherService | null>(null);
    const [provider, setProvider] = useState<WeatherProvider | undefined>(undefined);

    // Create and initialize weather service
    useEffect(() => {
        const initWeatherService = async () => {
            if (!settings.city) {
                setWarn('weather.cityRequired');
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
                setError('weather.errorInit');
            }
        };

        initWeatherService().finally(() => {
            setLoading(false);
        });
    }, [settings]);

    // Fetch weather data when weatherService is available
    useEffect(() => {
        const fetchWeatherData = async () => {
            if (!weatherService) {
                return;
            }

            try {
                // Fetch all data in parallel
                const [weatherForecast, location, airQualityData] = await Promise.all([
                    weatherService.getWeatherForecast(),
                    weatherService.getLocationData(),
                    weatherService.getAirQuality(),
                ]);
                setCurrentConditions(weatherForecast?.current);
                setHourlyForecast(weatherForecast?.hourly);
                setLocationData(location);
                setAirQuality(airQualityData);
                setProvider(weatherForecast?.provider);

                // Get min/max from daily forecast
                if (weatherForecast?.forecast && weatherForecast.forecast.length > 0) {
                    setMinMaxTemp({
                        min: weatherForecast.forecast[0].tempMin || 0,
                        max: weatherForecast.forecast[0].tempMax || 0,
                    });
                }
                setError(null);
                setWarn(null);
            } catch (err) {
                console.error('Error fetching weather data:', err);
                setError('weather.fetchError');
            }
        };

        setLoading(true);
        fetchWeatherData().finally(() => {
            setLoading(false);
        });
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
    if (warn) {
        return (
            <Card
                sx={{
                    minWidth: 275,
                    p: 2,
                    bgcolor:
                        theme.palette.mode === 'dark'
                            ? theme.palette.info.dark
                            : theme.palette.info.light,
                }}
            >
                <CardContent>
                    <Typography variant='h6' color='info'>
                        {t('Info')}
                    </Typography>
                    <Typography variant='body2' data-testid={'warn-msg'}>
                        {t(warn)}
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
                    <Typography variant='body2'>{t(error)}</Typography>
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

    const aqiInfo =
        airQuality && airQuality.airQuality
            ? getAqiInfo(airQuality.airQuality.aqi || 0)
            : {
                  text: 'Unknown',
                  color: '#999',
                  i18nKey: 'weather.airQualityLevels.unknown',
              };

    // Get forecast items for hourly display with proper filtering
    const hourlyItems = hourlyForecast
        ? hourlyForecast.filter((_, index) => index % 2 === 0).slice(0, 5)
        : [];

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
                                icon={getWeatherIcon(currentConditions.weatherCode || 0, provider)}
                                width={64}
                                height={64}
                                color={theme.palette.primary.main}
                            />
                            <Typography variant='h6' sx={{ mt: 1 }}>
                                {getWeatherTextFromCode(
                                    currentConditions.weatherCode || 0,
                                    provider,
                                )}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                                {locationData.name}, {locationData.country}
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
                                {Math.round(currentConditions.temperature || 0)}°C
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
                    {hourlyItems.map((hour, index) => (
                        <Grid key={index} size={{ xs: 2 }} sx={{ textAlign: 'center' }}>
                            <Typography variant='caption'>{formatHour(hour.time || '')}</Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    height: '24px',
                                }}
                            >
                                <Icon
                                    icon={getWeatherIcon(
                                        hour.weatherCode || 0,
                                        provider,
                                        hour.time,
                                    )}
                                    width={24}
                                    height={24}
                                    color={theme.palette.primary.main}
                                />
                            </Box>
                            <Typography variant='caption'>
                                {Math.round(hour.temperature || 0)}°C
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
                                    {currentConditions.windSpeed || 0} km/h
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
                                    {airQuality && airQuality.airQuality
                                        ? `${airQuality.airQuality.aqi || 0} - ${t(aqiInfo.i18nKey)}`
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
