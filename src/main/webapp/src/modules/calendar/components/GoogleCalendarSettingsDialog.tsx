import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Divider,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useTranslation } from 'react-i18next';
import { CalendarService } from '../service/calendarService';
import type { CalendarSettings, GoogleCalendar } from '../types/types';

interface GoogleCalendarSettingsDialogProps {
    settings: CalendarSettings;
    onSaveSettings: (settings: CalendarSettings) => void;
}

export const GoogleCalendarSettingsDialog = ({
    settings,
    onSaveSettings,
}: GoogleCalendarSettingsDialogProps) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
    const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>(
        settings.selectedCalendarIds || [],
    );
    const [daysAhead, setDaysAhead] = useState<number>(settings.daysAhead || 7);
    const [error, setError] = useState<string | null>(null);
    const [calendarService, setCalendarService] = useState<CalendarService | null>(null);

    const handleOpen = async () => {
        setOpen(true);
        setIsLoading(true);
        // Reset selections to current settings
        setSelectedCalendarIds(settings.selectedCalendarIds || []);
        setDaysAhead(settings.daysAhead || 7);
        // Initialize the service only when the dialog is opened
        if (!calendarService) {
            try {
                const service = new CalendarService();
                await service.initialize();
                setCalendarService(service);

                // If we're connected and have a working service, load calendars
                if (settings.isConnected && service.isSignedIn()) {
                    await loadCalendarsWithService(service);
                }
            } catch (err) {
                console.error('Error initializing calendar service:', err);
                setError('Failed to initialize calendar service');
            } finally {
                setIsLoading(false);
            }
        } else {
            // If service exists and we're connected, load calendars
            if (settings.isConnected && calendarService.isSignedIn()) {
                await loadCalendars();
            }
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
    };

    // Helper function to load calendars with a specific service instance
    const loadCalendarsWithService = async (service: CalendarService) => {
        if (!service || !service.isSignedIn()) return;

        try {
            setIsLoading(true);
            setError(null);
            const calendarList = await service.fetchCalendarList();
            setCalendars(calendarList);

            // Store the calendars in settings for later use
            localStorage.setItem(
                'calendarSettings',
                JSON.stringify({
                    ...settings,
                    selectedCalendars: calendarList,
                }),
            );
        } catch (error) {
            console.error('Error loading calendars:', error);
            setError('Failed to load calendars. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadCalendars = async () => {
        if (!calendarService) return;
        return loadCalendarsWithService(calendarService);
    };

    const handleSignIn = async () => {
        if (!calendarService) return;

        try {
            setIsLoading(true);
            setError(null);
            await calendarService.signIn();
            await loadCalendars();

            // After successful sign in, update the settings
            onSaveSettings({
                ...settings,
                isConnected: true,
                selectedCalendarIds: selectedCalendarIds,
                daysAhead: daysAhead,
            });
        } catch (error) {
            console.error('Error signing in:', error);
            setError('Failed to sign in with Google. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = () => {
        if (!calendarService) return;

        calendarService.signOut();
        onSaveSettings({
            ...settings,
            isConnected: false,
            selectedCalendarIds: [],
        });
        setCalendars([]);
    };

    // Load calendars when dialog opens and service is ready
    useEffect(() => {
        if (open && calendarService && settings.isConnected) {
            loadCalendars();
        }
    }, [open, calendarService]);

    const handleCalendarToggle = (calendarId: string) => {
        setSelectedCalendarIds((prevSelected) => {
            if (prevSelected.includes(calendarId)) {
                return prevSelected.filter((id) => id !== calendarId);
            } else {
                return [...prevSelected, calendarId];
            }
        });
    };

    const handleSaveSettings = () => {
        onSaveSettings({
            ...settings,
            isConnected: calendarService?.isSignedIn() || false,
            selectedCalendarIds: selectedCalendarIds,
            daysAhead: daysAhead,
        });
        handleClose();
    };

    return (
        <>
            <IconButton
                onClick={handleOpen}
                size='small'
                aria-label='calendar settings'
                data-testid='calendar-settings-button'
            >
                <SettingsIcon fontSize='small' />
            </IconButton>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby='calendar-settings-dialog-title'
                maxWidth='sm'
                fullWidth
            >
                <DialogTitle id='calendar-settings-dialog-title'>
                    {t('calendar.settings.title')}
                </DialogTitle>
                <DialogContent dividers>
                    {error && (
                        <Typography color='error' gutterBottom>
                            {error}
                        </Typography>
                    )}

                    {isLoading ? (
                        <Box display='flex' justifyContent='center' my={3}>
                            <CircularProgress />
                        </Box>
                    ) : !settings.isConnected ? (
                        <Box textAlign='center' my={3}>
                            <Typography variant='body1' gutterBottom>
                                {t('calendar.settings.connectPrompt')}
                            </Typography>
                            <Button
                                variant='contained'
                                color='primary'
                                onClick={handleSignIn}
                                sx={{ mt: 2 }}
                            >
                                {t('calendar.settings.signInWithGoogle')}
                            </Button>
                        </Box>
                    ) : (
                        <>
                            <Box mb={3}>
                                <FormControl fullWidth>
                                    <InputLabel id='days-ahead-label'>
                                        {t('calendar.settings.daysAhead')}
                                    </InputLabel>
                                    <Select
                                        labelId='days-ahead-label'
                                        value={daysAhead}
                                        onChange={(e) => setDaysAhead(Number(e.target.value))}
                                        label={t('calendar.settings.daysAhead')}
                                    >
                                        {[1, 3, 7, 14, 30].map((days) => (
                                            <MenuItem key={days} value={days}>
                                                {days}{' '}
                                                {days === 1
                                                    ? t('calendar.settings.day')
                                                    : t('calendar.settings.days')}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            <Typography variant='subtitle1' gutterBottom>
                                {t('calendar.settings.selectCalendars')}
                            </Typography>

                            <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
                                {calendars.map((calendar) => (
                                    <ListItem
                                        key={calendar.id}
                                        dense
                                        onClick={() => handleCalendarToggle(calendar.id)}
                                    >
                                        <Checkbox
                                            edge='start'
                                            checked={selectedCalendarIds.includes(calendar.id)}
                                            tabIndex={-1}
                                            disableRipple
                                            style={{ color: calendar.backgroundColor }}
                                        />
                                        <ListItemText primary={calendar.summary} />
                                        <Box
                                            sx={{
                                                width: 16,
                                                height: 16,
                                                backgroundColor: calendar.backgroundColor,
                                                borderRadius: '50%',
                                            }}
                                        />
                                    </ListItem>
                                ))}
                            </List>

                            <Divider sx={{ my: 2 }} />

                            <Box textAlign='center'>
                                <Button
                                    variant='outlined'
                                    color='secondary'
                                    onClick={handleSignOut}
                                >
                                    {t('calendar.settings.signOut')}
                                </Button>
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>{t('common.cancel')}</Button>
                    {settings.isConnected && (
                        <Button onClick={handleSaveSettings} color='primary'>
                            {t('common.save')}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
};
