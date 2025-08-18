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
import type { CalendarSettings } from '../types/types';
import type { Calendar } from '@api/api.ts';

interface GoogleCalendarSettingsDialogProps {
    settings: CalendarSettings;
    onSaveSettings: (settings: CalendarSettings) => void;
    calendarService: CalendarService | null;
}

export const GoogleCalendarSettingsDialog = ({
    settings,
    onSaveSettings,
    calendarService,
}: GoogleCalendarSettingsDialogProps) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [selectedCalendars, setSelectedCalendars] = useState<Calendar[]>(
        settings.selectedCalendars || [],
    );
    const [daysAhead, setDaysAhead] = useState<number>(settings.daysAhead || 7);
    const [error, setError] = useState<string | null>(null);

    const handleOpen = async () => {
        setOpen(true);
        // Reset selections to current settings
        setSelectedCalendars(settings.selectedCalendars || []);
        setDaysAhead(settings.daysAhead || 7);
        if (settings.isConnected && calendarService?.isSignedIn()) {
            await loadCalendars();
        }
    };

    const handleClose = () => {
        setOpen(false);
    };

    const loadCalendars = async () => {
        if (!calendarService || !calendarService.isSignedIn()) {
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const calendarList = await calendarService.fetchCalendarList();
            setCalendars(calendarList);
        } catch (error) {
            console.error('Error loading calendars:', error);
            setError('Failed to load calendars. Please try again.');
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
            selectedCalendars: [],
        });
        setCalendars([]);
    };

    // Load calendars when dialog opens and service is ready
    useEffect(() => {
        if (open && calendarService && calendarService.isSignedIn()) {
            loadCalendars();
        }
    }, [open, calendarService]);

    const handleCalendarToggle = (calendar: Calendar) => {
        setSelectedCalendars((prevSelected) => {
            const isSelected = prevSelected.some((c) => c.id === calendar.id);
            if (isSelected) {
                return prevSelected.filter((c) => c.id !== calendar.id);
            } else {
                return [...prevSelected, calendar];
            }
        });
    };

    const handleSaveSettings = () => {
        onSaveSettings({
            ...settings,
            isConnected: calendarService?.isSignedIn() || false,
            selectedCalendars: selectedCalendars,
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
                disabled={!settings.isConnected || !calendarService?.isSignedIn()}
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
                    ) : !calendarService?.isSignedIn() ? (
                        <Box textAlign='center' my={3}>
                            <Typography variant='body1' gutterBottom>
                                {t('calendar.settings.notConnected')}
                            </Typography>
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
                                        onClick={() => handleCalendarToggle(calendar)}
                                    >
                                        <Checkbox
                                            edge='start'
                                            checked={selectedCalendars.some(
                                                (c) => c.id === calendar.id,
                                            )}
                                            tabIndex={-1}
                                            disableRipple
                                            style={{ color: calendar.color || '#039be5' }}
                                        />
                                        <ListItemText primary={calendar.summary} />
                                        <Box
                                            sx={{
                                                width: 16,
                                                height: 16,
                                                backgroundColor: calendar.color || '#039be5',
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
                    <Button onClick={handleSaveSettings} color='primary'>
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
