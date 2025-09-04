import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import '../../App.css';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
    const { i18n } = useTranslation();
    const year = new Date().getFullYear();
    const theme = useTheme();
    return (
        <Box
            component='footer'
            className='footer'
            sx={{
                backgroundColor: theme.palette.background.paper,
                borderTop: `1px solid ${theme.palette.divider}`,
            }}
        >
            <Typography variant='body2' color='text.secondary'>
                &copy; {year} Q-Programming. All rights reserved.{' '}
                <a
                    href={`https://q-programming.pl/privacy/daily/privacypolicy_${i18n.language}.html`}
                    target='_blank'
                    rel='noopener noreferrer'
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                    Privacy Policy
                </a>
            </Typography>
        </Box>
    );
};

export default Footer;
