# SimpleMfa Example Application

This directory contains a sample application designed to show you how to integrate SimpleMfa into your own application.
Note: this is **not** a production-grade application!

## Getting Started

If you're just browsing the code, [./index.js](./index.js) is a good place to start, and you can dive into a specific module to see more.

### Launching

The sample application can show you how various SimpleMfa flows integrate together. To launch it:

```bash
# Clone the repository
git clone https://github.com/vikaspotluri123/simple-mfa.git

# Build simple-mfa for use in the example app
cd simple-mfa
yarn install
yarn link # Tell yarn that `@potluri/simple-mfa` exists here
yarn build

# Install example app dependencies
cd example
yarn install

# The listening port can be configured with the `PORT` env var. Otherwise, a random port will be used.
node index.js
```

Be sure to read through all the output in the console! Several of SimpleMfa's features are demonstrated, and relevant information is displayed.
