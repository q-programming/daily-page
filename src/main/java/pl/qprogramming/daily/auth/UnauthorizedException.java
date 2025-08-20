package pl.qprogramming.daily.auth;

/**
 * Exception thrown when a user is not authenticated or
 * authentication-related operations fail.
 */
public class UnauthorizedException extends Exception {

    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
