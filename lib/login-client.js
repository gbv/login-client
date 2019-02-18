// Import internal dependencies
const events = require("../util/events")
const errors = require("../util/errors")
const fetch = require("../util/fetch")

// Import lodash methods (only import methods that are used to minimize size)
const _ = {
  isEqual: require("lodash/isEqual")
}
// Import other external dependencies
const WebSocket = require("isomorphic-ws")
const jwtDecode = require("jwt-decode")

/**
 *
 */
class LoginClient {

  /**
   * Creates a LoginClient instance.
   *
   * @param {string} url - server URL without protocol (e.g. "login.example.com")
   * @param {object} options - with properties `ssl` (default: true), `retryMs` (default: 1000), `retryMsMax` (default: 10000), `retryMult` (default: 1.2)
   */
  constructor(url, { ssl = true, retryMs = 1000, retryMsMax = 10000, retryMult = 1.2 } = {}) {
    if (!url.endsWith("/")) {
      url += "/"
    }
    this._ssl = ssl
    this._retryMs = retryMs
    this._retryMsMax = retryMsMax
    this._retryMult = retryMult
    this._baseUrl = `${(ssl ? "https" : "http")}://${url}`
    this._wsUrl = `${(ssl ? "wss" : "ws")}://${url}`
    this._loggedIn = false
    this._user = null
    this._providers = null
    this._connected = false
    this._token = null
    this._publicKey = null
    this._listeners = {}
    this._ws = null
    this._currentRetryMs = retryMs
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
    return this._providers || []
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
   * Connects to the login server and starts a WebSocket connection.
   */
  connect() {
    this._ws = new WebSocket(this._wsUrl)
    this._ws.addEventListener("close", event => this._handleClose(event))
    this._ws.addEventListener("message", event => this._handleMessage(event))
  }

  _send(req) {
    let currentRetryMs = this._retryMs
    const send = () => {
      if (!this._ws || this._ws.readyState != 1) {
        // Try again
        setTimeout(() => {
          send()
          currentRetryMs *= this._retryMult
        }, Math.min(currentRetryMs, this._retryMsMax))
      } else {
        try {
          let message = JSON.stringify(req)
          this._ws.send(message)
          this._emit(events._sent, { message })
        } catch(error) {
          console.error("Interal Error: Failed to send message.")
        }
      }
    }
    send()
  }

  _handleOpen() {
    this._currentRetryMs = this._retryMs
    this._authenticated = false

    // Load providers if necessary
    if (!this._providers) {
      this._send({
        type: "providers"
      })
    }
    // Load publicKey if necessary
    if (!this._publicKey) {
      this._send({
        type: "publicKey"
      })
    }

    // Load login site first to make sure there is a cookie if third-party cookies are enabled
    fetch(this._baseUrl + "login", { credentials: "include" }).then(() => fetch(this._baseUrl + "token", {
      credentials: "include"
    })).then(response => response.json()).then(data => {
      // If there is no encrypted sessionID in the token, third-party cookies are blocked!
      const decodedToken = jwtDecode(data.token)
      if (!decodedToken.sessionID) {
        throw new errors.ThirdPartyCookiesBlockedError()
      }
      if (!this._authenticated) {
        this._send({
          type: "authenticate",
          token: data.token
        })
        this._token = data.token
      }
    }).catch(error => {
      console.error("Error: Could not load token from API.")
      this._emit(events.error, { error })
      if (error instanceof errors.ThirdPartyCookiesBlockedError) {
        console.error("Connection is not possible because third-party cookies are blocked.")
      } else {
        console.warn("Trying again by closing WebSocket.")
        this._ws.close()
      }
    })
  }
  _handleClose() {
    if (this._connected) {
      this._emit(events.disconnect)
    }
    this._connected = false
    setTimeout(() => {
      this._currentRetryMs *= this._retryMult
      this.connect()
    }, Math.min(this._currentRetryMs, this._retryMsMax))
  }
  _handleMessage({ data: message }) {
    this._emit(events._received, { message })
    try {
      message = JSON.parse(message)
      switch (message.type) {
        case "open":
          this._handleOpen()
          break
        case "providers":
          if (!_.isEqual(this._providers, message.data.providers)) {
            this._providers = message.data.providers
            this._emit(events.providers, { providers: this._providers })
          }
          break
        case "publicKey":
          if (!_.isEqual(this._publicKey, message.data.publicKey)) {
            this._publicKey = message.data.publicKey
            this._emit(events.publicKey, { publicKey: this._publicKey })
          }
          break
        case "token":
          if (!_.isEqual(this._token, message.data.token)) {
            this._token = message.data.token
            this._emit(events.token, { token: this._token })
          }
          break
        case "updated":
          this._user = message.data.user
          this._emit(events.update, { user: message.data.user })
          break
        case "loggedIn":
          this._user = message.data.user
          this._loggedIn = true
          this._emit(events.login, { user: message.data.user })
          break
        case "loggedOut":
          this._user = null
          this._loggedIn = false
          this._emit(events.logout)
          break
        case "authenticated":
          this._authenticated = true
          this._connected = true
          this._emit(events.connect)
          break
        default:
          console.warn("Warning: Received unknown message of type", message.type)
      }
    } catch(error) {
      console.warn("Warning: Could not handle message from WebSocket:", error.message)
    }
  }

  /**
   * Emits an event.
   *
   * @param {string} eventName
   * @param {object} eventData
   */
  _emit(eventName, eventData = {}) {
    if (!events.isEvent(eventName)) {
      throw new errors.NoSuchEventError(`Event ${eventName} does not exist.`)
    }
    // Add event name to data
    eventData.type = eventName
    for (let callback of this._listeners[eventName] || []) {
      callback(eventData)
    }
  }

}

module.exports = LoginClient
