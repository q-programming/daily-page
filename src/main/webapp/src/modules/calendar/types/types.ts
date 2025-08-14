import type { Calendar, CalendarEvent } from '@api';

export interface CalendarSettings {
    isConnected: boolean;
    selectedCalendars: Calendar[];
    daysAhead: number;
}

export interface GroupedEvents {
    [date: string]: CalendarEvent[];
}
