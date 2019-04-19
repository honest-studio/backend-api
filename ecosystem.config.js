// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
module.exports = {
  apps : [{
    name: 'ep2-backend',
    script: 'dist/main.js',
    instances: 8,
    autorestart: true,
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    "log_date_format": "DD-MM-YYYY HH:mm:ss"
  }],

  deploy : {
    production : {
      user : 'beekeeper',
      host : 'api.everipedia.org',
      ref  : 'origin/master',
      repo : 'https://github.com/EveripediaNetwork/backend-api.git',
      path : '/home/beekeeper/ep2-backend',
      'post-deploy' : 'npm install && cp ../.env . && npm run-script build && pm2 reload ecosystem.config.js --env production'
    },
    kylin : {
      user : 'eos',
      host : 'kylin.libertyblock.io',
      ref  : 'origin/master',
      repo : 'https://github.com/EveripediaNetwork/backend-api.git',
      path : '/home/eos/ep2-backend-kylin',
      'post-deploy' : 'npm install && cp ../.env . && npm run-script build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
