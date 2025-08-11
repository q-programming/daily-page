import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { WeatherSettingsDialog } from '../WeatherSettingsDialog.tsx';
import type { WeatherSettings } from '../../types/types.ts';
import { userEvent } from '@vitest/browser/context';

describe('WeatherSettingsDialog', () => {
    const mockSettings: WeatherSettings = {
        apiKey: 'test-api-key',
        iqairApiKey: 'test-iqair-key',
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

        // Dialog should now be visible with its fields
        expect(getByTestId('weather-settings-api-key')).toBeInTheDocument();
        expect(getByTestId('weather-settings-iqair-api-key')).toBeInTheDocument();
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

        // Check if fields are pre-filled with settings values
        const apiKeyField = getByTestId('weather-settings-api-key').query()?.querySelector('input');
        const iqairApiKeyField = getByTestId('weather-settings-iqair-api-key')
            .query()
            ?.querySelector('input');
        const cityField = getByTestId('weather-settings-city').query()?.querySelector('input');

        expect(cityField).toHaveValue('Test City');
        expect(apiKeyField).toHaveValue('test-api-key');
        expect(iqairApiKeyField).toHaveValue('test-iqair-key');
    });

    it('updates input values when typing', async () => {
        const { getByTestId } = render(
            <WeatherSettingsDialog
                settings={{ apiKey: '', iqairApiKey: '', city: '' }}
                onSaveSettings={vi.fn()}
            />,
        );
        // Open dialog
        const settingsButton = getByTestId('weather-settings-button');
        await settingsButton.click();
        // Get input fields
        const apiKeyField = getByTestId('weather-settings-api-key');
        expect(apiKeyField).toBeInTheDocument();
        const inputElement = apiKeyField.query()?.querySelector('input');
        if (!inputElement) {
            throw new Error('Input element not found');
        }
        const user = userEvent.setup();
        await user.type(inputElement, 'new-api-key');
        expect(inputElement).toHaveValue('new-api-key');
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

    it('does nothing when cancel button is clicked', async () => {
        const onSaveSettings = vi.fn();
        const { getByTestId } = render(
            <WeatherSettingsDialog settings={mockSettings} onSaveSettings={onSaveSettings} />,
        );

        // Open dialog
        const settingsButton = getByTestId('weather-settings-button');
        await settingsButton.click();

        // Dialog should be visible
        expect(getByTestId('weather-settings-api-key')).toBeInTheDocument();

        // Click cancel button
        const cancelButton = getByTestId('weather-settings-cancel');
        await cancelButton.click();

        // onSaveSettings should not have been called
        expect(onSaveSettings).not.toHaveBeenCalled();
    });

    it('has disabled save button with empty API key', async () => {
        const onSaveSettings = vi.fn();
        const emptySettings: WeatherSettings = {
            apiKey: '',
            iqairApiKey: '',
            city: '',
        };

        const { getByTestId } = render(
            <WeatherSettingsDialog settings={emptySettings} onSaveSettings={onSaveSettings} />,
        );

        // Open dialog
        const settingsButton = getByTestId('weather-settings-button');
        await settingsButton.click();

        // Save button should exist and be disabled
        const saveButton = getByTestId('weather-settings-save');
        expect(saveButton).toBeInTheDocument();
        expect(saveButton).toHaveAttribute('disabled');
    });
});
