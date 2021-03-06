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
$ npm run start:debug

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

* Restart IPFS: `systemctl --user restart ipfs`
* Restart Backend API server: `systemctl --user restart ep2-backend`
* Update .env: It is located at ~/ep2-backend/.env
* package.json has some good commands too

# PM2 Problems
If you get `[PM2][ERROR] Process backend not found`, do this:
pm2 update

# Mongo Problems
If you restart the Azure server, you will probably need to remount the disk.
mkdir /data/db
sudo mount /dev/sdc1 /data/db
sudo chown mongodb:mongodb /data/db
sudo chmod -R go+w /data/db

# Updating Redis
Redis can be updated by replaying the DB locally then copying it into the remote server

Local server:

1. `redis-cli save`: Save a Redis snapshot locally. Default location is /var/lib/redis/dump.rdb
2. `scp /var/lib/redis/dump.rdb beekeeper@backend.everipedia.org:/home/beekeeper/`: Copy the Redis DB to Backend server

Backend server:

1. `ssh beekeeper@backend.everipedia.org`: SSH into backend server
2. `systemctl --user stop ep2-synconly`: Stop the sync process
3. `sudo systemctl stop redis-server`: Stop Redis
4. `sudo cp dump.rdb /datadrive/redis/dump.rdb`: Overwrite the old DB backup with the new version
5. `sudo systemctl start redis-server`: Start Redis
6. (repeat) `redis-cli get eos_actions:last_block_processed`: Repeat this command until you get a response. Redis may take a while to load the database into memory and this function will throw an error until that is complete.
7. `systemctl --user restart ep2-synconly`: Restart sync process
8. `pm2 reload backend`: Reload backend to reset Redis connection
