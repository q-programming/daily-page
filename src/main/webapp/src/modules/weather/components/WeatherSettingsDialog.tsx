import { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    IconButton,
} from '@mui/material';
import type { WeatherSettings } from '../types/types.ts';
import SettingsIcon from '@mui/icons-material/Settings';
import { useTranslation } from 'react-i18next';

interface WeatherSettingsProps {
    settings: WeatherSettings;
    onSaveSettings: (settings: WeatherSettings) => void;
}

export const WeatherSettingsDialog = ({ settings, onSaveSettings }: WeatherSettingsProps) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(!settings.city);
    const [city, setCity] = useState(settings.city || '');

    const handleOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };
    const handleSave = async () => {
        onSaveSettings({
            city: city.trim() || undefined,
        });
        handleClose();
    };

    return (
        <>
            <IconButton
                onClick={handleOpen}
                size='small'
                aria-label='weather settings'
                data-testid='weather-settings-button'
            >
                <SettingsIcon fontSize='small' />
            </IconButton>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth='sm'
                fullWidth
                data-testid='weather-settings-dialog'
            >
                <DialogTitle>{t('settings.title')}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <Typography variant='body2' color='text.secondary' paragraph>
                            {t('settings.cityDescription')}
                        </Typography>

                        <TextField
                            label={t('settings.cityLabel')}
                            fullWidth
                            margin='normal'
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder={t('settings.cityPlaceholder')}
                            required
                            data-testid='weather-settings-city'
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} data-testid={'weather-settings-cancel'}>
                        {t('settings.cancel')}
                    </Button>
                    <Button
                        onClick={handleSave}
                        color='primary'
                        variant='contained'
                        disabled={!city.trim()}
                        data-testid='weather-settings-save'
                    >
                        {t('settings.save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
