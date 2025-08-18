import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { LanguageSwitcher } from '../LanguageSwitcher';
import i18n from '../../../i18n/i18n';

describe('LanguageSwitcher', () => {
    beforeEach(() => {
        i18n.changeLanguage('en');
    });

    it('renders language switcher button with current language', async () => {
        const { getByTestId } = render(<LanguageSwitcher />);
        const button = getByTestId('language-switcher-button');
        expect(button).toBeInTheDocument();
        expect(button.query()?.textContent).toContain('English');
    });

    it('shows Polish as current language when i18n language is set to pl', async () => {
        // Change language to Polish for this test
        await i18n.changeLanguage('pl');
        const { getByTestId } = render(<LanguageSwitcher />);
        await vi.waitFor(() => {
            const button = getByTestId('language-switcher-button');
            expect(button).toBeInTheDocument();
            expect(button.query()?.textContent).toContain('Polski');
        });
    });
});
