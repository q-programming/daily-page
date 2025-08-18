package pl.qprogramming.daily.logging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

/**
 * Endpoint logger utility that logs all registered REST endpoints when the application starts.
 * <p>
 * This component hooks into Spring Boot's application lifecycle by implementing
 * {@link ApplicationListener<ApplicationReadyEvent>}. When the application is fully started
 * and ready to serve requests, it logs all available endpoint mappings at DEBUG level.
 * </p>
 * <p>
 * The log entries show the request mapping pattern and the corresponding controller method
 * that handles the request.
 * </p>*
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EndpointLogger implements ApplicationListener<ApplicationReadyEvent> {

    private final RequestMappingHandlerMapping handlerMapping;

    /**
     * Executes when the application is fully started and ready to serve requests.
     * <p>
     * This method retrieves all registered endpoint mappings from the Spring MVC handler
     * and logs them at DEBUG level, showing both the request mapping pattern and the
     * controller method name that handles each endpoint.
     * </p>
     *
     * @param event The application ready event fired by Spring Boot
     */
    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        handlerMapping.getHandlerMethods().forEach((mapping, method) -> {
            log.debug("Endpoint: {} -> {}", mapping, method.getMethod().getName());
        });
    }
}
