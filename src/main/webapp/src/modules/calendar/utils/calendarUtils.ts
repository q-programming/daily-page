import type { GroupedEvents } from '../types/types';
import i18next from 'i18next';
import type { CalendarEvent } from '@api';

/**
 * Groups events by date
 */
export function groupEventsByDate(events: CalendarEvent[]): GroupedEvents {
    const groupedEvents: GroupedEvents = {};
    events.forEach((event) => {
        let startDate: Date | null = null;
        let endDate: Date | null = null;
        // Determine start date
        if (event.start?.date) {
            // All-day event: 'YYYY-MM-DD'
            const dateParts = event.start.date.split('-').map(Number);
            startDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        } else if (event.start?.dateTime) {
            // Timed event
            startDate = new Date(event.start.dateTime);
        }
        // Determine end date
        if (event.end?.date) {
            const dateParts = event.end.date.split('-').map(Number);
            // For all-day events, the end date is exclusive. We subtract one day to make it inclusive.
            endDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2] - 1);
        } else if (event.end?.dateTime) {
            endDate = new Date(event.end.dateTime);
        }
        if (startDate) {
            const loopEndDate = endDate && endDate > startDate ? endDate : startDate;
            for (let d = new Date(startDate); d <= loopEndDate; d.setDate(d.getDate() + 1)) {
                const dateKey = d.toLocaleDateString();
                if (!groupedEvents[dateKey]) {
                    groupedEvents[dateKey] = [];
                }
                groupedEvents[dateKey].push(event);
            }
        }
    });

    return groupedEvents;
}

/**
 * Formats event time for display
 */
export function formatEventTime(event: CalendarEvent, dateKey: string): string {
    const displayDate = new Date(dateKey);
    displayDate.setHours(0, 0, 0, 0);

    // All-day event (no specific time)
    if (!event.start?.dateTime || !event.end?.dateTime) {
        return i18next.t('calendar.dates.allDay');
    }

    const startDate = new Date(event.start.dateTime);
    const endDate = new Date(event.end.dateTime);

    const eventStartDate = new Date(startDate);
    eventStartDate.setHours(0, 0, 0, 0);

    const eventEndDate = new Date(endDate);
    eventEndDate.setHours(0, 0, 0, 0);

    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
    };
    const startTime = startDate.toLocaleTimeString(i18next.language, timeOptions);
    const endTime = endDate.toLocaleTimeString(i18next.language, timeOptions);

    const isStartOnDisplayDate = eventStartDate.getTime() === displayDate.getTime();
    const isEndOnDisplayDate = eventEndDate.getTime() === displayDate.getTime();

    if (isStartOnDisplayDate && isEndOnDisplayDate) {
        // Event starts and ends on the same day
        return `${startTime} - ${endTime}`;
    } else if (isStartOnDisplayDate) {
        // Event starts on this day and ends on another
        return `${startTime} -> `;
    } else if (isEndOnDisplayDate) {
        // Event ends on this day
        return `-> ${endTime}`;
    } else {
        // Event spans the whole day (started before, ends after)
        return i18next.t('calendar.dates.allDay');
    }
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

        return date.toLocaleDateString(i18next.language, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
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
