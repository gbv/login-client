const events = {
  connect: "connect",
  disconnect: "disconnect",
  login: "login",
  logout: "logout",
  update: "update",
  error: "error",
}
const isEvent = (eventName) => {
  return Object.values(events).includes(eventName)
}

module.exports = Object.assign({ isEvent }, events)
