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
import pl.qprogramming.daily.api.AuthApiDelegate;
import pl.qprogramming.daily.dto.TokenInfo;
import pl.qprogramming.daily.dto.UserInfo;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthApiDelegateImpl implements AuthApiDelegate {

    private final OAuth2AuthorizedClientService clientService;

    @Override
    public ResponseEntity<UserInfo> getCurrentUser() {
        UserInfo userInfo = new UserInfo();

        // Get the authenticated user from the security context
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

    @Override
    public ResponseEntity<TokenInfo> getOAuthToken() {
        if (!(SecurityContextHolder.getContext().getAuthentication() instanceof OAuth2AuthenticationToken)) {
            return ResponseEntity.status(401).build();
        }

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        OAuth2AuthorizedClient authorizedClient = clientService.loadAuthorizedClient(
                oauthToken.getAuthorizedClientRegistrationId(),
                oauthToken.getName()
        );

        if (authorizedClient == null) {
            return ResponseEntity.status(401).build();
        }

        TokenInfo tokenInfo = new TokenInfo();
        tokenInfo.setTokenType(authorizedClient.getAccessToken().getTokenType().getValue());
        tokenInfo.setAccessToken(authorizedClient.getAccessToken().getTokenValue());
        tokenInfo.setExpiresAt(String.valueOf(authorizedClient.getAccessToken().getExpiresAt().getEpochSecond()));

        return ResponseEntity.ok(tokenInfo);
    }
}
