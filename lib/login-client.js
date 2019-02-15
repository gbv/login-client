const events = require("../util/events")
const errors = require("../util/errors")

/**
 *
 */
class LoginClient {

  /**
   * Creates a LoginClient instance.
   *
   * @param {string} url - server URL without protocol (e.g. "login.example.com")
   * @param {boolean} ssl - true by default
   */
  constructor(url, ssl = true) {
    if (!url.endsWith("/")) {
      url += "/"
    }
    this._baseUrl = `${(ssl ? "https" : "http")}://${url}`
    this._wsUrl = `${(ssl ? "wss" : "ws")}://${url}`
    this._loggedIn = false
    this._user = null
    this._providers = []
    this._connected = false
    this._token = null
    this._publicKey = null
    this._listeners = {}
  }

  /**
   * Connects to the login server and starts a WebSocket connection.
   */
  connect() {
    throw new Error("Not yet implemented.")
  }

  /**
   * Adds an event listener.
   *
   * @param {string} eventName
   * @param {function} callback
   */
  addEventListener(eventName, callback) {
    if (!events.isEvent(eventName)) {
      throw new errors.NoSuchEventError(`Event ${eventName} does not exist.`)
    }
    if (!this._listeners[eventName]) {
      this._listeners[eventName] = []
    }
    this._listeners[eventName].push(callback)
  }

  /**
   * Getters for internal properties.
   */
  get loggedIn() {
    return this._loggedIn
  }
  get user() {
    return this._user
  }
  get providers() {
    return this._providers
  }
  get connected() {
    return this._connected
  }
  get token() {
    return this._token
  }
  get publicKey() {
    return this._publicKey
  }

  /**
   * Emits an event.
   *
   * @param {string} eventName
   * @param {object} eventData
   */
  _emit(eventName, eventData) {
    if (!events.isEvent(eventName)) {
      throw new errors.NoSuchEventError(`Event ${eventName} does not exist.`)
    }
    for (let callback of this._listeners[eventName] || []) {
      callback(eventData)
    }
  }

}

module.exports = LoginClient
