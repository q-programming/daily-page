package pl.qprogramming.daily.service.weather.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import pl.qprogramming.daily.dto.GeocodingResult;
import pl.qprogramming.daily.service.weather.model.GeocodingResponse;
import pl.qprogramming.daily.service.weather.model.accuweather.AccuWeatherLocation;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface GeoCodingMapper {
    @Mapping(source = "name", target = "name")
    @Mapping(source = "latitude", target = "latitude")
    @Mapping(source = "longitude", target = "longitude")
    @Mapping(source = "country", target = "country")
    @Mapping(source = "timezone", target = "timezone")
    GeocodingResult toGeocodingResponse(GeocodingResponse.GeocodingResult response);


    @Mapping(source = "key", target = "locationKey")
    @Mapping(source = "localizedName", target = "name")
    @Mapping(source = "country.localizedName", target = "country")
    @Mapping(source = "administrativeArea.localizedName", target = "state")
    @Mapping(source = "geoPosition.latitude", target = "latitude")
    @Mapping(source = "geoPosition.longitude", target = "longitude")
    GeocodingResult toGeocodingResponse(AccuWeatherLocation location);
}
