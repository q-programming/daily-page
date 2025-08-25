package pl.qprogramming.daily.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.servlet.ServletContextInitializer;
import org.springframework.context.annotation.Configuration;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.SessionCookieConfig;

@Configuration
@Slf4j
public class SessionCookieConfigInitializer implements ServletContextInitializer {

    private static final int MAX_AGE_SECONDS = 14 * 24 * 60 * 60; // 14 days

    @Override
    public void onStartup(ServletContext servletContext) throws ServletException {
        SessionCookieConfig scc = servletContext.getSessionCookieConfig();
        scc.setName("JSESSIONID");
        scc.setHttpOnly(true);
        scc.setSecure(true);
        scc.setMaxAge(MAX_AGE_SECONDS);
        String path = servletContext.getContextPath();
        scc.setPath((path == null || path.isEmpty()) ? "/" : path);
        try {
            servletContext.getClass()
                    .getMethod("setSessionTimeout", int.class)
                    .invoke(servletContext, MAX_AGE_SECONDS / 60);
        } catch (NoSuchMethodException ignored) {
            log.debug("SessionCookieConfigInitializer setSessionTimeout method not found , presume older Servlet version");
            // Running on Servlet 3.1 (Tomcat 8.5); configure timeout in web.xml or container
        } catch (Exception e) {
            throw new ServletException("Failed to set session timeout", e);
        }
    }
}
