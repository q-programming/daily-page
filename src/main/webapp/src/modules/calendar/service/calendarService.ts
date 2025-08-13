import type { CalendarEvent, GoogleCalendar } from '../types/types';
import { AuthApi, CalendarApi, Configuration } from '@api';

// Define types for API responses using the models from the API schema
interface Calendar {
    id?: string;
    summary?: string;
    description?: string;
    timeZone?: string;
    primary?: boolean;
}

interface CalendarEventResponse {
    id?: string;
    summary?: string;
    description?: string;
    location?: string;
    start?: {
        dateTime?: string;
        timeZone?: string;
    };
    end?: {
        dateTime?: string;
        timeZone?: string;
    };
    htmlLink?: string;
    colorId?: string;
}

const configuration = new Configuration({
    basePath: '/daily/api',
});

const calendarApi = new CalendarApi(configuration);
const authApi = new AuthApi(configuration);

export class CalendarService {
    private isAuthenticated = false;

    constructor() {
        this.checkAuthentication();
    }

    /**
     * Check if user is authenticated
     */
    private async checkAuthentication(): Promise<void> {
        try {
            const response = await authApi.getCurrentUser();
            this.isAuthenticated = response.data.authenticated || false;
        } catch (error) {
            console.error('Error checking authentication:', error);
            this.isAuthenticated = false;
        }
    }

    /**
     * Initialize the calendar service
     */
    public async initialize(): Promise<void> {
        await this.checkAuthentication();
    }

    /**
     * Check if user is signed in
     */
    public isSignedIn(): boolean {
        return this.isAuthenticated;
    }

    /**
     * Sign in with Google through the backend OAuth endpoint
     */
    public async signIn(): Promise<void> {
        try {
            window.location.href = '/daily/oauth2/authorization/google';
        } catch (error) {
            console.error('Error during sign in:', error);
            throw error;
        }
    }

    public async signOut(): Promise<void> {
        try {
            await authApi.logoutUser();
            this.isAuthenticated = false;
            localStorage.removeItem('calendarSettings');
        } catch (error) {
            console.error('Error during sign out:', error);
            throw error;
        }
    }

    public async fetchCalendarList(): Promise<GoogleCalendar[]> {
        if (!this.isAuthenticated) {
            await this.checkAuthentication();
            if (!this.isAuthenticated) {
                throw new Error('User is not signed in');
            }
        }

        try {
            const response = await calendarApi.getCalendarList();

            // Transform the backend calendar objects to our frontend model
            return response.data.map((calendar: Calendar) => ({
                id: calendar.id || '',
                summary: calendar.summary || '',
                backgroundColor: '#039be5', // Default color if not provided
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

        if (!this.isAuthenticated) {
            await this.checkAuthentication();
            if (!this.isAuthenticated) {
                console.warn('User is not signed in, cannot fetch events');
                return [];
            }
        }

        try {
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
                        const response = await calendarApi.getCalendarEvents(calendarId, daysAhead);
                        if (response.data) {
                            return response.data.map((event: CalendarEventResponse) => ({
                                id: event.id || '',
                                summary: event.summary || '(No title)',
                                description: event.description,
                                start: {
                                    dateTime: event.start?.dateTime || '',
                                    date: undefined, // Backend should provide dateTime
                                },
                                end: {
                                    dateTime: event.end?.dateTime || '',
                                    date: undefined, // Backend should provide dateTime
                                },
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
                const dateA = a.start.dateTime ? new Date(a.start.dateTime) : new Date();
                const dateB = b.start.dateTime ? new Date(b.start.dateTime) : new Date();
                return dateA.getTime() - dateB.getTime();
            });
        } catch (error) {
            console.error('Error fetching events:', error);
            return [];
        }
    }
}
