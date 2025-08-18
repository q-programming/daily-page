package pl.qprogramming.daily.service.calendar;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.CalendarListEntry;
import com.google.api.services.calendar.model.Event;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import static pl.qprogramming.daily.config.CacheConfig.CacheNames;

/**
 * Service for interacting with Google Calendar API.
 * <p>
 * This service provides methods to access Google Calendar data using OAuth2 authentication.
 * It supports retrieving calendar lists and calendar events for authenticated users.
 * Results are cached for 5 minutes to reduce API calls and improve performance.
 * </p>
 */
@Slf4j
@Service
public class CalendarService {

    @Value("${spring.application.name}")
    private String applicationName;

    /**
     * Creates a Google Calendar client with the provided access token.
     * <p>
     * This method initializes a Google Calendar API client with the necessary authentication
     * and configuration to make API requests on behalf of the user.
     * </p>
     *
     * @param accessToken OAuth2 access token for Google Calendar API
     * @return Configured Calendar service instance
     * @throws GeneralSecurityException If there's a security-related error when creating the transport
     * @throws IOException If there's an I/O error during client creation
     */
    private Calendar createCalendarClient(String accessToken) throws GeneralSecurityException, IOException {
        // Create GoogleCredentials from the access token
        val credentials = GoogleCredentials.create(new AccessToken(accessToken, null));
        val requestInitializer = new HttpCredentialsAdapter(credentials);
        return new Calendar.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                requestInitializer)
                .setApplicationName(applicationName)
                .build();
    }

    /**
     * Retrieves the list of calendars available to the authenticated user.
     * <p>
     * This method returns all calendar entries that the user has access to, including
     * primary calendar, secondary calendars, and shared calendars.
     * Results are cached for 5 minutes to reduce API calls.
     * </p>
     *
     * @param accessToken OAuth2 access token for Google Calendar API
     * @return List of calendar entries accessible to the user
     * @throws GeneralSecurityException If there's a security-related error
     * @throws IOException If there's an I/O error during the API call
     */
    @Cacheable(value = CacheNames.CALENDAR_LIST, key = "#accessToken", cacheManager = "calendarCacheManager")
    public List<CalendarListEntry> getCalendarList(String accessToken) throws GeneralSecurityException, IOException {
        log.debug("Fetching calendar list for access token: {}", accessToken);
        val calendarClient = createCalendarClient(accessToken);
        val calendarList = calendarClient.calendarList().list().execute();
        return calendarList.getItems();
    }

    /**
     * Retrieves calendar events for a specific calendar within a given time range.
     * <p>
     * This method fetches all events from the specified calendar that fall within
     * the time range from now until the specified number of days in the future.
     * Events are ordered by start time and returned as a list. Pagination is handled
     * automatically to ensure all matching events are retrieved.
     * Results are cached for 5 minutes to reduce API calls.
     * </p>
     *
     * @param accessToken OAuth2 access token for Google Calendar API
     * @param calendarId ID of the calendar to retrieve events from
     * @param days Number of days ahead to fetch events for
     * @return List of calendar events within the specified time range
     * @throws GeneralSecurityException If there's a security-related error
     * @throws IOException If there's an I/O error during the API call
     */
    @Cacheable(value = CacheNames.CALENDAR_EVENTS, key = "#accessToken + '-' + #calendarId + '-' + #days", cacheManager = "calendarCacheManager")
    public List<Event> getCalendarEvents(String accessToken, String calendarId, int days) throws GeneralSecurityException, IOException {
        log.debug("Fetching calendar events for access token: {}, calendarId: {}, days: {}", accessToken, calendarId, days);
        Calendar service = createCalendarClient(accessToken);
        val now = LocalDateTime.now();
        val endDate = now.plusDays(days);
        val startDateTime = new DateTime(Date.from(now.atZone(ZoneId.systemDefault()).toInstant()));
        val endDateTime = new DateTime(Date.from(endDate.atZone(ZoneId.systemDefault()).toInstant()));

        val allEvents = new ArrayList<Event>();
        String pageToken = null;

        do {
            val events = service.events().list(calendarId)
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
