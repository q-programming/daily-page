import { useState, useEffect } from 'react';
import { Box, Typography, IconButton, useTheme } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Help } from './Help';

interface HeaderProps {
    onToggleTheme?: () => void;
}

export const Header = ({ onToggleTheme }: HeaderProps) => {
    const [greeting, setGreeting] = useState<string>('');
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const { t } = useTranslation();

    useEffect(() => {
        const getTimeBasedGreeting = () => {
            const currentHour = new Date().getHours();

            if (currentHour >= 5 && currentHour < 12) {
                setGreeting(t('header.morning'));
            } else if (currentHour >= 12 && currentHour < 18) {
                setGreeting(t('header.afternoon'));
            } else if (currentHour >= 18 && currentHour < 22) {
                setGreeting(t('header.evening'));
            } else {
                setGreeting(t('header.night'));
            }
        };
        getTimeBasedGreeting();
        // Update greeting every minute in case we cross a time threshold
        const intervalId = setInterval(getTimeBasedGreeting, 60000);
        return () => clearInterval(intervalId);
    }, [t]);

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: { xs: 2, sm: 3 },
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
            }}
        >
            <Typography variant='h5' component='h1' fontWeight='bold' data-testid='header-greeting'>
                {greeting}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Help />
                <LanguageSwitcher />
                <IconButton
                    onClick={onToggleTheme}
                    aria-label='toggle theme'
                    data-testid='toggle-theme-button'
                    sx={{ color: 'inherit' }}
                >
                    {isDarkMode ? <DarkModeIcon /> : <LightModeIcon />}
                </IconButton>
            </Box>
        </Box>
    );
};
