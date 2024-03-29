import lint from "mocha-eslint"

// ESLint as part of the tests
let paths = [
  "**/*.js",
  "!node_modules/**/*.js",
  "!build/**/*.js",
  "!dist/**/*.js",
]
let options = {
  contextName: "ESLint"
}
lint(paths, options)
