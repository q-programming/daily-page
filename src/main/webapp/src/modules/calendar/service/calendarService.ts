import ApiCalendar from 'react-google-calendar-api';
import type { GoogleCalendar, CalendarEvent } from '../types/types';

// Define types for the API responses
interface CalendarListItem {
    id: string;
    summary: string;
    backgroundColor?: string;
}

interface CalendarEventItem {
    id: string;
    summary?: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
    };
    colorId?: string;
}

export class CalendarService {
    private apiCalendar: ApiCalendar | null;
    private initializing = false;

    constructor() {
        // Just create the configuration object in constructor
        // Actual initialization will happen in initialize() method
        this.apiCalendar = null;
    }

    /**
     * Initialize the calendar service
     */
    public async initialize(): Promise<void> {
        if (this.apiCalendar) {
            return;
        }

        if (this.initializing) {
            // Wait for initialization to complete
            await new Promise<void>((resolve) => {
                const checkInterval = setInterval(() => {
                    if (this.apiCalendar) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
            return;
        }

        this.initializing = true;

        try {
            console.log('Initializing Calendar Service...');
            // Create a new instance of ApiCalendar with config
            this.apiCalendar = new ApiCalendar({
                clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
                scope: 'https://www.googleapis.com/auth/calendar.readonly',
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            });
            console.log('Calendar service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize calendar service:', error);
            throw error;
        } finally {
            this.initializing = false;
        }
    }

    /**
     * Check if user is signed in
     */
    public isSignedIn(): boolean {
        // Only use the ApiCalendar's internal sign state
        return this.apiCalendar?.sign === true;
    }

    /**
     * Sign in with Google
     */
    public async signIn(): Promise<void> {
        if (!this.apiCalendar) {
            await this.initialize();
        }
        if (!this.apiCalendar) {
            throw new Error('Calendar service is not initialized');
        }
        try {
            const result = await this.apiCalendar.handleAuthClick();
            console.log('Authentication result:', result);
            // Store authentication state in localStorage
            localStorage.setItem('googleCalendarSession', 'true');
            console.log('Authentication successful, sign state:', this.apiCalendar.sign);
        } catch (error) {
            console.error('Error during sign in:', error);
            throw error;
        }
    }

    public signOut(): void {
        if (!this.apiCalendar) {
            return;
        }

        try {
            this.apiCalendar.handleSignoutClick();
            localStorage.removeItem('googleCalendarSession');
        } catch (error) {
            console.error('Error during sign out:', error);
        }
    }

    public async fetchCalendarList(): Promise<GoogleCalendar[]> {
        if (!this.apiCalendar) {
            await this.initialize();
        }
        if (!this.apiCalendar) {
            throw new Error('Calendar service is not initialized');
        }
        if (!this.isSignedIn()) {
            throw new Error('User is not signed in');
        }

        try {
            const response = await this.apiCalendar.listCalendars();
            return response.result.items.map((calendar: CalendarListItem) => ({
                id: calendar.id,
                summary: calendar.summary,
                backgroundColor: calendar.backgroundColor || '#039be5',
            }));
        } catch (error) {
            console.error('Error fetching calendar list:', error);
            throw error;
        }
    }

    public async fetchEvents(calendarIds: string[], daysAhead: number): Promise<CalendarEvent[]> {
        if (calendarIds.length === 0) {
            return [];
        }

        if (!this.apiCalendar) {
            await this.initialize();
        }
        if (!this.apiCalendar) {
            throw new Error('Calendar service is not initialized');
        }
        if (!this.isSignedIn()) {
            console.warn('User is not signed in, cannot fetch events');
            return [];
        }
        try {
            const timeMin = new Date();
            const timeMax = new Date();
            timeMax.setDate(timeMax.getDate() + daysAhead);

            const allEvents: CalendarEvent[] = [];

            // Get the selected calendars from calendarSettings
            const savedSettings = localStorage.getItem('calendarSettings');
            let calendarMap = new Map<string, GoogleCalendar>();

            if (savedSettings) {
                try {
                    const settings = JSON.parse(savedSettings);

                    // If we have saved calendar data in the settings, use it
                    if (settings.selectedCalendars && Array.isArray(settings.selectedCalendars)) {
                        const calendarList = settings.selectedCalendars;
                        calendarMap = new Map(
                            calendarList.map((calendar: GoogleCalendar) => [calendar.id, calendar]),
                        );
                    }
                } catch (e) {
                    console.error('Error parsing saved calendar settings:', e);
                }
            }

            // Fetch events from each selected calendar
            const promises = calendarIds.map(async (calendarId) => {
                try {
                    // Default color and name if we don't have stored data
                    const defaultCalendarInfo = {
                        id: calendarId,
                        summary: calendarId.split('@')[0], // Simple name from email
                        backgroundColor: '#039be5',
                    };

                    // Use saved calendar data or default
                    const calendar = calendarMap.get(calendarId) || defaultCalendarInfo;

                    try {
                        const response = await this.apiCalendar?.listEvents({
                            calendarId: calendarId,
                            timeMin: timeMin.toISOString(),
                            timeMax: timeMax.toISOString(),
                            showDeleted: false,
                            singleEvents: true,
                            orderBy: 'startTime',
                        });

                        if (response?.result?.items) {
                            return response.result.items.map((event: CalendarEventItem) => ({
                                id: event.id,
                                summary: event.summary || '(No title)',
                                description: event.description,
                                start: event.start,
                                end: event.end,
                                colorId: event.colorId,
                                calendarId: calendarId,
                                calendarSummary: calendar.summary,
                                calendarColor: calendar.backgroundColor,
                            }));
                        }
                    } catch (err) {
                        console.error(`Error fetching events for calendar ${calendarId}:`, err);
                    }

                    return [];
                } catch (err) {
                    console.error(`Error processing calendar ${calendarId}:`, err);
                    return [];
                }
            });

            // Wait for all promises, but handle individual calendar failures
            const results = await Promise.all(promises);
            results.forEach((events) => {
                if (Array.isArray(events)) {
                    allEvents.push(...events);
                }
            });

            // Sort all events by date
            return allEvents.sort((a, b) => {
                const dateA = a.start.dateTime
                    ? new Date(a.start.dateTime)
                    : new Date(a.start.date || new Date().toISOString());
                const dateB = b.start.dateTime
                    ? new Date(b.start.dateTime)
                    : new Date(b.start.date || new Date().toISOString());
                return dateA.getTime() - dateB.getTime();
            });
        } catch (error) {
            console.error('Error fetching events:', error);
            return [];
        }
    }
}
