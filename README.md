# Login Server
[![Build Status](https://travis-ci.com/gbv/login-client.svg?branch=master)](https://travis-ci.com/gbv/login-client)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)

This repository offers a client to be used with [login-server](https://github.com/gbv/login-server).

## Table of Contents
- [Install](#install)
- [Usage](#usage)
- [Test](#test)
- [Maintainers](#maintainers)
- [Contribute](#contribute)
- [License](#license)

## Install
```bash
git clone https://github.com/gbv/login-client.git
cd login-client
npm install
```

## Usage
```javascript
const LoginClient = require("gbv-login-client")
// Second parameter is a boolean whether the server supports SSL (`true` by default)
let client = new LoginClient("login.example.com")
// Add event listeners
client.addEventListener("connect", event => {
  // Fires when the client successfully connected.
  // `event` is empty.
})
client.addEventListener("disconnect", event => {
  // Fires when the client disconnected.
  // `event` is empty.
})
client.addEventListener("login", event => {
  // Fires when the user has logged in.
  // `event.user` contains the user object.
})
client.addEventListener("logout", event => {
  // Fires when the user has logged out.
  // `event` is empty.
})
client.addEventListener("update", event => {
  // Fires when the user was updated.
  // `event.user` contains the updated user object.
})
client.addEventListener("error", error => {
  // Fires when an error occurred.
  // `error` contains one of the following errors:
  // - NoInternetConnectionError
  // - ThirdPartyCookiesBlockedError
  // - ServerConnectionError
})
// Connect
client.connect() // Not yet implemented
// Access properties
client.loggedIn
client.user
client.providers
client.connected
client.token
client.publicKey
```

## Test
```bash
npm test
```

## Maintainers
- [@stefandesu](https://github.com/stefandesu)
- [@nichtich](https://github.com/nichtich)

## Contribute
PRs accepted.

- Please run the tests before committing.
- Please do not skip the pre-commit hook when committing your changes.
- If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License
MIT © 2019 Verbundzentrale des GBV (VZG)
