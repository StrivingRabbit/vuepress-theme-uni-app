const https = require('https');

// 同步淘宝源
(() => {
  return new Promise((resolve, reject) => {
    https.get(
      'https://registry.npmmirror.com/-/package/vuepress-theme-uni-app-test/syncs/641167a1418f812d093a7d49',
      (res) => {
        res.on('data', (data) => {
          data = JSON.parse(data.toString());
          if (res.statusCode && data.ok) {
            console.log('cnpm syncs success');
          }
        });
      })
  })
})()