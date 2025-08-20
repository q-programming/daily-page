package pl.qprogramming.daily.service.calendar;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pl.qprogramming.daily.dto.CalendarEvent;
import pl.qprogramming.daily.dto.CalendarEventStart;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CalendarEventComparatorTest {

    private CalendarEventComparator comparator;
    private CalendarEvent event1;
    private CalendarEvent event2;
    private CalendarEventStart start1;
    private CalendarEventStart start2;

    @BeforeEach
    void setUp() {
        comparator = new CalendarEventComparator();
        event1 = mock(CalendarEvent.class);
        event2 = mock(CalendarEvent.class);
        start1 = mock(CalendarEventStart.class);
        start2 = mock(CalendarEventStart.class);

        when(event1.getStart()).thenReturn(start1);
        when(event2.getStart()).thenReturn(start2);
    }

    @Test
    void compareBothHaveDateTime() {
        // Given two events with dateTime
        OffsetDateTime time1 = OffsetDateTime.parse("2023-08-20T10:00:00Z");
        OffsetDateTime time2 = OffsetDateTime.parse("2023-08-20T11:00:00Z");
        when(start1.getDateTime()).thenReturn(time1);
        when(start2.getDateTime()).thenReturn(time2);

        // Then event1 should come before event2
        assertTrue(comparator.compare(event1, event2) < 0);
        assertTrue(comparator.compare(event2, event1) > 0);
    }

    @Test
    void compareBothHaveSameDateTime() {
        // Given two events with the same dateTime
        OffsetDateTime sameTime = OffsetDateTime.parse("2023-08-20T10:00:00Z");
        when(start1.getDateTime()).thenReturn(sameTime);
        when(start2.getDateTime()).thenReturn(sameTime);

        // Then they should be considered equal
        assertEquals(0, comparator.compare(event1, event2));
    }

    @Test
    void compareOnlyFirstHasDateTime() {
        // Given only first event has dateTime
        OffsetDateTime time1 = OffsetDateTime.parse("2023-08-20T10:00:00Z");
        when(start1.getDateTime()).thenReturn(time1);
        when(start2.getDateTime()).thenReturn(null);

        // Then event1 should come before event2
        assertTrue(comparator.compare(event1, event2) < 0);
        assertTrue(comparator.compare(event2, event1) > 0);
    }

    @Test
    void compareOnlySecondHasDateTime() {
        // Given only second event has dateTime
        OffsetDateTime time2 = OffsetDateTime.parse("2023-08-20T10:00:00Z");
        when(start1.getDateTime()).thenReturn(null);
        when(start2.getDateTime()).thenReturn(time2);

        // Then event2 should come before event1
        assertTrue(comparator.compare(event1, event2) > 0);
        assertTrue(comparator.compare(event2, event1) < 0);
    }

    @Test
    void compareBothHaveDate() {
        // Given two events with only date (no dateTime)
        LocalDate date1 = LocalDate.parse("2023-08-20");
        LocalDate date2 = LocalDate.parse("2023-08-21");
        when(start1.getDateTime()).thenReturn(null);
        when(start2.getDateTime()).thenReturn(null);
        when(start1.getDate()).thenReturn(date1);
        when(start2.getDate()).thenReturn(date2);

        // Then event1 should come before event2
        assertTrue(comparator.compare(event1, event2) < 0);
        assertTrue(comparator.compare(event2, event1) > 0);
    }

    @Test
    void compareBothHaveSameDate() {
        // Given two events with the same date (no dateTime)
        LocalDate sameDate = LocalDate.parse("2023-08-20");
        when(start1.getDateTime()).thenReturn(null);
        when(start2.getDateTime()).thenReturn(null);
        when(start1.getDate()).thenReturn(sameDate);
        when(start2.getDate()).thenReturn(sameDate);

        // Then they should be considered equal
        assertEquals(0, comparator.compare(event1, event2));
    }

    @Test
    void compareOnlyFirstHasDate() {
        // Given only first event has date (no dateTime on either)
        LocalDate date1 = LocalDate.parse("2023-08-20");
        when(start1.getDateTime()).thenReturn(null);
        when(start2.getDateTime()).thenReturn(null);
        when(start1.getDate()).thenReturn(date1);
        when(start2.getDate()).thenReturn(null);

        // Then event1 should come before event2
        assertTrue(comparator.compare(event1, event2) < 0);
        assertTrue(comparator.compare(event2, event1) > 0);
    }

    @Test
    void compareOnlySecondHasDate() {
        // Given only second event has date (no dateTime on either)
        LocalDate date2 = LocalDate.parse("2023-08-20");
        when(start1.getDateTime()).thenReturn(null);
        when(start2.getDateTime()).thenReturn(null);
        when(start1.getDate()).thenReturn(null);
        when(start2.getDate()).thenReturn(date2);

        // Then event2 should come before event1
        assertTrue(comparator.compare(event1, event2) > 0);
        assertTrue(comparator.compare(event2, event1) < 0);
    }

    @Test
    void compareBothHaveNeitherDateTimeNorDate() {
        // Given both events have neither dateTime nor date
        when(start1.getDateTime()).thenReturn(null);
        when(start2.getDateTime()).thenReturn(null);
        when(start1.getDate()).thenReturn(null);
        when(start2.getDate()).thenReturn(null);

        // Then they should be considered equal
        assertEquals(0, comparator.compare(event1, event2));
    }

    @Test
    void testSortingWithMixedDateTypes() {
        // Create a list with mixed event types
        List<CalendarEvent> events = new ArrayList<>();

        // Event with dateTime - earliest
        CalendarEvent eventWithDateTime1 = mock(CalendarEvent.class);
        CalendarEventStart startWithDateTime1 = mock(CalendarEventStart.class);
        when(eventWithDateTime1.getStart()).thenReturn(startWithDateTime1);
        when(startWithDateTime1.getDateTime()).thenReturn(OffsetDateTime.parse("2023-08-20T09:00:00Z"));

        // Event with dateTime - later
        CalendarEvent eventWithDateTime2 = mock(CalendarEvent.class);
        CalendarEventStart startWithDateTime2 = mock(CalendarEventStart.class);
        when(eventWithDateTime2.getStart()).thenReturn(startWithDateTime2);
        when(startWithDateTime2.getDateTime()).thenReturn(OffsetDateTime.parse("2023-08-20T10:00:00Z"));

        // Event with only date - should come after dateTime events
        CalendarEvent eventWithDate = mock(CalendarEvent.class);
        CalendarEventStart startWithDate = mock(CalendarEventStart.class);
        when(eventWithDate.getStart()).thenReturn(startWithDate);
        when(startWithDate.getDateTime()).thenReturn(null);
        when(startWithDate.getDate()).thenReturn(LocalDate.parse("2023-08-20"));

        // Event with neither - should come last
        CalendarEvent eventWithNeither = mock(CalendarEvent.class);
        CalendarEventStart startWithNeither = mock(CalendarEventStart.class);
        when(eventWithNeither.getStart()).thenReturn(startWithNeither);
        when(startWithNeither.getDateTime()).thenReturn(null);
        when(startWithNeither.getDate()).thenReturn(null);

        // Add events in random order
        events.add(eventWithNeither);
        events.add(eventWithDateTime2);
        events.add(eventWithDate);
        events.add(eventWithDateTime1);

        // Sort the list
        events.sort(comparator);

        // Verify order
        assertSame(eventWithDateTime1, events.get(0)); // Earliest dateTime
        assertSame(eventWithDateTime2, events.get(1)); // Later dateTime
        assertSame(eventWithDate, events.get(2));      // Date only
        assertSame(eventWithNeither, events.get(3));   // Neither
    }
}
