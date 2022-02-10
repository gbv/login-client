export default {
  connect: "connect",
  disconnect: "disconnect",
  login: "login",
  logout: "logout",
  update: "update",
  error: "error",
  providers: "providers",
  token: "token",
  about: "about",
  _sent: "_sent",
  _received: "_received",
  isEvent(eventName) {
    return Object.values(this).includes(eventName)
  },
}
