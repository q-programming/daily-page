import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { LanguageSwitcher } from '../LanguageSwitcher';
import i18n from '../../../i18n/i18n';

describe('LanguageSwitcher', () => {
    beforeEach(() => {
        i18n.changeLanguage('en');
    });

    it('renders language switcher button with current language in aria-label', async () => {
        const { getByTestId } = render(<LanguageSwitcher />);
        const button = getByTestId('language-switcher-button');
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('aria-label', expect.stringContaining('English'));
    });

    it('shows Polish as current language in aria-label when i18n language is set to pl', async () => {
        await i18n.changeLanguage('pl');
        const { getByTestId } = render(<LanguageSwitcher />);
        await vi.waitFor(() => {
            const button = getByTestId('language-switcher-button');
            expect(button).toBeInTheDocument();
            expect(button).toHaveAttribute('aria-label', expect.stringContaining('Polski'));
        });
    });
});
