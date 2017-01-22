# Ghostwriter

Prerenders your JavaScript website for search engines, SEO tools, social media crawler and your browser.

| Module | Downloads | Version | License |
| :--- | :--- | :--- | :--- |
| `ghostwriter-middleware` | ![npm downloads total](https://img.shields.io/npm/dt/ghostwriter-middleware.svg) | ![npm version](https://img.shields.io/npm/v/ghostwriter-middleware.svg) | ![npm license](https://img.shields.io/npm/l/ghostwriter-middleware.svg) |
| `ghostwriter-apptool` | ![npm downloads total](https://img.shields.io/npm/dt/ghostwriter-apptool.svg) | ![npm version](https://img.shields.io/npm/v/ghostwriter-apptool.svg) | ![npm license](https://img.shields.io/npm/l/ghostwriter-apptool.svg) |
| `ghostwriter-html-webpack-plugin` | ![npm downloads total](https://img.shields.io/npm/dt/ghostwriter-html-webpack-plugin.svg) | ![npm version](https://img.shields.io/npm/v/ghostwriter-html-webpack-plugin.svg) | ![npm license](https://img.shields.io/npm/l/ghostwriter-html-webpack-plugin.svg) |
| `ghostwriter-service` | ![npm downloads total](https://img.shields.io/npm/dt/ghostwriter-service.svg) | ![npm version](https://img.shields.io/npm/v/ghostwriter-service.svg) | ![npm license](https://img.shields.io/npm/l/ghostwriter-service.svg) |
| `ghostwriter-common` | ![npm downloads total](https://img.shields.io/npm/dt/ghostwriter-common.svg) | ![npm version](https://img.shields.io/npm/v/ghostwriter-common.svg) | ![npm license](https://img.shields.io/npm/l/ghostwriter-common.svg) |

Ghostwriter is a replacement for the prerender.io service. In contrast to prerender.io it does not limit serving of prerendered pages to a specific set of spiders. Quite the contrary, it serves prerendered pages to all clients and browsers. Therefore Ghostwriter should NOT be vulnerable to accidental cloaking.

This approach results in one simple requirement for your web application: it should not be scared about prerendered content in the DOM, e.g. it should be able to discard an re-render or it should be able to reconcile the content. Usually this is not an issue if your web application is structured properly.

A complete example web application based on React is provided here: https://github.com/core-process/ghostwriter-example

## Install

### Backend

```
$ npm install --save ghostwriter-middleware
```

### Frontend

```
$ npm install --save ghostwriter-apptools
```

## Usage

### Backend

```js
// setup ghostwriter middleware (for express)
import ghostwriter from 'ghostwriter-middleware';
app.use(ghostwriter({
  token: 'bd7a1578-865e-463e-9049-fc1fe4319574',  // choose a unique app id
  version: 'da39a3ee5e6b4b0d3255bfef95601890afd80709', // e.g. git commit id
  urlTest: (url) => !url.startsWith('/api'),
  gwUrl: 'http://localhost:8887',
  appUrl: 'http://localhost:8888',
  sitemaps: [ '/sitemap.xml' ]
}));
```

### Frontend

```js
// setup ghostwriter client-tools
import * as ghostwriter from 'ghostwriter-apptool';
ghostwriter.setup('page');

// confirm rendering of page
import * as ghostwriter from 'ghostwriter-apptool';
export default class Page extends React.Component {
  componentDidMount() {
    ghostwriter.done('page');
  }
  render() {
    return (<div/>);
  }
};
```
