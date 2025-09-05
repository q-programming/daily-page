import { useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import type { WeatherSettings } from '../types/types.ts';
import SettingsIcon from '@mui/icons-material/Settings';
import { useTranslation } from 'react-i18next';
import type { WeatherProvider } from '@api';
import { WeatherProvider as WeatherProviders } from '@api';

interface WeatherSettingsProps {
    settings: WeatherSettings;
    onSaveSettings: (settings: WeatherSettings) => void;
}

export const WeatherSettingsDialog = ({ settings, onSaveSettings }: WeatherSettingsProps) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(!settings.city);
    const [city, setCity] = useState(settings.city || '');
    const [provider, setProvider] = useState<WeatherProvider | undefined>(settings.provider);

    const handleOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    const handleSave = async () => {
        onSaveSettings({
            city: city.trim() || undefined,
            provider: provider || undefined,
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
                    <Box sx={{ pt: 1 }}>
                        <Typography variant='body2' color='text.secondary' paragraph>
                            {t('settings.providerLabel')}
                        </Typography>
                        <FormControl fullWidth margin='normal'>
                            <InputLabel id='weather-provider-label'>
                                {t('settings.providerLabel')}
                            </InputLabel>
                            <Select
                                labelId='weather-provider-label'
                                id='weather-provider-select'
                                value={provider ?? ''}
                                label={t('settings.providerLabel')}
                                onChange={(e) =>
                                    setProvider(
                                        (e.target.value || undefined) as
                                            | WeatherProvider
                                            | undefined,
                                    )
                                }
                                data-testid='weather-settings-provider'
                            >
                                {Object.values(WeatherProviders).map((p) => (
                                    <MenuItem key={p} value={p}>
                                        {p}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
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
