import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { LanguageSwitcher } from '../LanguageSwitcher';

// Mock for the useTranslation hook
const mockChangeLanguage = vi.fn();
let mockLanguage = 'en';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            language: mockLanguage,
            changeLanguage: mockChangeLanguage,
        },
    }),
}));

describe.skip('LanguageSwitcher', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLanguage = 'en'; // Reset to English before each test
    });

    it('renders language switcher button with current language', () => {
        const { getByTestId } = render(<LanguageSwitcher />);

        const button = getByTestId('language-switcher-button');
        expect(button).toBeInTheDocument();
        expect(button.query()?.textContent).toContain('English');
    });

    it('shows Polish as current language when i18n.language is set to pl', () => {
        // Set language to Polish for this test
        mockLanguage = 'pl';

        const { getByTestId } = render(<LanguageSwitcher />);

        const button = getByTestId('language-switcher-button');
        expect(button).toBeInTheDocument();
        expect(button.query()?.textContent).toContain('Polski');
    });

    it('calls changeLanguage when a language is selected', async () => {
        const { getByTestId } = render(<LanguageSwitcher />);

        // Open the menu
        const button = getByTestId('language-switcher-button');
        await button.click();

        // Select Polish option
        const polishOption = getByTestId('language-option-pl');
        await polishOption.click();

        // Verify changeLanguage was called with 'pl'
        expect(mockChangeLanguage).toHaveBeenCalledWith('pl');
    });
});
