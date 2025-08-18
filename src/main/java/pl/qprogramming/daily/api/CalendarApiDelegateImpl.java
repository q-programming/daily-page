package pl.qprogramming.daily.api;

import com.google.api.services.calendar.model.CalendarListEntry;
import com.google.api.services.calendar.model.Event;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Service;
import pl.qprogramming.daily.service.calendar.CalendarMapper;
import pl.qprogramming.daily.service.calendar.CalendarService;
import pl.qprogramming.daily.dto.Calendar;
import pl.qprogramming.daily.dto.CalendarEvent;

import java.io.IOException;
import java.security.GeneralSecurityException;
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
            List<CalendarListEntry> googleCalendars = calendarService.getCalendarList(accessToken);
            List<Calendar> calendars = googleCalendars.stream()
                    .peek(entry -> {
                       log.debug("Calendar entry: {}", entry);
                    })
                    .map(calendarMapper::toDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(calendars);
        } catch (GeneralSecurityException | IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @Override
    public ResponseEntity<List<CalendarEvent>> getCalendarEvents(String calendarId, Integer days) {
        OAuth2AuthorizedClient authorizedClient = getAuthorizedClient();
        if (authorizedClient == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            String accessToken = authorizedClient.getAccessToken().getTokenValue();
            String calId = calendarId != null ? calendarId : "primary";
            int daysCount = days != null ? days : 7;

            List<Event> googleEvents = calendarService.getCalendarEvents(accessToken, calId, daysCount);
            List<CalendarEvent> events = googleEvents.stream()
                    .peek(event -> {
                        log.debug("Calendar event: {}", event);
                    })
                    .map(calendarMapper::toDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(events);
        } catch (GeneralSecurityException | IOException e) {
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
