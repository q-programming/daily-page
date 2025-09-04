package pl.qprogramming.daily.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controller to handle forwarding to index.html for SPA support.
 * This ensures that direct URLs and refreshes work properly with the single-page application
 * when deployed as a WAR file to an external Tomcat server.
 */
@Controller
public class WebController {

    /**
     * Forward root path and all non-API paths to the index.html page.
     * This approach supports a single-page application with no complex routing.
     *
     * @return The index.html page
     */
    @RequestMapping(value = {"/"})
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
