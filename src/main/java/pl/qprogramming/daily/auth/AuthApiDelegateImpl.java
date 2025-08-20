package pl.qprogramming.daily.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import pl.qprogramming.daily.api.AuthApiDelegate;
import pl.qprogramming.daily.dto.UserInfo;
import pl.qprogramming.daily.service.AuthorizedClientsService;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import java.util.Enumeration;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthApiDelegateImpl implements AuthApiDelegate {

    private final OAuth2AuthorizedClientService clientService;
    private final AuthorizedClientsService authorizedClientsService;

    @Override
    public ResponseEntity<UserInfo> getCurrentUser() {
        UserInfo userInfo = new UserInfo();
        try {
            refreshOAuthToken();
            log.debug("Successfully refreshed token early in the request flow");
        } catch (UnauthorizedException e) {
            log.debug("Early token refresh attempt failed: {}", e.getMessage());
        }
        // Get the authenticated user from the security context (might have been updated by token refresh)
        OAuth2User principal = null;
        if (SecurityContextHolder.getContext().getAuthentication() != null &&
                SecurityContextHolder.getContext().getAuthentication().getPrincipal() instanceof OAuth2User) {
            principal = (OAuth2User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        }
        if (principal == null) {
            userInfo.setAuthenticated(false);
            log.debug("User not logged in");
            return ResponseEntity.ok(userInfo);
        }
        userInfo.setAuthenticated(true);
        userInfo.setName(principal.getAttribute("name"));
        userInfo.setEmail(principal.getAttribute("email"));
        userInfo.setPicture(principal.getAttribute("picture"));
        log.debug("User info retrieved: {}", userInfo);
        return ResponseEntity.ok(userInfo);
    }


    /**
     * Refreshes and returns OAuth token information for the current user
     *
     * @throws UnauthorizedException if the user is not authenticated or token cannot be refreshed
     */
    private void refreshOAuthToken() throws UnauthorizedException {
        // Extract user information from various sources
        UserTokenInfo userTokenInfo = extractUserTokenInfo();
        // If we couldn't get a username, we can't proceed
        if (userTokenInfo.username == null || userTokenInfo.registrationId == null) {
            log.warn("No user information available for token refresh - username: {}, registrationId: {}",
                    userTokenInfo.username, userTokenInfo.registrationId);
            throw new UnauthorizedException("No user information available for token refresh");
        }
        log.debug("Attempting to load authorized client for username: {}, registrationId: {}",
                userTokenInfo.username, userTokenInfo.registrationId);
        // Attempt to refresh the token
        OAuth2AuthorizedClient authorizedClient = refreshTokenIfNeeded(userTokenInfo.registrationId, userTokenInfo.username);
        if (authorizedClient == null) {
            log.warn("No authorized client found for user: {}", userTokenInfo.username);
            throw new UnauthorizedException("No authorized client found for user");
        }
        log.debug("Successfully loaded authorized client. Access token expires at: {}, refresh token present: {}",
                authorizedClient.getAccessToken().getExpiresAt(),
                authorizedClient.getRefreshToken() != null);
        log.debug("OAuth2 token retrieved successfully for user: {}", userTokenInfo.username);
    }

    /**
     * Extracts user token information from security context or session
     *
     * @return UserTokenInfo object containing username and registration ID
     */
    private UserTokenInfo extractUserTokenInfo() {
        UserTokenInfo userTokenInfo = new UserTokenInfo();
        // Check for OAuth2 authentication in the security context
        if (SecurityContextHolder.getContext().getAuthentication() instanceof OAuth2AuthenticationToken) {
            OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
            userTokenInfo.username = oauthToken.getName();
            userTokenInfo.registrationId = oauthToken.getAuthorizedClientRegistrationId();
            log.debug("Found OAuth2 authentication in security context. Username: {}, Registration ID: {}",
                    userTokenInfo.username, userTokenInfo.registrationId);
            return userTokenInfo;
        }
        log.debug("No OAuth2 authentication in security context, trying to get info from session");
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            log.debug("Successfully got HTTP request from current attributes");

            // Try to get username from cookies or session
            if (request.getSession() != null) {
                log.debug("Session exists, trying to extract username");
                // The username might be stored in the session or could be found in a custom cookie
                userTokenInfo.username = (String) request.getSession().getAttribute("username");
                userTokenInfo.registrationId = "google"; // Default to Google since it's your OAuth provider
                if (userTokenInfo.username != null) {
                    log.debug("Retrieved username from session: {}", userTokenInfo.username);
                } else {
                    log.debug("No username in session attributes");
                    // Log all session attributes for debugging
                    Enumeration<String> attributeNames = request.getSession().getAttributeNames();
                    while (attributeNames.hasMoreElements()) {
                        String attributeName = attributeNames.nextElement();
                        log.debug("Session attribute: {} = {}", attributeName, request.getSession().getAttribute(attributeName));
                    }
                }
            } else {
                log.debug("No session available in the request");
            }
            // Check cookies in case username is stored there
            if (userTokenInfo.username == null && request.getCookies() != null) {
                log.debug("Checking cookies for user information");
                for (Cookie cookie : request.getCookies()) {
                    log.debug("Cookie: {} = {}", cookie.getName(), cookie.getValue());
                }
            }
        } catch (Exception e) {
            log.warn("Error retrieving session information: {}", e.getMessage(), e);
        }
        return userTokenInfo;
    }

    /**
     * Refreshes an OAuth2 token if needed.
     *
     * @param clientRegistrationId the client registration ID
     * @param username the username
     * @return the refreshed OAuth2 authorized client, or null if refresh failed
     */
    private OAuth2AuthorizedClient refreshTokenIfNeeded(String clientRegistrationId, String username) {
        OAuth2AuthorizedClient client = clientService.loadAuthorizedClient(clientRegistrationId, username);
        // If client is null but we have a refresh token, attempt to refresh manually
        if (client == null && authorizedClientsService.hasRefreshToken(username)) {
            log.debug("No client found but refresh token available. Attempting manual refresh for user: {}", username);
            return authorizedClientsService.refreshToken(username);
        }

        // If client exists but access token is expired, attempt to refresh
        if (client != null && !authorizedClientsService.isAccessTokenValid(client.getAccessToken())) {
            log.debug("Access token expired. Attempting token refresh for user: {}", username);
            return authorizedClientsService.refreshToken(username);
        }

        return client;
    }

    /**
     * Simple class to hold user token information
     */
    private static class UserTokenInfo {
        private String username;
        private String registrationId;
    }
}
