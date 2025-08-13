package pl.qprogramming.daily.service.calendar;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.CalendarList;
import com.google.api.services.calendar.model.CalendarListEntry;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.Events;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class CalendarService {

    private Calendar createCalendarClient(String accessToken) throws GeneralSecurityException, IOException {
        GoogleCredential credential = new GoogleCredential().setAccessToken(accessToken);

        return new Calendar.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                credential)
                .setApplicationName("Daily App")
                .build();
    }

    public List<CalendarListEntry> getCalendarList(String accessToken) throws GeneralSecurityException, IOException {
        Calendar service = createCalendarClient(accessToken);
        CalendarList calendarList = service.calendarList().list().execute();
        return calendarList.getItems();
    }

    public List<Event> getCalendarEvents(String accessToken, String calendarId, int days) throws GeneralSecurityException, IOException {
        Calendar service = createCalendarClient(accessToken);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endDate = now.plusDays(days);

        DateTime startDateTime = new DateTime(Date.from(now.atZone(ZoneId.systemDefault()).toInstant()));
        DateTime endDateTime = new DateTime(Date.from(endDate.atZone(ZoneId.systemDefault()).toInstant()));

        List<Event> allEvents = new ArrayList<>();
        String pageToken = null;

        do {
            Events events = service.events().list(calendarId)
                    .setTimeMin(startDateTime)
                    .setTimeMax(endDateTime)
                    .setOrderBy("startTime")
                    .setSingleEvents(true)
                    .setPageToken(pageToken)
                    .execute();

            allEvents.addAll(events.getItems());
            pageToken = events.getNextPageToken();
        } while (pageToken != null);

        return allEvents;
    }
}
