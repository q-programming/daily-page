package pl.qprogramming.daily.api;

import com.google.api.services.calendar.model.CalendarListEntry;
import com.google.api.services.calendar.model.Event;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Service;
import pl.qprogramming.daily.dto.Calendar;
import pl.qprogramming.daily.dto.CalendarEvent;
import pl.qprogramming.daily.service.calendar.CalendarEventComparator;
import pl.qprogramming.daily.service.calendar.CalendarMapper;
import pl.qprogramming.daily.service.calendar.CalendarService;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class CalendarApiDelegateImpl implements CalendarApiDelegate {

    private final CalendarService calendarService;
    private final CalendarMapper calendarMapper;
    private final OAuth2AuthorizedClientService clientService;

    @Override
    public ResponseEntity<List<Calendar>> getCalendarList() {
        OAuth2AuthorizedClient authorizedClient = getAuthorizedClient();
        if (authorizedClient == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            String accessToken = authorizedClient.getAccessToken().getTokenValue();
            Instant expiresAt = authorizedClient.getAccessToken().getExpiresAt();
            String refreshToken = authorizedClient.getRefreshToken() != null ?
                    authorizedClient.getRefreshToken().getTokenValue() : null;
            log.debug("Calling calendar list with access token: {}, expires at: {}, refresh token present: {}",
                    accessToken, expiresAt, refreshToken != null);
            List<CalendarListEntry> googleCalendars = calendarService.getCalendarList(accessToken, expiresAt, refreshToken);
            List<Calendar> calendars = googleCalendars.stream()
                    .map(calendarMapper::toDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(calendars);
        } catch (GeneralSecurityException | IOException e) {
            log.error("Error fetching calendar list", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @Override
    public ResponseEntity<List<CalendarEvent>> getCalendarEvents(String calendarId, Integer days) {
        return getCalendarEventsInternal(calendarId != null ? List.of(calendarId) : List.of("primary"), days);
    }

    @Override
    public ResponseEntity<List<CalendarEvent>> getAllCalendarEvents(List<String> calendarIds, Integer days) {
        return getCalendarEventsInternal(calendarIds, days);
    }

    private ResponseEntity<List<CalendarEvent>> getCalendarEventsInternal(List<String> calendarIds, Integer days) {
        OAuth2AuthorizedClient authorizedClient = getAuthorizedClient();
        if (authorizedClient == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            String accessToken = authorizedClient.getAccessToken().getTokenValue();
            Instant expiresAt = authorizedClient.getAccessToken().getExpiresAt();
            String refreshToken = authorizedClient.getRefreshToken() != null ?
                    authorizedClient.getRefreshToken().getTokenValue() : null;
            log.debug("Calling calendar events  with access token: {}, expires at: {}, refresh token present: {}",
                    accessToken, expiresAt, refreshToken != null);
            // Use default values if not provided
            val calendarsToFetch = calendarIds != null && !calendarIds.isEmpty() ?
                    calendarIds : List.of("primary");
            val daysCount = days != null ? days : 7;
            val allEvents = new ArrayList<CalendarEvent>();
            // Fetch events from each calendar
            for (String calId : calendarsToFetch) {
                val googleEvents = calendarService.getCalendarEvents(
                        accessToken, expiresAt, refreshToken, calId, daysCount);
                allEvents.addAll(googleEvents);
            }
            // Sort all events by start time using a proper Comparator
            allEvents.sort(new CalendarEventComparator());
            return ResponseEntity.ok(allEvents);
        } catch (GeneralSecurityException | IOException e) {
            log.error("Error fetching calendar events", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    private OAuth2AuthorizedClient getAuthorizedClient() {
        if (!(SecurityContextHolder.getContext().getAuthentication() instanceof OAuth2AuthenticationToken)) {
            return null;
        }
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        return clientService.loadAuthorizedClient(
                oauthToken.getAuthorizedClientRegistrationId(),
                oauthToken.getName()
        );
    }
}
