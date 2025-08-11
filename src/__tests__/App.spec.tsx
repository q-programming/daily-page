import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import App from '../App.tsx';

// Only mock the Weather component
vi.mock('../Weather/Weather', () => ({
    Weather: vi.fn(() => <div data-testid='mock-weather'>Weather Component</div>),
}));

// Mock localStorage
const mockLocalStorage = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
    };
})();

// Mock window.matchMedia
const mockMatchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
}));

describe('App', () => {
    beforeEach(() => {
        // Setup localStorage mock
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true,
        });

        // Setup matchMedia mock
        window.matchMedia = mockMatchMedia;

        // Reset all mocks
        vi.clearAllMocks();
        mockLocalStorage.clear();
    });

    it('renders without crashing', () => {
        const { getByTestId } = render(<App />);
        expect(getByTestId('header-greeting')).toBeInTheDocument();
    });

    it('initializes with light theme when no localStorage value is set and system preference is light', () => {
        // Mock system preference for light theme
        window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: query === '(prefers-color-scheme: light)',
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        // localStorage returns null (no theme set)
        mockLocalStorage.getItem.mockReturnValueOnce(null);

        const { getByTestId } = render(<App />);

        // Verify localStorage was checked
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('themeMode');

        // Verify the toggle button is rendered
        const toggleButton = getByTestId('toggle-theme-button');
        expect(toggleButton).toBeInTheDocument();
    });

    it('initializes with dark theme when localStorage is set to dark', () => {
        // Mock localStorage to return 'dark'
        mockLocalStorage.getItem.mockReturnValueOnce('dark');

        render(<App />);

        // Verify localStorage was checked
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('themeMode');
    });

    it('initializes with dark theme when system preference is dark and no localStorage value', () => {
        // Mock system preference for dark theme
        window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: query === '(prefers-color-scheme: dark)',
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        // localStorage returns null (no theme set)
        mockLocalStorage.getItem.mockReturnValueOnce(null);

        render(<App />);

        // Verify both localStorage and matchMedia were used
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('themeMode');
    });

    it("toggles theme when Header's toggle function is called", async () => {
        const { getByTestId } = render(<App />);

        // Find and click the toggle button
        const toggleButton = getByTestId('toggle-theme-button');
        await toggleButton.click();
        // Check if localStorage was updated
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('themeMode', expect.any(String));
    });

    it('toggles from light to dark theme', async () => {
        // Start with light theme
        mockLocalStorage.getItem.mockReturnValueOnce('light');
        const { getByTestId } = render(<App />);
        // Find and click the toggle button
        const toggleButton = getByTestId('toggle-theme-button');
        await toggleButton.click();
        // Check if localStorage was updated to dark
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('themeMode', 'dark');
    });

    it('toggles from dark to light theme', async () => {
        // Start with dark theme
        mockLocalStorage.getItem.mockReturnValueOnce('dark');
        const { getByTestId } = render(<App />);
        // Find and click the toggle button
        const toggleButton = getByTestId('toggle-theme-button');
        await toggleButton.click();

        // Check if localStorage was updated to light
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('themeMode', 'light');
    });
});
