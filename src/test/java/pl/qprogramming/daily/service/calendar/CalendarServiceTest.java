package pl.qprogramming.daily.service.calendar;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.*;
import lombok.val;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CalendarServiceTest {

    private static final String TEST_ACCESS_TOKEN = "test-access-token";
    private static final String TEST_CALENDAR_ID = "primary";
    private static final int TEST_DAYS = 7;

    @InjectMocks
    private CalendarService calendarService;

    @Mock
    private Calendar calendarClient;

    @Mock
    private Calendar.CalendarList mockCalendarList;

    @Mock
    private Calendar.CalendarList.List mockCalendarListRequest;

    @Mock
    private Calendar.Events mockEvents;

    @Mock
    private Calendar.Events.List mockEventsList;

    @Spy
    private CalendarMapperImpl calendarMapper;

    private CalendarList testCalendarList;
    private Events testEvents;

    @BeforeEach
    void setUp() throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        // Create a properly constructed CalendarList
        testCalendarList = new CalendarList();
        val calendarListMap = objectMapper.readValue(
                new ClassPathResource("calendar/calendar_list.json").getInputStream(),
                Map.class);
        testCalendarList.setEtag((String) calendarListMap.get("etag"));
        testCalendarList.setKind((String) calendarListMap.get("kind"));
        testCalendarList.setNextSyncToken((String) calendarListMap.get("nextSyncToken"));
        // Convert the list items one by one to ensure proper typing
        List<Map<String, Object>> itemMaps = (List<Map<String, Object>>) calendarListMap.get("items");
        List<CalendarListEntry> entries = new ArrayList<>();
        for (Map<String, Object> item : itemMaps) {
            String json = objectMapper.writeValueAsString(item);
            CalendarListEntry entry = objectMapper.readValue(json, CalendarListEntry.class);
            entries.add(entry);
        }
        testCalendarList.setItems(entries);
        createTestEvents();
    }

    private void createTestEvents() {
        // For Events, let's use a completely manual approach
        testEvents = new Events();
        testEvents.setKind("calendar#events");
        testEvents.setSummary("Primary Calendar");
        testEvents.setTimeZone("Europe/Warsaw");
        testEvents.setAccessRole("owner");

        // Create Event objects manually
        List<Event> events = new ArrayList<>();

        // Event 1
        Event event1 = new Event();
        event1.setSummary("Team Meeting");
        event1.setDescription("Weekly team status update");
        event1.setLocation("Conference Room A");

        // Create creator for event1
        Event.Creator creator1 = new Event.Creator();
        creator1.setEmail("john.doe@example.com");
        creator1.setDisplayName("John Doe");
        event1.setCreator(creator1);

        // Create organizer for event1
        Event.Organizer organizer1 = new Event.Organizer();
        organizer1.setEmail("john.doe@example.com");
        organizer1.setDisplayName("John Doe");
        event1.setOrganizer(organizer1);

        // Create start time for event1
        EventDateTime start1 = new EventDateTime();
        start1.setDateTime(new DateTime("2025-08-19T10:00:00+02:00"));
        start1.setTimeZone("Europe/Warsaw");
        event1.setStart(start1);

        // Create end time for event1
        EventDateTime end1 = new EventDateTime();
        end1.setDateTime(new DateTime("2025-08-19T11:00:00+02:00"));
        end1.setTimeZone("Europe/Warsaw");
        event1.setEnd(end1);
        event1.setSequence(0);

        // Create reminders for event1
        Event.Reminders reminders1 = new Event.Reminders();
        reminders1.setUseDefault(true);
        event1.setReminders(reminders1);

        events.add(event1);

        // Event 2
        Event event2 = new Event();
        event2.setSummary("Lunch with Client");
        event2.setDescription("Discuss project requirements");
        event2.setLocation("Restaurant Downtown");

        // Create creator for event2
        Event.Creator creator2 = new Event.Creator();
        creator2.setEmail("john.doe@example.com");
        creator2.setDisplayName("John Doe");
        event2.setCreator(creator2);

        // Create organizer for event2
        Event.Organizer organizer2 = new Event.Organizer();
        organizer2.setEmail("john.doe@example.com");
        organizer2.setDisplayName("John Doe");
        event2.setOrganizer(organizer2);

        // Create start time for event2
        EventDateTime start2 = new EventDateTime();
        start2.setDateTime(new DateTime("2025-08-20T12:30:00+02:00"));
        start2.setTimeZone("Europe/Warsaw");
        event2.setStart(start2);

        // Create end time for event2
        EventDateTime end2 = new EventDateTime();
        end2.setDateTime(new DateTime("2025-08-20T14:00:00+02:00"));
        end2.setTimeZone("Europe/Warsaw");
        event2.setEnd(end2);

        event2.setTransparency("opaque");
        event2.setVisibility("private");
        event2.setICalUID("event2id@google.com");
        event2.setSequence(0);

        // Create reminders for event2
        Event.Reminders reminders2 = new Event.Reminders();
        reminders2.setUseDefault(true);
        event2.setReminders(reminders2);

        events.add(event2);

        testEvents.setItems(events);
    }

    @Test
    void getCalendarList_Success() throws GeneralSecurityException, IOException {
        // Create a spy of the service
        CalendarService serviceSpy = spy(calendarService);

        // Mock the createCalendarClient method which is now package-private
        doReturn(calendarClient).when(serviceSpy).createCalendarClient(TEST_ACCESS_TOKEN, null, null);

        // Setup calendar list mocks
        when(calendarClient.calendarList()).thenReturn(mockCalendarList);
        when(mockCalendarList.list()).thenReturn(mockCalendarListRequest);
        when(mockCalendarListRequest.execute()).thenReturn(testCalendarList);

        // Execute test
        List<CalendarListEntry> result = serviceSpy.getCalendarList(TEST_ACCESS_TOKEN, null, null);

        // Verify results
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Primary Calendar", result.get(0).getSummary());
        assertEquals("Polish Holidays", result.get(1).getSummary());

        // Verify interactions
        verify(serviceSpy).createCalendarClient(TEST_ACCESS_TOKEN, null, null);
        verify(calendarClient).calendarList();
        verify(mockCalendarList).list();
        verify(mockCalendarListRequest).execute();
    }

    @Test
    void getCalendarList_Exception() throws GeneralSecurityException, IOException {
        // Create a spy of the service
        CalendarService serviceSpy = spy(calendarService);

        // Mock the createCalendarClient method which is now package-private
        doReturn(calendarClient).when(serviceSpy).createCalendarClient(TEST_ACCESS_TOKEN, null, null);

        // Setup calendar list mocks to throw exception
        when(calendarClient.calendarList()).thenReturn(mockCalendarList);
        when(mockCalendarList.list()).thenReturn(mockCalendarListRequest);
        when(mockCalendarListRequest.execute()).thenThrow(new IOException("Test exception"));

        // Execute test and verify exception is thrown
        assertThrows(IOException.class, () -> serviceSpy.getCalendarList(TEST_ACCESS_TOKEN, null, null));

        // Verify interactions
        verify(serviceSpy).createCalendarClient(TEST_ACCESS_TOKEN, null, null);
        verify(calendarClient).calendarList();
        verify(mockCalendarList).list();
        verify(mockCalendarListRequest).execute();
    }

    @Test
    void getCalendarEvents_Success() throws GeneralSecurityException, IOException {
        // Create a spy of the service
        CalendarService serviceSpy = spy(calendarService);

        // Mock the createCalendarClient method which is now package-private
        doReturn(calendarClient).when(serviceSpy).createCalendarClient(TEST_ACCESS_TOKEN, null, null);

        // Setup events mocks
        when(calendarClient.events()).thenReturn(mockEvents);
        when(mockEvents.list(TEST_CALENDAR_ID)).thenReturn(mockEventsList);
        when(mockEventsList.setTimeMin(any())).thenReturn(mockEventsList);
        when(mockEventsList.setTimeMax(any())).thenReturn(mockEventsList);
        when(mockEventsList.setOrderBy(anyString())).thenReturn(mockEventsList);
        when(mockEventsList.setSingleEvents(anyBoolean())).thenReturn(mockEventsList);
        when(mockEventsList.setPageToken(any())).thenReturn(mockEventsList);
        when(mockEventsList.execute()).thenReturn(testEvents);

        // Execute test
        val result = serviceSpy.getCalendarEvents(TEST_ACCESS_TOKEN, null, null, TEST_CALENDAR_ID, TEST_DAYS);

        // Verify results
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Team Meeting", result.get(0).getSummary());
        assertEquals("Lunch with Client", result.get(1).getSummary());

        // Verify interactions
        verify(serviceSpy).createCalendarClient(TEST_ACCESS_TOKEN, null, null);
        verify(calendarClient).events();
        verify(mockEvents).list(TEST_CALENDAR_ID);
        verify(mockEventsList).setTimeMin(any());
        verify(mockEventsList).setTimeMax(any());
        verify(mockEventsList).setOrderBy("startTime");
        verify(mockEventsList).setSingleEvents(true);
        verify(mockEventsList).execute();
    }

    @Test
    void getCalendarEvents_Exception() throws GeneralSecurityException, IOException {
        // Create a spy of the service
        CalendarService serviceSpy = spy(calendarService);

        // Mock the createCalendarClient method which is now package-private
        doReturn(calendarClient).when(serviceSpy).createCalendarClient(TEST_ACCESS_TOKEN, null, null);

        // Setup events mocks to throw exception
        when(calendarClient.events()).thenReturn(mockEvents);
        when(mockEvents.list(TEST_CALENDAR_ID)).thenReturn(mockEventsList);
        when(mockEventsList.setTimeMin(any())).thenReturn(mockEventsList);
        when(mockEventsList.setTimeMax(any())).thenReturn(mockEventsList);
        when(mockEventsList.setOrderBy(anyString())).thenReturn(mockEventsList);
        when(mockEventsList.setSingleEvents(anyBoolean())).thenReturn(mockEventsList);
        when(mockEventsList.setPageToken(any())).thenReturn(mockEventsList);
        when(mockEventsList.execute()).thenThrow(new IOException("Test exception"));

        // Execute test and verify exception is thrown
        assertThrows(IOException.class, () -> serviceSpy.getCalendarEvents(TEST_ACCESS_TOKEN, null, null, TEST_CALENDAR_ID, TEST_DAYS));

        // Verify interactions
        verify(serviceSpy).createCalendarClient(TEST_ACCESS_TOKEN, null, null);
        verify(calendarClient).events();
        verify(mockEvents).list(TEST_CALENDAR_ID);
        verify(mockEventsList).setTimeMin(any());
        verify(mockEventsList).setTimeMax(any());
        verify(mockEventsList).setOrderBy("startTime");
        verify(mockEventsList).setSingleEvents(true);
        verify(mockEventsList).execute();
    }

    @Test
    void getCalendarEvents_WithPagination() throws GeneralSecurityException, IOException {
        // Create a spy of the service
        CalendarService serviceSpy = spy(calendarService);

        // Mock the createCalendarClient method which is now package-private
        doReturn(calendarClient).when(serviceSpy).createCalendarClient(TEST_ACCESS_TOKEN, null, null);

        // Create first page of events
        Events firstPageEvents = new Events();
        firstPageEvents.setItems(List.of(testEvents.getItems().get(0)));
        firstPageEvents.setNextPageToken("next-page-token");

        // Create second page of events
        Events secondPageEvents = new Events();
        secondPageEvents.setItems(List.of(testEvents.getItems().get(1)));
        secondPageEvents.setNextPageToken(null);

        // Setup events mocks for pagination
        when(calendarClient.events()).thenReturn(mockEvents);
        when(mockEvents.list(TEST_CALENDAR_ID)).thenReturn(mockEventsList);
        when(mockEventsList.setTimeMin(any())).thenReturn(mockEventsList);
        when(mockEventsList.setTimeMax(any())).thenReturn(mockEventsList);
        when(mockEventsList.setOrderBy(anyString())).thenReturn(mockEventsList);
        when(mockEventsList.setSingleEvents(anyBoolean())).thenReturn(mockEventsList);
        when(mockEventsList.setPageToken(null)).thenReturn(mockEventsList);
        when(mockEventsList.execute()).thenReturn(firstPageEvents, secondPageEvents);
        when(mockEventsList.setPageToken("next-page-token")).thenReturn(mockEventsList);

        // Execute test
       val result = serviceSpy.getCalendarEvents(TEST_ACCESS_TOKEN, null, null, TEST_CALENDAR_ID, TEST_DAYS);

        // Verify results
        assertNotNull(result);
        assertEquals(2, result.size());

        // Verify pagination interactions
        verify(serviceSpy).createCalendarClient(TEST_ACCESS_TOKEN, null, null);
        verify(mockEventsList).setPageToken(null);
        verify(mockEventsList).setPageToken("next-page-token");
        verify(mockEventsList, times(2)).execute();
    }

    @Test
    void createCalendarClient_CanBeCalledDirectly() {
        assertDoesNotThrow(() -> calendarService.createCalendarClient(TEST_ACCESS_TOKEN, null, null));
    }
}

