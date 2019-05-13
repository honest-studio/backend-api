## Description

Everipedia Backend Data-Access API

## Installation

This code has only been tested on Ubuntu 18.04.

Users of Ubuntu >16.04 can attempt to use the install/ubuntu_setup.sh script. Users of Mac OS X or Windows will have to install and initialize MongoDB and IPFS manually.

```bash
$ npm install
$ cd install
$ ./ubuntu_setup.sh
$ cd ..
```

## Configuration

You will find a `SAMPLE.env` file in the project root. Copy or rename this to `.env` (still in the project root) and set your API keys + other configuration variables as indicated.

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run dev

# incremental rebuild (webpack)
$ npm run webpack
$ npm run start:hmr

# production mode
$ npm run start:prod
```

## Test

There are currently only end-to-end test for the repo. To run:

```bash
# end-to-end tests
$ npm run test:e2e

# unit tests - currently not available
$ npm run test

# test coverage - currently not available
$ npm run test:cov
```

## Disabling Sync for Dev

Sometimes you need to disable the Dfuse syncing in development or testing. 

To do so, comment out the following line in `src/main.ts`:

```js
app.get('EosSyncService').sync();
```

## Troubleshooting

Here's some useful troubleshooting commands for the production server. 
All of these require SSH access. 

Restart IPFS: `systemctl --user restart ipfs`
Restart Backend API server: `systemctl --user restart ep2-backend`
Update .env: It is located at ~/ep2-backend/.env
