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
      host : '40.83.160.202',
      ref  : 'origin/master',
      repo : 'git@github.com:EveripediaNetwork/backend-api.git',
      path : '/home/beekeeper/ep2-backend',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
