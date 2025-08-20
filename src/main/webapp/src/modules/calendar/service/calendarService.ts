import { AuthApi, type Calendar, CalendarApi, type CalendarEvent, Configuration } from '@api';
import axios from 'axios';

const configuration = new Configuration({
    basePath: '/daily/api',
});
const api = axios.create({
    withCredentials: true,
});
const calendarApi = new CalendarApi(configuration, '', api);
const authApi = new AuthApi(configuration, '', api);

export class CalendarService {
    private isAuthenticated = false;

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
    public async initialize(wasConnected: boolean): Promise<void> {
        await this.checkAuthentication();
        if (wasConnected && !this.isAuthenticated) {
            console.log(
                'User was previously connected but session expired. Redirecting to login...',
            );
            this.signIn();
        }
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
    public signIn(): void {
        try {
            window.location.href = '/daily/api/auth/login';
        } catch (error) {
            console.error('Error during sign in:', error);
        }
    }

    public signOut(): void {
        try {
            localStorage.removeItem('calendarSettings');
            this.isAuthenticated = false;
            window.location.href = '/daily/api/auth/logout';
        } catch (error) {
            console.error('Error during sign out:', error);
        }
    }

    public async fetchCalendarList(): Promise<Calendar[]> {
        if (!this.isAuthenticated) {
            await this.checkAuthentication();
            if (!this.isAuthenticated) {
                throw new Error('User is not signed in');
            }
        }

        try {
            const response = await calendarApi.getCalendarList();
            return response.data.map((calendar: Calendar) => ({
                ...calendar,
                color: calendar.color || '#039be5', // Default color if not provided
            }));
        } catch (error) {
            console.error('Error fetching calendar list:', error);
            throw error;
        }
    }

    public async fetchEvents(calendars: Calendar[], daysAhead: number): Promise<CalendarEvent[]> {
        if (calendars.length === 0) {
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
            // Fetch events from each selected calendar
            const promises = calendars.map(async (calendar) => {
                const calendarId = calendar.id;
                try {
                    // Use saved calendar data or default
                    try {
                        const response = await calendarApi.getCalendarEvents(calendarId, daysAhead);
                        if (response.data) {
                            return response.data.map((event: CalendarEvent) => ({
                                id: event.id || '',
                                summary: event.summary || '(No title)',
                                description: event.description,
                                start: {
                                    dateTime: event.start?.dateTime || '',
                                    date: event.start?.date || '',
                                },
                                end: {
                                    dateTime: event.end?.dateTime || '',
                                    date: event.end?.date || '',
                                },
                                calendarId: calendarId,
                                calendarSummary: calendar.summary,
                                calendarColor: calendar.color || '#039be5',
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
                const dateA = a.start?.dateTime ? new Date(a.start.dateTime) : new Date();
                const dateB = b.start?.dateTime ? new Date(b.start.dateTime) : new Date();
                return dateA.getTime() - dateB.getTime();
            });
        } catch (error) {
            console.error('Error fetching events:', error);
            return [];
        }
    }
}
