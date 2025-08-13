import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { CalendarCard } from './CalendarCard.tsx';
import { GoogleCalendarSettingsDialog } from './GoogleCalendarSettingsDialog.tsx';
import type { CalendarSettings } from '../types/types.ts';

export const Calendar = () => {
    const [settings, setSettings] = useState<CalendarSettings>(() => {
        // Try to load settings from localStorage on component mount
        const savedSettings = localStorage.getItem('calendarSettings');
        return savedSettings
            ? JSON.parse(savedSettings)
            : {
                  isConnected: false,
                  selectedCalendarIds: [],
                  daysAhead: 7,
              };
    });

    // Used to trigger a complete remount of the CalendarCard when settings change
    const [settingsKey, setSettingsKey] = useState<number>(0);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('calendarSettings', JSON.stringify(settings));
    }, [settings]);

    const handleSaveSettings = (newSettings: CalendarSettings) => {
        // Check if critical settings have changed
        const requiresReinit =
            settings.isConnected !== newSettings.isConnected ||
            settings.daysAhead !== newSettings.daysAhead ||
            JSON.stringify(settings.selectedCalendarIds) !==
                JSON.stringify(newSettings.selectedCalendarIds);

        setSettings(newSettings);

        // If critical settings changed, increment the key to force CalendarCard remount
        if (requiresReinit) {
            setSettingsKey((prevKey) => prevKey + 1);
        }
    };

    return (
        <Box
            className='calendar-container'
            sx={{
                position: 'relative',
                width: '100%',
                margin: 0,
                padding: 0,
                boxSizing: 'border-box',
            }}
        >
            <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                <GoogleCalendarSettingsDialog
                    settings={settings}
                    onSaveSettings={handleSaveSettings}
                />
            </Box>
            <CalendarCard key={settingsKey} settings={settings} />
        </Box>
    );
};
