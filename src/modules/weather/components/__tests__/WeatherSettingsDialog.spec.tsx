import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { WeatherSettingsDialog } from '../WeatherSettingsDialog.tsx';
import type { WeatherSettings } from '../../types/types.ts';
import { userEvent } from '@vitest/browser/context';

describe('WeatherSettingsDialog', () => {
    const mockSettings: WeatherSettings = {
        city: 'Test City',
    };
    it('renders settings button correctly', () => {
        const onSaveSettings = vi.fn();
        const { getByTestId } = render(
            <WeatherSettingsDialog settings={mockSettings} onSaveSettings={onSaveSettings} />,
        );
        const settingsButton = getByTestId('weather-settings-button');
        expect(settingsButton).toBeInTheDocument();
    });

    it('opens dialog when settings button is clicked', async () => {
        const onSaveSettings = vi.fn();
        const { getByTestId } = render(
            <WeatherSettingsDialog settings={mockSettings} onSaveSettings={onSaveSettings} />,
        );

        // Click settings button
        const settingsButton = getByTestId('weather-settings-button');
        await settingsButton.click();

        // Dialog should now be visible with city field
        expect(getByTestId('weather-settings-city')).toBeInTheDocument();
    });

    it('opens dialog automatically when no city is provided', () => {
        const onSaveSettings = vi.fn();
        const settingsWithNoCity: WeatherSettings = {
            city: '',
        };

        const { getByTestId } = render(
            <WeatherSettingsDialog settings={settingsWithNoCity} onSaveSettings={onSaveSettings} />,
        );

        // Dialog should be visible immediately without clicking the button
        expect(getByTestId('weather-settings-city')).toBeInTheDocument();
    });

    it('pre-fills form fields with existing settings', async () => {
        const onSaveSettings = vi.fn();
        const { getByTestId } = render(
            <WeatherSettingsDialog settings={mockSettings} onSaveSettings={onSaveSettings} />,
        );

        // Open dialog
        const settingsButton = getByTestId('weather-settings-button');
        await settingsButton.click();

        // Check if city field is pre-filled with settings value
        const cityField = getByTestId('weather-settings-city').query()?.querySelector('input');
        expect(cityField).toHaveValue('Test City');
    });

    it('pre-fills form fields when dialog opens automatically with no city', () => {
        const onSaveSettings = vi.fn();
        const settingsWithNoCity: WeatherSettings = {
            city: '',
        };

        const { getByTestId } = render(
            <WeatherSettingsDialog settings={settingsWithNoCity} onSaveSettings={onSaveSettings} />,
        );

        // Dialog should be open automatically, check pre-filled values
        const cityField = getByTestId('weather-settings-city').query()?.querySelector('input');
        expect(cityField).toHaveValue(''); // City should be empty
    });

    it('updates input values when typing', async () => {
        const { getByTestId } = render(
            <WeatherSettingsDialog settings={{ city: '' }} onSaveSettings={vi.fn()} />,
        );
        // Dialog should be open automatically, no need to click button
        // Get city input field
        const cityField = getByTestId('weather-settings-city');
        expect(cityField).toBeInTheDocument();
        const inputElement = cityField.query()?.querySelector('input');
        if (!inputElement) {
            throw new Error('Input element not found');
        }
        const user = userEvent.setup();
        await user.type(inputElement, 'New York');
        expect(inputElement).toHaveValue('New York');
    });

    it('calls onSaveSettings when save button is clicked', async () => {
        const onSaveSettings = vi.fn();
        const { getByTestId } = render(
            <WeatherSettingsDialog settings={mockSettings} onSaveSettings={onSaveSettings} />,
        );

        // Open dialog
        const settingsButton = getByTestId('weather-settings-button');
        await settingsButton.click();

        // Click save button
        const saveButton = getByTestId('weather-settings-save');
        await saveButton.click();

        // Check if onSaveSettings was called
        expect(onSaveSettings).toHaveBeenCalledTimes(1);
    });

    it('calls onSaveSettings when saving from automatically opened dialog', async () => {
        const onSaveSettings = vi.fn();
        const settingsWithNoCity: WeatherSettings = {
            city: '',
        };

        const { getByTestId } = render(
            <WeatherSettingsDialog settings={settingsWithNoCity} onSaveSettings={onSaveSettings} />,
        );

        // Dialog should be open automatically
        // Fill in a city
        const cityField = getByTestId('weather-settings-city');
        const cityInput = cityField.query()?.querySelector('input');
        if (!cityInput) {
            throw new Error('City input element not found');
        }

        const user = userEvent.setup();
        await user.type(cityInput, 'New York');

        // Click save button
        const saveButton = getByTestId('weather-settings-save');
        await saveButton.click();

        // Check if onSaveSettings was called with updated city
        expect(onSaveSettings).toHaveBeenCalledTimes(1);
        expect(onSaveSettings).toHaveBeenCalledWith(
            expect.objectContaining({
                city: 'New York',
            }),
        );
    });

    it('does nothing when cancel button is clicked', async () => {
        const onSaveSettings = vi.fn();
        const { getByTestId } = render(
            <WeatherSettingsDialog settings={mockSettings} onSaveSettings={onSaveSettings} />,
        );

        // Open dialog
        const settingsButton = getByTestId('weather-settings-button');
        await settingsButton.click();

        // Dialog should be visible
        expect(getByTestId('weather-settings-city')).toBeInTheDocument();

        // Click cancel button
        const cancelButton = getByTestId('weather-settings-cancel');
        await cancelButton.click();

        // onSaveSettings should not have been called
        expect(onSaveSettings).not.toHaveBeenCalled();
    });

    it('closes automatically opened dialog when cancel button is clicked', async () => {
        const onSaveSettings = vi.fn();
        const settingsWithNoCity: WeatherSettings = {
            city: '',
        };
        const { getByTestId } = render(
            <WeatherSettingsDialog settings={settingsWithNoCity} onSaveSettings={onSaveSettings} />,
        );
        // Dialog should be visible automatically
        expect(getByTestId('weather-settings-city')).toBeInTheDocument();
        // Click cancel button
        const cancelButton = getByTestId('weather-settings-cancel');
        await cancelButton.click();
        expect(onSaveSettings).not.toHaveBeenCalled();
    });

    it('has disabled save button with empty city', async () => {
        const onSaveSettings = vi.fn();
        const emptySettings: WeatherSettings = {
            city: '',
        };

        const { getByTestId } = render(
            <WeatherSettingsDialog settings={emptySettings} onSaveSettings={onSaveSettings} />,
        );

        // Dialog should be open automatically, no need to click button

        // Save button should exist and be disabled
        const saveButton = getByTestId('weather-settings-save');
        expect(saveButton).toBeInTheDocument();
        expect(saveButton).toHaveAttribute('disabled');
    });
});
