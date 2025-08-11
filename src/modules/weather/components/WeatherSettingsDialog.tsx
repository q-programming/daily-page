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
    Divider,
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
    const [apiKey, setApiKey] = useState(settings.apiKey || '');
    const [iqairApiKey, setIqairApiKey] = useState(settings.iqairApiKey || '');
    const [city, setCity] = useState(settings.city || '');

    const handleOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };
    const handleSave = async () => {
        onSaveSettings({
            apiKey,
            iqairApiKey,
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
                            {t('settings.apiKeyDescription')}{' '}
                            <a
                                href='https://developer.accuweather.com/'
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                {t('settings.apiKeyLink')}
                            </a>
                            .
                        </Typography>

                        <TextField
                            label={t('settings.apiKeyLabel')}
                            fullWidth
                            margin='normal'
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={t('settings.apiKeyPlaceholder')}
                            helperText={t('settings.apiKeyHelp')}
                            required
                            data-testid='weather-settings-api-key'
                        />

                        <Divider sx={{ my: 2 }} />

                        <Typography variant='body2' color='text.secondary' paragraph>
                            Enter your IQAir API key to fetch air quality data. You can get a free
                            API key from the{' '}
                            <a
                                href='https://www.iqair.com/dashboard/api'
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                IQAir API Dashboard
                            </a>
                            .
                        </Typography>

                        <TextField
                            label='IQAir API Key'
                            fullWidth
                            margin='normal'
                            value={iqairApiKey}
                            onChange={(e) => setIqairApiKey(e.target.value)}
                            placeholder='Enter your IQAir API key'
                            helperText='Required for air quality data'
                            data-testid='weather-settings-iqair-api-key'
                        />

                        <Divider sx={{ my: 2 }} />

                        <TextField
                            label={t('settings.cityLabel')}
                            fullWidth
                            margin='normal'
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder={t('settings.cityPlaceholder')}
                            helperText={t('settings.cityHelp')}
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
                        variant='contained'
                        disabled={!apiKey}
                        data-testid={'weather-settings-save'}
                    >
                        {t('settings.save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
