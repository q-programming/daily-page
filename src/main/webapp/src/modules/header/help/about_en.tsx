import { Box, List, ListItem, ListItemText } from '@mui/material';

export const AboutEn = () => {
    return (
        <Box data-testid='about-en'>
            <List dense>
                <ListItem>
                    <ListItemText
                        secondary='This is small page for daily use, showing current weather and upcoming events
                    from your Google Calendar.'
                    />
                </ListItem>
                <ListItem>
                    <ListItemText
                        primary='Upcoming weather for your location'
                        secondary='Define your location in Settings to see the current and upcoming weather forecast.'
                    />
                </ListItem>
                <ListItem>
                    <ListItemText
                        primary='Google Calendar integration'
                        secondary='Connect your Google account to select calendars and display upcoming events for a chosen number of days.'
                    />
                </ListItem>
            </List>
        </Box>
    );
};
