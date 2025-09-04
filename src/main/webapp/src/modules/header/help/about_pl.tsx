import { Box, List, ListItem, ListItemText } from '@mui/material';

export const AboutPl = () => {
    return (
        <Box data-testid='about-pl'>
            <List dense>
                <ListItem>
                    <ListItemText
                        primary='O tej stronie'
                        secondary='To mała strona do codziennego użytku, pokazująca aktualną pogodę i nadchodzące
                wydarzenia z Twojego Kalendarza Google.'
                    />
                </ListItem>
                <ListItem>
                    <ListItemText
                        primary='Nadchodząca pogoda dla Twojej lokalizacji'
                        secondary='Ustaw swoją lokalizację w Ustawieniach, aby zobaczyć bieżącą i nadchodzącą prognozę pogody.'
                    />
                </ListItem>
                <ListItem>
                    <ListItemText
                        primary='Integracja z Kalendarzem Google'
                        secondary='Połącz swoje konto Google, aby wybrać kalendarze i wyświetlać nadchodzące wydarzenia dla wybranego zakresu dni.
                         Jeżeli chcesz usunąć integrację, po prostu rozłącz swoje konto Google w Ustawieniach.'
                    />
                </ListItem>
            </List>
        </Box>
    );
};
