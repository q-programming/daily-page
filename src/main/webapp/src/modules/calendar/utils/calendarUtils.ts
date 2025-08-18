import type { GroupedEvents } from '../types/types';
import i18next from 'i18next';
import type { CalendarEvent } from '@api';

/**
 * Groups events by date
 */
export function groupEventsByDate(events: CalendarEvent[]): GroupedEvents {
    const groupedEvents: GroupedEvents = {};
    const today = new Date();
    // Set today to beginning of day for comparison
    today.setHours(0, 0, 0, 0);

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
            // For multi-day events, adjust startDate to be today if it's in the past
            let adjustedStartDate = new Date(startDate);
            if (adjustedStartDate < today) {
                adjustedStartDate = new Date(today);
            }
            const loopEndDate = endDate && endDate > adjustedStartDate ? endDate : adjustedStartDate;
            // Only process if the end date is today or in the future
            if (loopEndDate >= today) {
                for (let date = new Date(adjustedStartDate); date <= loopEndDate; date.setDate(date.getDate() + 1)) {
                    // Use a consistent ISO format for dateKey instead of locale-dependent format
                    const dateKey = formatDateToKey(date);
                    if (!groupedEvents[dateKey]) {
                        groupedEvents[dateKey] = [];
                    }
                    groupedEvents[dateKey].push(event);
                }
            }
        }
    });
    return groupedEvents;
}

/**
 * Formats a date to a consistent key format (YYYY-MM-DD)
 * This ensures that date keys are not affected by locale settings
 */
const formatDateToKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Formats event time for display
 */
export const formatEventTime = (event: CalendarEvent, dateKey: string): string => {
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
};

/**
 * Formats date for display
 */
export const formatDate = (dateString: string): string => {
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
};

/**
 * Determines if date is today
 */
export const isToday = (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();

    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};
