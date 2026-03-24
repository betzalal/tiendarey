module.exports = {
  apps: [
    {
      name: 'testphoneapp',
      script: './server/index.js',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 80 // Puerto por defecto para web en VPS (requiere sudo authbindings)
      }
    }
  ]
};
