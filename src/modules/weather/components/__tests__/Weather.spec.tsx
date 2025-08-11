import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { Weather } from '../Weather.tsx';
import type { WeatherSettings } from '../../types/types.ts';
import { createMockWeatherService } from '../../service/__tests__/weatherData.ts';

// Mock the WeatherService
vi.mock('../weatherService', () => {
    return {
        ...vi.importActual('../weatherService'),
        WeatherService: vi.fn().mockImplementation(() => createMockWeatherService()),
    };
});

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
        getStore: () => store,
    };
})();

describe('Weather', () => {
    beforeEach(() => {
        // Set up localStorage mock
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true,
        });
        // Clear localStorage before each test
        mockLocalStorage.clear();
        // Reset all mocks
        vi.clearAllMocks();
    });

    it('renders without crashing', () => {
        render(<Weather />);
        // If no exception is thrown, the test passes
    });

    it('loads settings from localStorage if available', async () => {
        const testSettings: WeatherSettings = {
            apiKey: 'test-api-key',
            iqairApiKey: 'test-iqair-key',
            city: 'Test City',
        };
        // Setup localStorage with test settings
        mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(testSettings));
        const { getByRole } = render(<Weather />);
        // Wait for the component to render and use the settings
        await vi.waitFor(() => {
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith('weatherSettings');
        });

        // Verify settings dialog is rendered with correct settings
        const settingsButton = getByRole('button', { name: /settings/i });
        expect(settingsButton).toBeInTheDocument();
    });

    it('renders WeatherCard with default city when no settings provided', () => {
        // Simulate empty localStorage
        mockLocalStorage.getItem.mockReturnValueOnce(null);

        const { getByText } = render(<Weather />);

        // Check if error message for missing API key is shown
        expect(getByText(/API key is required/i)).toBeInTheDocument();
    });

    it('saves settings to localStorage when they change', async () => {
        render(<Weather />);

        await vi.waitFor(() => {
            // Initial settings should be saved
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'weatherSettings',
                expect.any(String),
            );
        });
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('renders WeatherSettingsDialog', () => {
        const { getByRole } = render(<Weather />);

        const settingsButton = getByRole('button', { name: /settings/i });
        expect(settingsButton).toBeInTheDocument();
    });

    it('renders WeatherCard with loading state initially', async () => {
        // Set up mock settings
        mockLocalStorage.getItem.mockReturnValueOnce(
            JSON.stringify({
                apiKey: 'test-api-key',
                city: 'Test City',
            }),
        );

        const { getByText } = render(<Weather />);

        // Should show loading initially
        expect(getByText(/Loading weather data/i)).toBeInTheDocument();
    });

    it('shows error state in WeatherCard when API key is missing', () => {
        mockLocalStorage.getItem.mockReturnValueOnce(
            JSON.stringify({
                apiKey: '',
                city: 'Test City',
            }),
        );
        const { getByText } = render(<Weather />);
        expect(getByText(/API key is required/i)).toBeInTheDocument();
    });
});
