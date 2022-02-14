// Import internal dependencies
import events from "./utils/events.js"
import * as errors from "./utils/errors.js"
import { fetch } from "./utils/fetch.js"


// Import lodash methods (only import methods that are used to minimize size)
import isEqual from "lodash/isEqual.js"

// Import other external dependencies
import WebSocket from "isomorphic-ws"
import jwtDecode from "jwt-decode"

/**
 *
 */
class LoginClient {
  // Static properties for events and errors
  static get events() { return events }
  static get errors() { return errors }
  // Offer jwtDecode as static property
  static get jwtDecode() { return jwtDecode }

  /**
   * Creates a LoginClient instance.
   *
   * @param {string} url - server URL without protocol (e.g. "login.example.com")
   * @param {object} options - with properties `ssl` (default: true), `retryMs` (default: 1000), `retryMsMax` (default: 30000), `retryMult` (default: 1.2), `pingInterval` (default: 10000)
   */
  constructor(url, { ssl = true, retryMs = 1000, retryMsMax = 30000, retryMult = 1.2, pingInterval = 10000 } = {}) {
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
    this._about = null
    this._listeners = {}
    this._ws = null
    this._currentRetryMs = retryMs
    // Separate value for HTTP request because it has to persistent opening/closing the WebSocket
    this._currentRetryMsHttp = retryMs
    // ping-pong handling
    this._lastPong = null
    // Intervals and timeouts
    this._timeouts = []
    this._intervals = []
    this._setPingInterval = () => {
      this._intervals[0] = setInterval(() => {
        if (this._ws && this._ws.readyState == 1) {
          this._send({ type: "ping" })
          const now = new Date()
          if (this._lastPong && now - this._lastPong > 5 * pingInterval + 500) {
            // Force close WebSocket when there was no pong
            this._ws.close()
            this._emit(events.error, { error: new errors.ServerConnectionError("No reply from server, trying to reconnect.") })
          }
        }
      }, pingInterval)
    }
    // Wrapper functions for event handlers (so that `this` is conserved)
    this.__handleClose = (event) => {
      this._handleClose(event)
    }
    this.__handleOpen = (event) => {
      this._handleOpen(event)
    }
    this.__handleMessage = (event) => {
      this._handleMessage(event)
    }
  }

  /**
   * Adds an event listener. If `eventName` is `null`, the listener will receive all events.
   *
   * @param {string} eventName
   * @param {function} callback
   */
  addEventListener(eventName, callback) {
    if (eventName && !events.isEvent(eventName)) {
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
  get decodedToken() {
    return jwtDecode(this.token)
  }
  get about() {
    return this._about
  }

  /**
   * Connects to the login server and starts a WebSocket connection.
   */
  connect() {
    // Disconnect before attempting new connection.
    this.disconnect()
    // Connect to WebSocket and add event listeners.
    this._ws = new WebSocket(this._wsUrl)
    this._ws.addEventListener("close", this.__handleClose)
    this._ws.addEventListener("message", this.__handleMessage)
    // Establish regular pings.
    this._setPingInterval()
  }

  /**
   * Disconnects from the login server, closes the WebSocket connection.
   */
  disconnect() {
    // Remove intervals and timeouts.
    this._timeouts.forEach(clearTimeout)
    this._intervals.forEach(clearInterval)
    // Remove WebSocket listeners and close the connection.
    if (this._ws) {
      this._ws.removeEventListener("close", this.__handleClose)
      this._ws.removeEventListener("message", this.__handleMessage)
      this._ws.close()
      this._ws = null
    }
    if (this._connected) {
      this._connected = false
      this._emit(events.disconnect)
    }
  }

  /**
   * Changes the user's name via API.
   *
   * @param {string} name
   * @returns {Promise} A fulfilled Promise if the request succeeded, a rejected Promise if not.
   */
  setName(name) {
    if (!this.user || !name) {
      return Promise.reject()
    }
    return fetch(this.user.uri, {
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      method: "PATCH",
      body: JSON.stringify({ name })
    })
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
    this._lastPong = new Date()

    // Load login site first to make sure there is a cookie if third-party cookies are enabled
    this._loadLoginPage().then(() => fetch(this._baseUrl + "token", {
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
      if (error instanceof errors.ThirdPartyCookiesBlockedError) {
        console.error("Connection is not possible because third-party cookies are blocked.")
        this._emit(events.error, { error })
      } else {
        this._timeouts[0] = setTimeout(() => {
          // Only try again when WebSocket is not authenticated
          // Reason: The HTTP request can fail in certain cases even though the WebSocket connected and authenticated just fine.
          if (!this._authenticated) {
            console.error("Error: Could not load token from API, trying again by closing WebSocket.")
            this._emit(events.error, { error })
            this._currentRetryMsHttp = Math.min(this._currentRetryMsHttp * this._retryMult, this._retryMsMax)
            this._timeouts[1] = setTimeout(() => {
              this._ws.close()
            }, this._currentRetryMsHttp)
          }
        }, 100)
      }
    })
  }
  _handleClose() {
    if (this._connected) {
      this._emit(events.disconnect)
    } else {
      // If the client was not connected before, it is a ServerConnectionError.
      this._emit(events.error, { error: new errors.ServerConnectionError("No reply from server, trying to reconnect.") })
    }
    this._connected = false
    this._timeouts[2] = setTimeout(() => {
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
          if (!isEqual(this._providers, message.data.providers)) {
            this._providers = message.data.providers
            this._emit(events.providers, { providers: this._providers })
          }
          break
        case "about":
          if (!isEqual(this._about, message.data)) {
            this._about = message.data
            this._emit(events.about, this._about)
          }
          break
        case "token":
          if (!isEqual(this._token, message.data.token)) {
            this._token = message.data.token
            this._emit(events.token, { token: this._token, expiresIn: message.data.expiresIn })
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
          this._currentRetryMsHttp = this._retryMs
          this._emit(events.connect)
          break
        case "sessionAboutToExpire":
          // Load login page to refresh session
          this._loadLoginPage()
          break
        case "pong":
          this._lastPong = new Date()
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
    // Also call callbacks for `null`
    for (let callback of this._listeners[null] || []) {
      callback(eventData)
    }
  }

  /**
   * Uses fetch to load the login page to create or refresh a session cookie.
   */
  _loadLoginPage() {
    return fetch(this._baseUrl + "login", { credentials: "include", redirect: "manual" })
  }

}
LoginClient.LoginClient = LoginClient

export {
  LoginClient,
  errors,
  events,
}
