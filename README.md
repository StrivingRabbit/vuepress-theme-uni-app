### uni-app official website theme for vuepress

# vuepress-theme-uni-app-test

[![NPM version](https://badgen.net/npm/v/vuepress-theme-uni-app-test)](https://www.npmjs.com/package/vuepress-theme-uni-app-test) [![NPM downloads](https://badgen.net/npm/dm/vuepress-theme-uni-app-test)](https://npmjs.com/package/vuepress-theme-uni-app-test)
 
## Sites

- clone this repo and run `yarn && yarn docs:dev`


## Install

```bash
yarn add vuepress-theme-uni-app-test -D
# OR npm install vuepress-theme-uni-app-test -D
```


## Usage

First: copy `/config` to `docs/.vuepress/config`

Second:
```js
// .vuepress/config.js
module.exports = {
  theme: 'vuepress-theme-uni-app-test',
  themeConfig: {
    // Please head documentation to see the available options.
  },
  // add alias
  chainWebpack(config, isServer) {
    config.resolve.alias.set(
      '@theme-config',
      path.resolve(process.cwd(), 'docs/.vuepress/config')
    )
  }
}
```
