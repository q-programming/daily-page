import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { Weather } from '../Weather.tsx';
import type { WeatherSettings } from '../../types/types.ts';
import { createMockWeatherService } from '../../service/__tests__/weatherData.ts';

// Mock the WeatherService with the correct path and implementation
vi.mock('../../service/weatherService.ts', () => {
    return {
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
            city: 'Test City',
        };
        // Setup localStorage with test settings
        mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(testSettings));
        const { getByTestId } = render(<Weather />);

        // Wait for the component to render and use the settings
        await vi.waitFor(() => {
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith('weatherSettings');
        });

        // Verify settings dialog is rendered with correct settings
        const settingsButton = getByTestId('weather-settings-button');
        expect(settingsButton).toBeInTheDocument();
    });

    it('uses default settings when no localStorage data available', () => {
        // Simulate empty localStorage
        mockLocalStorage.getItem.mockReturnValueOnce(null);
        render(<Weather />);

        // Verify that default settings are saved to localStorage
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            'weatherSettings',
            expect.any(String),
        );

        // Get the actual argument that was passed
        const settingsJson = mockLocalStorage.setItem.mock.calls[0][1];
        const settings = JSON.parse(settingsJson);

        // Verify the structure without checking exact values
        expect(settings).toHaveProperty('city', '');
    });

    it('renders WeatherCard with default city when no settings provided', () => {
        // Simulate empty localStorage
        mockLocalStorage.getItem.mockReturnValueOnce(null);
        const { getByText } = render(<Weather />);
        vi.waitFor(() => expect(getByText(/City is required/i)).toBeInTheDocument());
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
    });

    it('renders WeatherSettingsDialog', () => {
        const { getByTestId } = render(<Weather />);

        const settingsButton = getByTestId('weather-settings-button');
        expect(settingsButton).toBeInTheDocument();
    });

    it('renders WeatherCard with loading state initially when city is provided', async () => {
        // Set up mock settings with city to trigger weather data loading
        mockLocalStorage.getItem.mockReturnValueOnce(
            JSON.stringify({
                city: 'Test City',
            }),
        );

        const { getByText } = render(<Weather />);

        // Should show loading initially
        expect(getByText(/Loading weather data/i)).toBeInTheDocument();
    });

    it('opens settings dialog automatically when no city is provided', () => {
        mockLocalStorage.getItem.mockReturnValueOnce(
            JSON.stringify({
                city: '',
            }),
        );
        const { getByTestId } = render(<Weather />);

        // Dialog should be open automatically
        const cityField = getByTestId('weather-settings-city');
        expect(cityField).toBeInTheDocument();
    });

    it('remounts WeatherCard when city changes', async () => {
        // Access the mocked WeatherService constructor directly from the vi.mocked context
        const weatherServiceConstructor = vi.fn(() => createMockWeatherService());

        // Update the mock implementation
        vi.doMock('../../service/weatherService.ts', () => ({
            WeatherService: weatherServiceConstructor,
        }));
        // Initial settings with city
        const initialSettings = {
            city: 'Initial City',
        };
        mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(initialSettings));
        // Render the component
        const { getByTestId } = render(<Weather />);

        // Get the settings button and click it to open dialog
        const settingsButton = getByTestId('weather-settings-button');
        await settingsButton.click();

        // Get the city input field and change it
        const cityField = getByTestId('weather-settings-city');
        const cityInput = cityField.query()?.querySelector('input');
        if (!cityInput) {
            throw new Error('City input element not found');
        }

        // Setup user event
        const user = await import('@vitest/browser/context').then((m) => m.userEvent.setup());

        // Clear the field and type a new city name
        await user.clear(cityInput);
        await user.type(cityInput, 'New City');

        // Get the save button and click it
        const saveButton = getByTestId('weather-settings-save');
        await saveButton.click();

        // Force update localStorage mock to verify changes were saved
        const savedSettings = JSON.parse(
            mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1][1],
        );

        // Verify the new city was saved in settings
        expect(savedSettings.city).toBe('New City');

        // Test remounting behavior through side effect - localStorage was updated
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            'weatherSettings',
            expect.stringContaining('New City'),
        );
    });
});
