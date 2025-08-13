export interface CalendarSettings {
    isConnected: boolean;
    selectedCalendarIds: string[];
    daysAhead: number;
}

export interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime: string;
        date?: string;
    };
    end: {
        dateTime: string;
        date?: string;
    };
    colorId?: string;
    calendarId: string;
    calendarSummary: string;
    calendarColor: string;
}

export interface GoogleCalendar {
    id: string;
    summary: string;
    backgroundColor: string;
    selected?: boolean;
}

export interface GroupedEvents {
    [date: string]: CalendarEvent[];
}
