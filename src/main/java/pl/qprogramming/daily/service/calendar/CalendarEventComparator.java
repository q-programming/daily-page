package pl.qprogramming.daily.service.calendar;

import pl.qprogramming.daily.dto.CalendarEvent;
import pl.qprogramming.daily.dto.CalendarEventStart;

import java.util.Comparator;

public class CalendarEventComparator implements Comparator<CalendarEvent> {
    @Override
    public int compare(CalendarEvent e1, CalendarEvent e2) {
        CalendarEventStart s1 = e1.getStart();
        CalendarEventStart s2 = e2.getStart();

        // Prefer dateTime if present, else date
        if (s1.getDateTime() != null && s2.getDateTime() != null) {
            return s1.getDateTime().compareTo(s2.getDateTime());
        } else if (s1.getDateTime() != null) {
            return -1;
        } else if (s2.getDateTime() != null) {
            return 1;
        } else if (s1.getDate() != null && s2.getDate() != null) {
            return s1.getDate().compareTo(s2.getDate());
        } else if (s1.getDate() != null) {
            return -1;
        } else if (s2.getDate() != null) {
            return 1;
        }
        return 0;
    }
}
