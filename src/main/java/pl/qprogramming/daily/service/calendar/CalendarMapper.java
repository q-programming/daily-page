package pl.qprogramming.daily.service.calendar;

import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.model.CalendarListEntry;
import com.google.api.services.calendar.model.Event;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import pl.qprogramming.daily.dto.Calendar;
import pl.qprogramming.daily.dto.CalendarEvent;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * MapStruct mapper for converting Google Calendar API objects to DTO objects
 */
@Mapper(componentModel = "spring")
public interface CalendarMapper {

    @Mapping(target = "color", source = "backgroundColor")
    Calendar toDto(CalendarListEntry entry);

    @Mapping(target = "start.dateTime", source = "start.dateTime", qualifiedByName = "dateTimeToOffsetDateTime")
    @Mapping(target = "end.dateTime", source = "end.dateTime", qualifiedByName = "dateTimeToOffsetDateTime")
    @Mapping(target = "start.date", source = "start.date", qualifiedByName = "dateTimeToLocalDate")
    @Mapping(target = "end.date", source = "end.date", qualifiedByName = "dateTimeToLocalDate")
    CalendarEvent toDto(Event event);

    @Mapping(target = "start.dateTime", source = "event.start.dateTime", qualifiedByName = "dateTimeToOffsetDateTime")
    @Mapping(target = "end.dateTime", source = "event.end.dateTime", qualifiedByName = "dateTimeToOffsetDateTime")
    @Mapping(target = "start.date", source = "event.start.date", qualifiedByName = "dateTimeToLocalDate")
    @Mapping(target = "end.date", source = "event.end.date", qualifiedByName = "dateTimeToLocalDate")
    @Mapping(target = "calendarId", source = "calendarId")
    CalendarEvent toDto(Event event, String calendarId);

    /**
     * Maps Google Calendar DateTime to Java OffsetDateTime
     *
     * @param dateTime Google Calendar DateTime
     * @return OffsetDateTime representation of the date
     */
    @Named("dateTimeToOffsetDateTime")
    default OffsetDateTime dateTimeToOffsetDateTime(DateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return OffsetDateTime.parse(dateTime.toStringRfc3339());
    }

    /**
     * Maps Google Calendar DateTime to Java LocalDate for all-day events.
     *
     * @param dateTime Google Calendar DateTime (expected to be a date-only value)
     * @return LocalDate representation of the date
     */
    @Named("dateTimeToLocalDate")
    default LocalDate dateTimeToLocalDate(DateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        // For date-only values, Google's DateTime toStringRfc3339() returns YYYY-MM-DD.
        return LocalDate.parse(dateTime.toStringRfc3339().substring(0, 10));
    }
}
