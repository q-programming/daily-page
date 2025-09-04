package pl.qprogramming.daily;

import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

/**
 * ServletInitializer is required when deploying a Spring Boot application as a WAR file to an external Tomcat server.
 * It configures the application to run properly within Tomcat's servlet container.
 */
public class ServletInitializer extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(DailyApplication.class);
    }
}
