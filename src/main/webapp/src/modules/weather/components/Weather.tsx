import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { WeatherCard } from './WeatherCard.tsx';
import { WeatherSettingsDialog } from './WeatherSettingsDialog.tsx';
import type { WeatherSettings } from '../types/types.ts';

export const Weather = () => {
    const [settings, setSettings] = useState<WeatherSettings>(() => {
        // Try to load settings from localStorage on component mount
        const savedSettings = localStorage.getItem('weatherSettings');
        return savedSettings
            ? JSON.parse(savedSettings)
            : {
                  city: '',
              };
    });
    // Used to trigger a complete remount of the WeatherCard when settings change
    const [settingsKey, setSettingsKey] = useState<number>(0);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('weatherSettings', JSON.stringify(settings));
    }, [settings]);

    const handleSaveSettings = (newSettings: WeatherSettings) => {
        // Check if city has changed
        const requiresReinit =
            settings.city !== newSettings.city || settings.provider !== newSettings.provider;
        setSettings(newSettings);
        // If critical settings changed, increment the key to force WeatherCard remount
        if (requiresReinit) {
            setSettingsKey((prevKey) => prevKey + 1);
        }
    };

    return (
        <Box
            className='weather-container'
            sx={{
                position: 'relative',
                width: '100vw',
                margin: 0,
                padding: 0,
                left: 0,
                top: 0,
                boxSizing: 'border-box',
            }}
        >
            <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                <WeatherSettingsDialog settings={settings} onSaveSettings={handleSaveSettings} />
            </Box>
            <WeatherCard key={settingsKey} settings={settings} />
        </Box>
    );
};
