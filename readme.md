# Ghostwriter

Ghostwriter is a replacement for the prerender.io service. In contrast to prerender.io it does not limit serving of prerendered pages to a specific set of spiders (and therefore should NOT be vulnerable to accidental cloaking). For this reason the web application has to be able to handle prerendered content on client side (which is usually not an issue if structured properly).

A complete example based on React is provided here: https://github.com/core-process/ghostwriter-example

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
  token: 'bd7a1578-865e-463e-9049-fc1fe4319574',  // choose a unique id
  urlTest: (url) => !url.startsWith('/api'),
  serviceUrl: 'http://localhost:8887',
  baseUrl: 'http://localhost:8888',
  sitemaps: [ 'http://localhost:8888/sitemap.xml' ]
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
