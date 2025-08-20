package pl.qprogramming.daily.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;

import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthorizedClientsServiceTest {

    @InjectMocks
    private AuthorizedClientsService service;

    @Mock
    private Authentication authentication;

    @Mock
    private OAuth2AuthorizedClient authorizedClient;

    @Mock
    private OAuth2AccessToken accessToken;

    @Mock
    private OAuth2RefreshToken refreshToken;

    private static final String PRINCIPAL_NAME = "test-user";
    private static final String CLIENT_REGISTRATION_ID = "google";
    private static final String REFRESH_TOKEN_VALUE = "refresh-token-value";

    @Test
    void saveAuthorizedClient_ShouldStoreClient() {
        // Given
        when(authentication.getName()).thenReturn(PRINCIPAL_NAME);
        when(authorizedClient.getAccessToken()).thenReturn(accessToken);
        // Ensure token is valid according to service logic
        when(accessToken.getExpiresAt()).thenReturn(Instant.now().plus(Duration.ofMinutes(10)));
        when(authorizedClient.getRefreshToken()).thenReturn(null);

        // When
        service.saveAuthorizedClient(authorizedClient, authentication);

        // Then
        OAuth2AuthorizedClient result = service.loadAuthorizedClient(CLIENT_REGISTRATION_ID, PRINCIPAL_NAME);
        assertNotNull(result);
        assertEquals(authorizedClient, result);
    }

    @Test
    void saveAuthorizedClient_WithRefreshToken_ShouldStoreRefreshToken() {
        // Given
        when(authentication.getName()).thenReturn(PRINCIPAL_NAME);
        when(authorizedClient.getRefreshToken()).thenReturn(refreshToken);
        when(refreshToken.getTokenValue()).thenReturn(REFRESH_TOKEN_VALUE);

        // When
        service.saveAuthorizedClient(authorizedClient, authentication);

        // Then
        assertTrue(service.hasRefreshToken(PRINCIPAL_NAME));
    }

    @Test
    void loadAuthorizedClient_WithValidToken_ShouldReturnClient() {
        // Given
        when(authentication.getName()).thenReturn(PRINCIPAL_NAME);
        when(authorizedClient.getAccessToken()).thenReturn(accessToken);
        Instant expiresAt = Instant.now().plus(Duration.ofMinutes(10));
        when(accessToken.getExpiresAt()).thenReturn(expiresAt);
        service.saveAuthorizedClient(authorizedClient, authentication);

        // When
        OAuth2AuthorizedClient result = service.loadAuthorizedClient(CLIENT_REGISTRATION_ID, PRINCIPAL_NAME);

        // Then
        assertNotNull(result);
        assertEquals(authorizedClient, result);
    }

    @Test
    void loadAuthorizedClient_WithExpiredToken_NoRefreshToken_ShouldReturnNull() {
        // Given
        when(authentication.getName()).thenReturn(PRINCIPAL_NAME);
        when(authorizedClient.getAccessToken()).thenReturn(accessToken);
        Instant expiresAt = Instant.now().minus(Duration.ofMinutes(10));
        when(accessToken.getExpiresAt()).thenReturn(expiresAt);
        when(authorizedClient.getRefreshToken()).thenReturn(null);
        service.saveAuthorizedClient(authorizedClient, authentication);

        // When
        OAuth2AuthorizedClient result = service.loadAuthorizedClient(CLIENT_REGISTRATION_ID, PRINCIPAL_NAME);

        // Then
        assertNull(result);
    }

    @Test
    void loadAuthorizedClient_WithExpiredToken_WithRefreshToken_ShouldReturnNull() {
        // Given
        when(authentication.getName()).thenReturn(PRINCIPAL_NAME);
        when(authorizedClient.getAccessToken()).thenReturn(accessToken);
        Instant expiresAt = Instant.now().minus(Duration.ofMinutes(10));
        when(accessToken.getExpiresAt()).thenReturn(expiresAt);
        when(authorizedClient.getRefreshToken()).thenReturn(refreshToken);
        when(refreshToken.getTokenValue()).thenReturn(REFRESH_TOKEN_VALUE);
        service.saveAuthorizedClient(authorizedClient, authentication);

        // When
        OAuth2AuthorizedClient result = service.loadAuthorizedClient(CLIENT_REGISTRATION_ID, PRINCIPAL_NAME);

        // Then
        assertNull(result);
    }

    @Test
    void loadAuthorizedClient_WithNonExistentClient_ShouldReturnNull() {
        // When
        OAuth2AuthorizedClient result = service.loadAuthorizedClient(CLIENT_REGISTRATION_ID, "non-existent-user");

        // Then
        assertNull(result);
    }

    @Test
    void removeAuthorizedClient_ShouldRemoveClientAndRefreshToken() {
        // Given
        when(authentication.getName()).thenReturn(PRINCIPAL_NAME);
        when(authorizedClient.getRefreshToken()).thenReturn(refreshToken);
        when(refreshToken.getTokenValue()).thenReturn(REFRESH_TOKEN_VALUE);
        service.saveAuthorizedClient(authorizedClient, authentication);

        // When
        service.removeAuthorizedClient(CLIENT_REGISTRATION_ID, PRINCIPAL_NAME);

        // Then
        OAuth2AuthorizedClient result = service.loadAuthorizedClient(CLIENT_REGISTRATION_ID, PRINCIPAL_NAME);
        assertNull(result);
        assertFalse(service.hasRefreshToken(PRINCIPAL_NAME));
    }

    @Test
    void hasRefreshToken_WithRefreshToken_ShouldReturnTrue() {
        // Given
        when(authentication.getName()).thenReturn(PRINCIPAL_NAME);
        when(authorizedClient.getRefreshToken()).thenReturn(refreshToken);
        when(refreshToken.getTokenValue()).thenReturn(REFRESH_TOKEN_VALUE);
        service.saveAuthorizedClient(authorizedClient, authentication);

        // When
        boolean result = service.hasRefreshToken(PRINCIPAL_NAME);

        // Then
        assertTrue(result);
    }

    @Test
    void hasRefreshToken_WithoutRefreshToken_ShouldReturnFalse() {
        // Given
        when(authentication.getName()).thenReturn(PRINCIPAL_NAME);
        when(authorizedClient.getRefreshToken()).thenReturn(null);
        service.saveAuthorizedClient(authorizedClient, authentication);

        // When
        boolean result = service.hasRefreshToken(PRINCIPAL_NAME);

        // Then
        assertFalse(result);
    }

    @Test
    void hasRefreshToken_WithNonExistentUser_ShouldReturnFalse() {
        // When
        boolean result = service.hasRefreshToken("non-existent-user");

        // Then
        assertFalse(result);
    }
}
