package pl.qprogramming.daily.service.calendar;

import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.model.CalendarListEntry;
import com.google.api.services.calendar.model.Event;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import pl.qprogramming.daily.dto.Calendar;
import pl.qprogramming.daily.dto.CalendarEvent;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * MapStruct mapper for converting Google Calendar API objects to DTO objects
 */
@Mapper(componentModel = "spring")
public interface CalendarMapper {

    Calendar toDto(CalendarListEntry entry);

    @Mapping(target = "start.dateTime", source = "start.dateTime", qualifiedByName = "dateTimeToOffsetDateTime")
    @Mapping(target = "end.dateTime", source = "end.dateTime", qualifiedByName = "dateTimeToOffsetDateTime")
    CalendarEvent toDto(Event event);

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
        return OffsetDateTime.ofInstant(
                Instant.ofEpochMilli(dateTime.getValue()),
                ZoneOffset.UTC);
    }
}
