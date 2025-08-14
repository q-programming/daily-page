package pl.qprogramming.daily.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class AuthorizedClientsService implements OAuth2AuthorizedClientService {

    private final Map<String, OAuth2AuthorizedClient> sessions = new ConcurrentHashMap<>();

    @Override
    public void saveAuthorizedClient(OAuth2AuthorizedClient authorizedClient, Authentication principal) {
        log.debug("Saving authorized client for principal: {}",principal);
        sessions.put(principal.getName(), authorizedClient); // use session id as key for API-first
    }

    @Override
    public void removeAuthorizedClient(String clientRegistrationId, String principalName) {
        log.debug("Removing authorized client for principal: {}", principalName);
        sessions.remove(principalName);
    }

    @Override
    public OAuth2AuthorizedClient loadAuthorizedClient(String clientRegistrationId, String principalName) {
        log.debug("Loading authorized client for principal: {}", principalName);
        return sessions.get(principalName);
    }
}
