/**
 * This file serves as a bridge to the auto-generated api-client
 * By importing from this file instead of directly from the api-client,
 * you ensure consistent imports across development and production builds.
 */

// Re-export everything from the api-client
export * from '../client-api';

// Explicitly export the classes that aren't properly exported through the wildcard
export { Configuration } from '../client-api/configuration';
export { WeatherApi } from '../client-api/api';
