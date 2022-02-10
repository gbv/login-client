/**
 * Error to be used when there is no internet connection.
 */
export class NoInternetConnectionError extends Error {}

/**
 * Error to be used when third-party cookies are blocked by the browser.
 */
export class ThirdPartyCookiesBlockedError extends Error {}

/**
 * Error to be used when there are problems with the server connection.
 */
export class ServerConnectionError extends Error {}

/**
 * Error to be used when a non-existent event is attempted to be used.
 */
export class NoSuchEventError extends Error {}
