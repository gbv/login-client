const events = {
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
  _received: "_received"
}
const isEvent = (eventName) => {
  return Object.values(events).includes(eventName)
}

module.exports = Object.assign({ isEvent }, events)
