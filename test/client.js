const expect = require("chai").expect
const LoginClient = require("../lib/login-client")
let client = new LoginClient("login.example.com")

describe("Connect", () => {

  /**
   * Will be removed when connect() is implemented.
   */
  it("should throw an error if connect is called", done => {
    expect(() => client.connect()).to.throw
    done()
  })

  it("should throw an error if an unknown event listener is added", done => {
    expect(() => client.addEventListener("abcdefg", () => {})).to.throw
    done()
  })

  it("should contain default values in getter properties", done => {
    expect(client.loggedIn).to.be.false
    expect(client.providers).to.be.empty
    expect(client.user).to.be.null
    expect(client.connected).to.be.false
    expect(client.token).to.be.null
    expect(client.about).to.be.null
    done()
  })

})
