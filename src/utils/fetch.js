/**
 * A wrapper around node-fetch that throws an error if the request was not okay.
 */

import crossFetch from "cross-fetch"

export class FetchError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export function fetch(url, options) {
  return crossFetch(url, options).then(res => {
    if (res.ok) {
      return res
    } else {
      throw new FetchError(res.statusText, res.status)
    }
  })
}
