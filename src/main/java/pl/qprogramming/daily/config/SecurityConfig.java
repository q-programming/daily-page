package pl.qprogramming.daily.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.web.authentication.Http403ForbiddenEntryPoint;
import pl.qprogramming.daily.service.AuthorizedClientsService;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Consumer;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private final AuthorizedClientsService authorizedClientsService;
    private final ClientRegistrationRepository clientRegistrationRepository;

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
                .authorizeRequests()
                        // Allow static resources and public endpoints
                        .antMatchers(
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
                        .antMatchers("/api/weather/**", "/weather/**").permitAll()
                        // Auth endpoints - some public, some protected
                        .antMatchers("/api/auth/login", "/api/auth/user", "/auth/login", "/auth/user").permitAll()
                        .antMatchers("/api/auth/token", "/auth/token").authenticated()
                        // Protected calendar endpoints
                        .antMatchers("/api/calendar/**", "/calendar/**").authenticated()
                        // All other requests need authentication
                        .anyRequest().authenticated()
                .and()
                .oauth2Login()
                        .loginPage("/api/auth/login")
                        .defaultSuccessUrl("/", true)
                        .failureUrl("/api/auth/login?error=true")
                        .authorizedClientService(authorizedClientsService)
                        .authorizationEndpoint()
                                .authorizationRequestResolver(
                                        authorizationRequestResolver(clientRegistrationRepository)
                                )
                .and()
                .and()
                .logout()
                        .logoutUrl("/api/auth/logout")
                        .logoutSuccessUrl("/")
                        .clearAuthentication(true)
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                .and()
                .exceptionHandling()
                        .authenticationEntryPoint(new Http403ForbiddenEntryPoint())
                .and()
                .csrf().disable();
    }

    /**
     * Custom OAuth2AuthorizationRequestResolver to add additional parameters
     * to the authorization request, such as access_type and prompt.
     * This is necessary to ensure that the refresh token is always provided
     *
     * @param clientRegistrationRepository client registration repository
     * @return OAuth2AuthorizationRequestResolver
     */
    private OAuth2AuthorizationRequestResolver authorizationRequestResolver(
            ClientRegistrationRepository clientRegistrationRepository) {
        DefaultOAuth2AuthorizationRequestResolver authorizationRequestResolver =
                new DefaultOAuth2AuthorizationRequestResolver(
                        clientRegistrationRepository, "/oauth2/authorization");
        authorizationRequestResolver.setAuthorizationRequestCustomizer(
                authorizationRequestCustomizer());
        return authorizationRequestResolver;
    }

    /**
     * Customizer for OAuth2AuthorizationRequest to add additional parameters
     *
     * @return Consumer<OAuth2AuthorizationRequest.Builder>
     */
    private Consumer<OAuth2AuthorizationRequest.Builder> authorizationRequestCustomizer() {
        return customizer -> {
            Map<String, Object> additionalParams = new HashMap<>();
            additionalParams.put("access_type", "offline");
            // Force approval prompt to ensure refresh token is always provided
            additionalParams.put("prompt", "consent");
            customizer.additionalParameters(params -> params.putAll(additionalParams));
        };
    }
}
