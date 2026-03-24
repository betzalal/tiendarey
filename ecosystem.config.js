module.exports = {
  apps: [
    {
      name: 'testphoneapp',
      script: './server/index.js',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    }
  ]
};
