package pl.qprogramming.daily.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for managing OAuth2 authorized clients and their refresh tokens.
 * <p>
 * This implementation provides an in-memory storage solution for OAuth2 authorized clients
 * using ConcurrentHashMap for thread-safety. It stores both the authorized client objects
 * and separately manages refresh tokens to support automatic re-authentication when
 * access tokens expire.
 * </p>
 * <p>
 * The service supports:
 * <ul>
 *   <li>Storing and retrieving OAuth2 authorized clients by principal name</li>
 *   <li>Checking access token validity</li>
 *   <li>Managing refresh tokens for automatic token renewal</li>
 *   <li>Determining if a user has connected their calendar</li>
 * </ul>
 * </p>
 * <p>
 * Note: This is an in-memory implementation, so all stored data is lost when the application
 * is restarted. For production use with persistent storage, consider implementing a different
 * storage mechanism.
 * </p>
 */
@Service
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
    @SuppressWarnings("unchecked") // Suppress warning about unchecked conversion
    public <T extends OAuth2AuthorizedClient> T loadAuthorizedClient(String clientRegistrationId, String principalName) {
        log.debug("Loading authorized client for principal: {}", principalName);
        OAuth2AuthorizedClient client = sessions.get(principalName);
        // Check if client exists and has a valid access token
        if (client != null && isAccessTokenValid(client.getAccessToken())) {
            return (T) client;
        }
        // If client doesn't exist or token is expired, but we have a refresh token
        if (hasRefreshToken(principalName)) {
            log.debug("Access token missing or expired for principal: {}. Refresh token available.", principalName);
            // The null return will trigger Spring's refresh token flow
            // Spring's OAuth2AuthorizedClientProvider will handle token refresh automatically
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
    private boolean isAccessTokenValid(OAuth2AccessToken accessToken) {
        Instant expiresAt = accessToken.getExpiresAt();
        if (expiresAt == null) {
            return false;
        }
        // Consider token expired if it has less than 1 minute validity
        return expiresAt.isAfter(Instant.now().plus(Duration.ofMinutes(1)));
    }

    /**
     * Checks if a refresh token is available for the given principal.
     *
     * @param principalName the principal name to check
     * @return true if a refresh token is available, false otherwise
     */
    public boolean hasRefreshToken(String principalName) {
        return userToRefreshToken.containsKey(principalName);
    }

}
