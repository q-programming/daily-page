import { useMemo, useState } from 'react';
import {
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Tooltip,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTranslation } from 'react-i18next';
import { AboutEn } from './help/about_en.tsx';
import { AboutPl } from './help/about_pl.tsx';

export const Help = () => {
    const { i18n, t } = useTranslation();
    const [open, setOpen] = useState(false);

    const isPl = (i18n.language || '').toLowerCase().startsWith('pl');
    const Content = isPl ? AboutPl : AboutEn;
    const helpText = useMemo(() => t('header.help'), [i18n.language]);

    return (
        <>
            <Tooltip title={helpText}>
                <IconButton
                    sx={{ color: 'inherit' }}
                    aria-label={helpText}
                    color='primary'
                    onClick={() => setOpen(true)}
                    data-testid='help-button'
                >
                    <HelpOutlineIcon />
                </IconButton>
            </Tooltip>
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                fullWidth
                maxWidth='sm'
                data-testid='help-dialog'
            >
                <DialogTitle>{helpText}</DialogTitle>
                <DialogContent dividers>
                    <Content />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} autoFocus>
                        {t('common.close')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
