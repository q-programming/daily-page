import { useState, useMemo } from 'react';
import './App.css';
import { Weather } from './modules/weather/components/Weather.tsx';
import { Header } from './modules/header/Header.tsx';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { lightTheme, darkTheme } from './theme/theme.ts';
import { Calendar } from './modules/calendar/components/Calendar.tsx';

function App() {
    // State to track if we're using dark mode
    const [isDarkMode, setIsDarkMode] = useState<boolean>(
        // Initialize based on user preference if available, otherwise use system preference
        localStorage.getItem('themeMode') === 'dark' ||
            (!localStorage.getItem('themeMode') &&
                window.matchMedia('(prefers-color-scheme: dark)').matches),
    );

    // Create the theme based on the current mode
    const theme = useMemo(() => {
        return isDarkMode ? darkTheme : lightTheme;
    }, [isDarkMode]);

    // Function to toggle theme mode
    const handleToggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem('themeMode', newMode ? 'dark' : 'light');
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline /> {/* This applies the base styles from the theme */}
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Header onToggleTheme={handleToggleTheme} />
                <Weather />
                <Calendar />
            </Box>
        </ThemeProvider>
    );
}

export default App;
