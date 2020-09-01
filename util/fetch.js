/**
 * A wrapper around node-fetch that throws an error if the request was not okay.
 */

const fetch = require("cross-fetch")

class FetchError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

module.exports = (url, options) => {
  return fetch(url, options).then(res => {
    if (res.ok) {
      return res
    } else {
      throw new FetchError(res.statusText, res.status)
    }
  })
}
