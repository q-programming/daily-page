package pl.qprogramming.daily.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.X509Certificate;

/**
 * Configuration for RestTemplate with environment-specific SSL handling.
 * <p>
 * This configuration provides two different RestTemplate beans:
 * <ul>
 *   <li>For development profile: A RestTemplate that trusts all SSL certificates</li>
 *   <li>For all other profiles: A standard RestTemplate with proper certificate validation</li>
 * </ul>
 * </p>
 * <p>
 * The development configuration bypasses SSL certificate validation, which is necessary
 * in certain development environments for the following reasons:
 * </p>
 * <ul>
 *   <li>Enabling connections to endpoints with self-signed certificates</li>
 *   <li>Working around certificate validation issues in corporate proxy environments</li>
 *   <li>Bypassing certificate validation problems when accessing external APIs from development machines</li>
 *   <li>Resolving PKIX path building failures due to missing or invalid certificate chains</li>
 * </ul>
 * <p>
 * <strong>SECURITY WARNING:</strong> The development configuration deliberately bypasses SSL certificate
 * validation, which eliminates HTTPS security protections. It is only enabled with the "dev" profile
 * and should NEVER be used in production environments as it makes the application vulnerable to
 * man-in-the-middle attacks.
 * </p>
 */
@Configuration
@Slf4j
public class RestTemplateConfig {

    /**
     * Creates a standard RestTemplate bean with proper SSL certificate validation.
     * This bean is active for all profiles EXCEPT "dev".
     *
     * @return A RestTemplate instance with standard security settings
     */
    @Bean
    @Profile("!dev")
    public RestTemplate standardRestTemplate() {
        log.info("Creating standard RestTemplate with proper certificate validation");
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5000); // 5 seconds
        requestFactory.setReadTimeout(5000);    // 5 seconds
        return new RestTemplate(requestFactory);
    }

    /**
     * Creates a development-only RestTemplate bean with SSL certificate validation disabled.
     * This bean is only active when the "dev" profile is enabled.
     *
     * @return A RestTemplate instance that trusts all SSL certificates
     */
    @Bean
    @Profile("dev")
    public RestTemplate devRestTemplate() {
        log.warn("Creating development RestTemplate that bypasses SSL certificate validation - NOT FOR PRODUCTION USE");
        return createTrustAllRestTemplate();
    }

    /**
     * Creates a RestTemplate that trusts all SSL certificates (for development only).
     * <p>
     * This method:
     * <ol>
     *   <li>Creates a custom TrustManager that accepts all certificates without validation</li>
     *   <li>Initializes an SSL context with this trust manager</li>
     *   <li>Configures the default HTTPS connection to use this relaxed SSL context</li>
     *   <li>Disables hostname verification (accepting any hostname regardless of what's in the certificate)</li>
     *   <li>Sets reasonable connection and read timeouts (5 seconds)</li>
     * </ol>
     * </p>
     * <p>
     * This approach fixes issues like the Google OAuth connectivity problems and other
     * certificate validation errors that can occur in development environments.
     * </p>
     *
     * @return A RestTemplate configured to trust all certificates
     */
    private RestTemplate createTrustAllRestTemplate() {
        // Create a trust manager that does not validate certificate chains
        TrustManager[] trustAllCerts = new TrustManager[] {
            new X509TrustManager() {
                public X509Certificate[] getAcceptedIssuers() {
                    return new X509Certificate[0];
                }
                public void checkClientTrusted(X509Certificate[] certs, String authType) {
                    // No validation
                }
                public void checkServerTrusted(X509Certificate[] certs, String authType) {
                    // No validation
                }
            }
        };

        try {
            // Initialize a relaxed SSL context with our trust-all manager
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, trustAllCerts, new java.security.SecureRandom());

            // Set the default SSL socket factory to use our relaxed context
            HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.getSocketFactory());

            // Disable hostname verification
            HttpsURLConnection.setDefaultHostnameVerifier((hostname, session) -> true);

            // Configure request factory with reasonable timeouts
            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
            requestFactory.setConnectTimeout(5000); // 5 seconds
            requestFactory.setReadTimeout(5000);    // 5 seconds

            return new RestTemplate(requestFactory);
        } catch (NoSuchAlgorithmException | KeyManagementException e) {
            log.error("Failed to create SSL trust-all context", e);
            // Fall back to default RestTemplate if we can't create our custom one
            return new RestTemplate();
        }
    }
}
