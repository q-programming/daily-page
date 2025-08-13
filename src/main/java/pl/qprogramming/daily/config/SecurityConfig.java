package pl.qprogramming.daily.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.Http403ForbiddenEntryPoint;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(authorize -> authorize
                        // Allow static resources and public endpoints
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/static/**",
                                "/assets/**",
                                "/*.js",
                                "/*.css",
                                "/*.json",
                                "/*.ico",
                                "/*.png",
                                "/favicon.svg",
                                "/manifest.json",
                                "/error"
                        ).permitAll()
                        // Explicitly permit all weather endpoints - with different path patterns
                        .requestMatchers("/api/weather/**", "/weather/**").permitAll()
                        // Auth endpoints - some public, some protected
                        .requestMatchers("/api/auth/login", "/api/auth/user", "/auth/login", "/auth/user").permitAll()
                        .requestMatchers("/api/auth/token", "/auth/token").authenticated()
                        // Protected calendar endpoints
                        .requestMatchers("/api/calendar/**", "/calendar/**").authenticated()
                        // All other requests need authentication
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/api/auth/login")
                        .defaultSuccessUrl("/", true)
                        .failureUrl("/api/auth/login?error=true")
                )
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .logoutSuccessUrl("/")
                        .clearAuthentication(true)
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                )
                .exceptionHandling(exceptionHandling ->
                        exceptionHandling.authenticationEntryPoint(new Http403ForbiddenEntryPoint())
                )
                .csrf(AbstractHttpConfigurer::disable);

        return http.build();
    }
}
