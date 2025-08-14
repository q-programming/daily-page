import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { CalendarCard } from './CalendarCard.tsx';
import type { CalendarSettings } from '../types/types.ts';

export const Calendar = () => {
    const [settings, setSettings] = useState<CalendarSettings>(() => {
        // Try to load settings from localStorage on component mount
        const savedSettings = localStorage.getItem('calendarSettings');
        return savedSettings
            ? JSON.parse(savedSettings)
            : {
                  isConnected: false,
                  selectedCalendars: [],
                  daysAhead: 7,
              };
    });

    // Save settings to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('calendarSettings', JSON.stringify(settings));
    }, [settings]);

    const handleSaveSettings = (newSettings: CalendarSettings) => {
        setSettings(newSettings);
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
            <CalendarCard settings={settings} onSaveSettings={handleSaveSettings} />
        </Box>
    );
};
