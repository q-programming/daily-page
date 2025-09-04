package pl.qprogramming.daily.service.weather.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import pl.qprogramming.daily.dto.GeocodingResult;
import pl.qprogramming.daily.service.weather.model.GeocodingResponse;
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface GeoCodingMapper {
    @Mapping(source = "name", target = "name")
    @Mapping(source = "latitude", target = "latitude")
    @Mapping(source = "longitude", target = "longitude")
    @Mapping(source = "country", target = "country")
    @Mapping(source = "timezone", target = "timezone")
    GeocodingResult toGeocodingResponse(GeocodingResponse.GeocodingResult response);
}
