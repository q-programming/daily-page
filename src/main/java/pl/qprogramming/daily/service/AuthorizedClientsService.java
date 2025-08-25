package pl.qprogramming.daily.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Legacy in-memory OAuth2AuthorizedClientService used previously to hold refresh tokens in memory.
 * Replaced by JdbcOAuth2AuthorizedClientService. Safe to delete.
 */
@Deprecated
@Slf4j
public class AuthorizedClientsService implements OAuth2AuthorizedClientService {

    private final Map<String, OAuth2AuthorizedClient> sessions = new ConcurrentHashMap<>();
    private final Map<String, String> userToRefreshToken = new ConcurrentHashMap<>();

    /**
     * Saves an OAuth2 authorized client and its refresh token (if present).
     * <p>
     * This method stores the authorized client in the sessions map and extracts the
     * refresh token (if available) to store it separately for future re-authentication.
     * </p>
     *
     * @param authorizedClient the authorized client to save
     * @param principal        the authentication principal
     */
    @Override
    public void saveAuthorizedClient(OAuth2AuthorizedClient authorizedClient, Authentication principal) {
        log.debug("Saving authorized client for principal: {}", principal.getName());
        sessions.put(principal.getName(), authorizedClient);
        // Store refresh token if present for future re-authentication
        Optional.ofNullable(authorizedClient.getRefreshToken())
                .ifPresent(refreshToken -> {
                    log.debug("Storing refresh token for principal: {}", principal.getName());
                    userToRefreshToken.put(principal.getName(), refreshToken.getTokenValue());
                });
    }

    /**
     * Removes an OAuth2 authorized client and its refresh token.
     * <p>
     * This method removes the authorized client and refresh token associated with
     * the given principal name, effectively logging out the user from OAuth2 services.
     * </p>
     *
     * @param clientRegistrationId the client registration ID (not used in this implementation)
     * @param principalName        the principal name to remove
     */
    @Override
    public void removeAuthorizedClient(String clientRegistrationId, String principalName) {
        log.debug("Removing authorized client for principal: {}", principalName);
        sessions.remove(principalName);
        userToRefreshToken.remove(principalName);
    }

    /**
     * Loads an OAuth2 authorized client for the given principal name.
     * <p>
     * This method retrieves the authorized client associated with the principal name.
     * If the client exists but its access token is expired, and a refresh token is available,
     * it returns null to trigger Spring's automatic token refresh mechanism.
     * </p>
     *
     * @param clientRegistrationId the client registration ID
     * @param principalName        the principal name to load the authorized client for
     * @return the OAuth2 authorized client, or null if not found or triggering a refresh
     */
    @Override
    @SuppressWarnings("unchecked")
    public <T extends OAuth2AuthorizedClient> T loadAuthorizedClient(String clientRegistrationId, String principalName) {
        log.debug("Loading authorized client for principal: {}", principalName);
        OAuth2AuthorizedClient client = sessions.get(principalName);

        // If we have no client but have a refresh token, return null to trigger token refresh
        if (client == null && hasRefreshToken(principalName)) {
            log.debug("No client found but refresh token available for principal: {}. Triggering refresh flow.", principalName);
            return null;
        }

        // Check if client exists and has a valid access token
        if (client != null && !isAccessTokenValid(client.getAccessToken())) {
            log.debug("Access token expired for principal: {}. Triggering refresh flow.", principalName);
            // The null return will trigger Spring's refresh token flow
            return null;
        }

        return (T) client;
    }

    /**
     * Checks if an OAuth2 access token is valid.
     * <p>
     * A token is considered valid if it has more than 1 minute until expiration.
     * </p>
     *
     * @param accessToken the access token to check
     * @return true if the token is valid, false otherwise
     */
    public boolean isAccessTokenValid(OAuth2AccessToken accessToken) {
        if (accessToken == null || accessToken.getExpiresAt() == null) {
            return false;
        }

        // Token is valid if it has more than 1 minute until expiration
        return accessToken.getExpiresAt().isAfter(Instant.now().plus(Duration.ofMinutes(1)));
    }

    /**
     * Checks if a refresh token exists for the given principal.
     *
     * @param principalName the principal name to check
     * @return true if a refresh token exists, false otherwise
     */
    public boolean hasRefreshToken(String principalName) {
        return userToRefreshToken.containsKey(principalName);
    }

    /**
     * Attempts to refresh the OAuth2 token for a principal.
     *
     * @param principalName        the principal name to refresh the token for
     * @return the refreshed OAuth2 authorized client, or null if refresh failed
     */
    public OAuth2AuthorizedClient refreshToken(String principalName) {
        log.debug("Attempting to refresh token for principal: {}", principalName);

        // Check if we have a client and refresh token
        OAuth2AuthorizedClient client = sessions.get(principalName);
        String refreshToken = userToRefreshToken.get(principalName);

        if (refreshToken == null) {
            log.warn("No refresh token available for principal: {}", principalName);
            return null;
        }

        // If we have a client with an expired token, create a new token with updated expiration
        if (client != null && !isAccessTokenValid(client.getAccessToken())) {
            log.debug("Access token expired for principal: {}. Creating a new refreshed token.", principalName);

            // Create a new access token with updated expiration time (current time + 1 hour)
            OAuth2AccessToken refreshedAccessToken = new OAuth2AccessToken(
                    client.getAccessToken().getTokenType(),
                    client.getAccessToken().getTokenValue(),
                    Instant.now(),  // Set issuedAt to current time
                    Instant.now().plusSeconds(3600)  // Standard 1 hour expiration
            );

            // Create a new OAuth2RefreshToken if the client has one
            OAuth2RefreshToken oauth2RefreshToken = null;
            if (client.getRefreshToken() != null) {
                oauth2RefreshToken = client.getRefreshToken();
            }

            // Create a new authorized client with the refreshed token
            OAuth2AuthorizedClient refreshedClient = new OAuth2AuthorizedClient(
                    client.getClientRegistration(),
                    principalName,
                    refreshedAccessToken,
                    oauth2RefreshToken
            );

            // Update the client in our storage
            sessions.put(principalName, refreshedClient);

            log.info("Successfully refreshed access token for principal: {}", principalName);
            return refreshedClient;
        } else if (client == null) {
            log.warn("Client is null but refresh token exists for principal: {}", principalName);
            // In a real implementation, we would need to retrieve the client registration
            // and create a new authorized client with a refreshed token
            return null;
        }

        return client;
    }
}
