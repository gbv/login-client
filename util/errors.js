/**
 * Error to be used when there is no internet connection.
 */
class NoInternetConnectionError extends Error {}

/**
 * Error to be used when third-party cookies are blocked by the browser.
 */
class ThirdPartyCookiesBlockedError extends Error {}

/**
 * Error to be used when there are problems with the server connection.
 */
class ServerConnectionError extends Error {}

/**
 * Error to be used when a non-existent event is attempted to be used.
 */
class NoSuchEventError extends Error {}

module.exports = {
  NoInternetConnectionError,
  ThirdPartyCookiesBlockedError,
  ServerConnectionError,
  NoSuchEventError,
}
