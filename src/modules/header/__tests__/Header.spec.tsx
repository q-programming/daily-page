import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { Header } from '../Header.tsx';

describe('Header', () => {
    it('renders header greeting', () => {
        const onToggleTheme = vi.fn();
        const { getByTestId } = render(<Header onToggleTheme={onToggleTheme} />);
        const headerText = getByTestId('header-greeting');
        expect(headerText).toBeInTheDocument();
    });

    it('should call toggle function on click of button', async () => {
        const onToggleTheme = vi.fn();
        const { getByTestId } = render(<Header onToggleTheme={onToggleTheme} />);
        const toggleButton = getByTestId('toggle-theme-button');
        expect(toggleButton).toBeInTheDocument();
        await toggleButton.click();
        expect(onToggleTheme).toHaveBeenCalledTimes(1);
    });
});
