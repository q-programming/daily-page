import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    Grid,
    Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CalendarService } from '../service/calendarService';
import type { CalendarSettings } from '../types/types';
import { formatDate, formatEventTime, groupEventsByDate, isToday } from '../utils/calendarUtils';
import type { CalendarEvent } from '@api';
import { GoogleCalendarSettingsDialog } from './GoogleCalendarSettingsDialog';

interface CalendarCardProps {
    settings: CalendarSettings;
    onSaveSettings: (settings: CalendarSettings) => void;
}

export const CalendarCard = ({ settings, onSaveSettings }: CalendarCardProps) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [calendarService, setCalendarService] = useState<CalendarService | null>(null);

    // Create and initialize calendar service
    useEffect(() => {
        const initCalendarService = async () => {
            try {
                setLoading(true);
                setError(null);
                // Create new calendar service
                const service = new CalendarService();

                // Initialize the service
                await service.initialize(settings.isConnected);
                setCalendarService(service);

                if (service.isSignedIn()) {
                    onSaveSettings({
                        ...settings,
                        isConnected: true,
                    });
                }
            } catch (err) {
                console.error('Error initializing calendar service:', err);
                setError(t('calendar.errors.initFailed'));
            }
        };
        initCalendarService().finally(() => {
            setLoading(false);
        });
    }, [t]);

    // Fetch events when service is available or settings change
    useEffect(() => {
        const fetchEvents = async () => {
            if (
                !calendarService ||
                !settings.isConnected ||
                settings.selectedCalendars.length === 0
            ) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                if (!calendarService.isSignedIn()) {
                    setError(t('calendar.errors.notSignedIn'));
                    setLoading(false);
                    return;
                }

                const calendarEvents = await calendarService.fetchEvents(
                    settings.selectedCalendars,
                    settings.daysAhead || 7,
                );
                setEvents(calendarEvents);
            } catch (err) {
                console.error('Error fetching calendar events:', err);
                setError(t('calendar.errors.fetchFailed'));
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [calendarService, settings, t]);

    const handleSignIn = async () => {
        if (calendarService) {
            await calendarService.signIn();
        }
    };

    const groupedEvents = groupEventsByDate(events);
    const sortedDates = Object.keys(groupedEvents).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );

    if (!settings.isConnected) {
        return (
            <Card
                variant='outlined'
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                }}
            >
                <CardContent>
                    <Typography variant='h6' gutterBottom>
                        {t('calendar.title')}
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            py: 4,
                        }}
                    >
                        <Typography variant='body1' textAlign='center' gutterBottom>
                            {t('calendar.connectPrompt')}
                        </Typography>
                        <Button variant='contained' color='primary' onClick={handleSignIn}>
                            {t('calendar.settings.signInWithGoogle')}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            variant='outlined'
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
            }}
        >
            <CardContent>
                <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                    <Typography variant='h6' gutterBottom>
                        {t('calendar.title')}
                    </Typography>
                    <GoogleCalendarSettingsDialog
                        settings={settings}
                        onSaveSettings={onSaveSettings}
                        calendarService={calendarService}
                    />
                </Box>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color='error'>{error}</Typography>
                ) : events.length === 0 ? (
                    <Typography variant='body1' sx={{ py: 2 }}>
                        {t('calendar.noEvents')}
                    </Typography>
                ) : (
                    <Box sx={{ mt: 1 }}>
                        {sortedDates.map((date, dateIndex) => (
                            <Box key={date}>
                                {dateIndex > 0 && <Divider sx={{ my: 1 }} />}
                                <Grid container spacing={1}>
                                    {/* Date column */}
                                    <Grid size={{ xs: 2 }}>
                                        <Typography
                                            variant='subtitle1'
                                            fontWeight={isToday(date) ? 'bold' : 'normal'}
                                            color={isToday(date) ? 'primary' : 'inherit'}
                                        >
                                            {formatDate(date)}
                                        </Typography>
                                    </Grid>

                                    {/* Events column */}
                                    <Grid size={{ xs: 10 }}>
                                        {groupedEvents[date].map((event, eventIndex) => (
                                            <Box
                                                key={event.id}
                                                sx={{
                                                    display: 'flex',
                                                    mb:
                                                        eventIndex < groupedEvents[date].length - 1
                                                            ? 1.5
                                                            : 0,
                                                }}
                                            >
                                                {/* Color indicator */}
                                                <Box
                                                    sx={{
                                                        width: 4,
                                                        borderRadius: 1,
                                                        bgcolor: event.calendarColor,
                                                        mr: 1,
                                                        flexShrink: 0,
                                                    }}
                                                />
                                                {/* Event details */}
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-start',
                                                        textAlign: 'left',
                                                    }}
                                                >
                                                    <Typography
                                                        variant='body2'
                                                        sx={{ fontWeight: 'medium' }}
                                                    >
                                                        {event.summary || t('calendar.noTitle')}
                                                    </Typography>
                                                    <Typography
                                                        variant='caption'
                                                        color='text.secondary'
                                                    >
                                                        {formatEventTime(event, date)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Grid>
                                </Grid>
                            </Box>
                        ))}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};
