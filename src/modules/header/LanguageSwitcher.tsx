import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Menu, MenuItem } from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';

const supportedLanguages = [
    { code: 'pl', name: 'Polski' },
    { code: 'en', name: 'English' },
];
export const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const changeLanguage = (languageCode: string) => {
        i18n.changeLanguage(languageCode).then(() => {
            handleClose();
            console.log(`Language changed to: ${languageCode}`);
            console.log('Current i18n language:', i18n.language);
        });
    };

    // Find the current language display name
    const currentLanguage =
        supportedLanguages.find((lang) => lang.code === i18n.language)?.name || 'English';

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <Button
                id='language-button'
                aria-controls={open ? 'language-menu' : undefined}
                aria-haspopup='true'
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                startIcon={<LanguageIcon />}
                size='small'
                sx={{ color: 'inherit' }}
                data-testid='language-switcher-button'
            >
                {currentLanguage}
            </Button>
            <Menu
                id='language-menu'
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'language-button',
                }}
                data-testid='language-menu'
            >
                {supportedLanguages.map((language) => (
                    <MenuItem
                        key={language.code}
                        onClick={() => changeLanguage(language.code)}
                        selected={i18n.language === language.code}
                        data-testid={`language-option-${language.code}`}
                    >
                        {language.name}
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
};
