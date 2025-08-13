import type { CalendarEvent, GroupedEvents } from '../types/types';
import i18next from 'i18next';

/**
 * Groups events by date
 */
export function groupEventsByDate(events: CalendarEvent[]): GroupedEvents {
    const groupedEvents: GroupedEvents = {};

    events.forEach((event) => {
        let startDate;
        if (event.start.dateTime) {
            // Time-specific event
            startDate = new Date(event.start.dateTime).toLocaleDateString();
        } else if (event.start.date) {
            // All-day event
            startDate = new Date(event.start.date).toLocaleDateString();
        } else {
            // Fallback if neither is available
            startDate = new Date().toLocaleDateString();
        }

        if (!groupedEvents[startDate]) {
            groupedEvents[startDate] = [];
        }

        groupedEvents[startDate].push(event);
    });

    return groupedEvents;
}

/**
 * Formats event time for display
 */
export function formatEventTime(event: CalendarEvent): string {
    // All-day event
    if (event.start.date) {
        return i18next.t('calendar.dates.allDay');
    }

    // Time-specific event
    const startDate = new Date(event.start.dateTime);
    const endDate = new Date(event.end.dateTime);

    // Use the current language for time formatting
    const startTime = startDate.toLocaleTimeString(i18next.language, {
        hour: '2-digit',
        minute: '2-digit',
    });
    const endTime = endDate.toLocaleTimeString(i18next.language, {
        hour: '2-digit',
        minute: '2-digit',
    });

    return `${startTime} - ${endTime}`;
}

/**
 * Formats date for display
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset hours to compare just the dates
    const dateWithoutTime = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowWithoutTime = new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate(),
    );

    if (dateWithoutTime.getTime() === todayWithoutTime.getTime()) {
        return i18next.t('calendar.dates.today');
    } else if (dateWithoutTime.getTime() === tomorrowWithoutTime.getTime()) {
        return i18next.t('calendar.dates.tomorrow');
    } else {
        // Format: Monday, Aug 12
        const formattedDate = date.toLocaleDateString(i18next.language, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
        });
        return formattedDate;
    }
}

/**
 * Determines if date is today
 */
export function isToday(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();

    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
}
