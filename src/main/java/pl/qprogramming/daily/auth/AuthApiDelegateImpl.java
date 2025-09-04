package pl.qprogramming.daily.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import pl.qprogramming.daily.api.AuthApiDelegate;
import pl.qprogramming.daily.dto.UserInfo;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthApiDelegateImpl implements AuthApiDelegate {

    private final OAuth2AuthorizedClientManager authorizedClientManager;

    @Override
    public ResponseEntity<UserInfo> getCurrentUser() {
        UserInfo userInfo = new UserInfo();
        try {
            refreshOAuthToken();
            log.debug("Successfully refreshed token early in the request flow");
        } catch (UnauthorizedException e) {
            log.debug("Early token refresh attempt failed: {}", e.getMessage());
        }
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
        log.debug("User info retrieved: {}", userInfo);
        return ResponseEntity.ok(userInfo);
    }

    /**
     * Ensures there is a valid authorized client for the current OAuth2 user.
     * Uses the AuthorizedClientManager to auto-refresh if needed.
     */
    private void refreshOAuthToken() throws UnauthorizedException {
        if (!(SecurityContextHolder.getContext().getAuthentication() instanceof OAuth2AuthenticationToken)) {
            throw new UnauthorizedException("No OAuth2 authentication in security context");
        }
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        OAuth2AuthorizeRequest request = OAuth2AuthorizeRequest
                .withClientRegistrationId(oauthToken.getAuthorizedClientRegistrationId())
                .principal(oauthToken)
                .build();
        OAuth2AuthorizedClient authorizedClient = authorizedClientManager.authorize(request);
        if (authorizedClient == null) {
            throw new UnauthorizedException("No authorized client for user");
        }
        log.debug("Authorized client ready. Access token expires at: {}, refresh token present: {}",
                authorizedClient.getAccessToken() != null ? authorizedClient.getAccessToken().getExpiresAt() : null,
                authorizedClient.getRefreshToken() != null);
    }
}
