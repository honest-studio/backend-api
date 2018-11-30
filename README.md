## Description

Everipedia Backend Data-Acess API

## Installation

This code has only been tested on Ubuntu 18.04.

Users of Ubuntu >16.04 can attempt to use the install/ubuntu_setup.sh script. Users of Mac OS X will have to install and initialize MongoDB and IPFS manually.

```bash
$ npm install
$ cd install
$ ./ubuntu_setup.sh
$ cd ..
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# incremental rebuild (webpack)
$ npm run webpack
$ npm run start:hmr

# production mode
$ npm run start:prod
```

## Test

There are currently no tests for the repo. In the future, you will be able to run tests with the following commands: 

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
