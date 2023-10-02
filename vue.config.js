var path = require('path');
module.exports = {
  devServer: {
    proxy: {
      '^/rest': {
        target:  'http://qux-be:8080',
	//target: 'htpp://172.17.0.1:8080', // for DEBUG mode with eclipse, you will start the backend with eclipse, you will have all env vars from docker-compose.yml specific for DEBUG session, stored in Debug-configuration in Eclipse, and prividing this link to 172.17.0.1 (host of docker containers, so where the eclipse and backend are running), you will have a FULL debug (breakpoints...) session for the backend - restore the qux-be:8080 and you have a stable backend and you want to be more lite and shutdown eclipse...
        //target: 'https://v1.quant-ux.com',
        ws: true,
        changeOrigin: true
      }
    }
  },
  chainWebpack: config => {
    config.optimization.minimize(false)
    config.resolve.alias.set('src', path.resolve('src'))
    config.resolve.alias.set('assets', path.resolve('src/assets'))
    config.resolve.alias.set('components', path.resolve('src/components'))
    config.resolve.alias.set('dojo', path.resolve('src/dojo'))
    config.resolve.alias.set('common', path.resolve('src/common'))
    config.resolve.alias.set('vommond', path.resolve('src/vommond'))
    config.resolve.alias.set('views', path.resolve('src/views'))
    config.resolve.alias.set('canvas', path.resolve('src/canvas'))
    config.resolve.alias.set('page', path.resolve('src/page'))
    config.resolve.alias.set('user', path.resolve('src/user'))
    config.resolve.alias.set('core', path.resolve('src/core'))
    config.resolve.alias.set('util', path.resolve('src/util'))
    config.resolve.alias.set('dash', path.resolve('src/dash'))
    config.resolve.alias.set('public', path.resolve('src/public'))
    config.resolve.alias.set('services', path.resolve('src/services'))
    config.resolve.alias.set('nls', path.resolve('src/nls'))
    config.resolve.alias.set('themes', path.resolve('src/themes'))
    config.resolve.alias.set('export', path.resolve('src/export'))
    config.resolve.alias.set('examples', path.resolve('src/examples'))
    config.resolve.alias.set('help', path.resolve('src/help'))
    config.resolve.alias.set('player', path.resolve('src/player'))
    config.resolve.alias.set('style', path.resolve('src/style'))
  }
}
