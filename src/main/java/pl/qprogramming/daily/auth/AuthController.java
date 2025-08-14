package pl.qprogramming.daily.auth;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Slf4j
@Controller
public class AuthController {

    @GetMapping("/api/auth/login")
    public String login() {
        log.info("Redirecting to OAuth2 login page");
        return "redirect:/oauth2/authorization/google";
    }
}
