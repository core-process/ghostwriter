# Ghostwriter

Ghostwriter prerenders your JavaScript website for search engines, SEO tools, social media crawler and your browser.

| Module | Downloads | Version | License |
| :--- | :--- | :--- | :--- |
| `ghostwriter-middleware` | ![npm downloads total](https://img.shields.io/npm/dt/ghostwriter-middleware.svg) | ![npm version](https://img.shields.io/npm/v/ghostwriter-middleware.svg) | ![npm license](https://img.shields.io/npm/l/ghostwriter-middleware.svg) |
| `ghostwriter-apptool` | ![npm downloads total](https://img.shields.io/npm/dt/ghostwriter-apptool.svg) | ![npm version](https://img.shields.io/npm/v/ghostwriter-apptool.svg) | ![npm license](https://img.shields.io/npm/l/ghostwriter-apptool.svg) |
| `ghostwriter-html-webpack-plugin` | ![npm downloads total](https://img.shields.io/npm/dt/ghostwriter-html-webpack-plugin.svg) | ![npm version](https://img.shields.io/npm/v/ghostwriter-html-webpack-plugin.svg) | ![npm license](https://img.shields.io/npm/l/ghostwriter-html-webpack-plugin.svg) |
| `ghostwriter-service` | ![npm downloads total](https://img.shields.io/npm/dt/ghostwriter-service.svg) | ![npm version](https://img.shields.io/npm/v/ghostwriter-service.svg) | ![npm license](https://img.shields.io/npm/l/ghostwriter-service.svg) |
| `ghostwriter-common` | ![npm downloads total](https://img.shields.io/npm/dt/ghostwriter-common.svg) | ![npm version](https://img.shields.io/npm/v/ghostwriter-common.svg) | ![npm license](https://img.shields.io/npm/l/ghostwriter-common.svg) |

Ghostwriter is a replacement for the prerender.io service. In contrast to prerender.io, it does not limit serving of prerendered pages to a particular set of spiders. Quite the contrary, it serves prerendered pages to all crawlers and browsers. Therefore Ghostwriter should NOT be vulnerable to accidental cloaking.

This approach results in one simple requirement for your web application: it should not be scared about prerendered content in the DOM, e.g. it should be able to discard and re-render, or it should be able to reconcile the content. Usually, this is not an issue if your web application is structured correctly.

Here you will find a complete example web application based on React: https://github.com/core-process/ghostwriter-example

## Ghostwriter Service

The Ghostwriter service is provided as [Docker image](https://quay.io/repository/process_team/ghostwriter-service) and as [NPM package](https://www.npmjs.com/package/ghostwriter-service). Just pick whatever flavor you like best.

### NPM package

Install the `ghostwriter-service` module via:

```
$ npm install ghostwriter-service --save
# ... or ...
$ yarn add ghostwriter-service
```

The module provides the service binary `ghostwriter-service`, which requires the following parameters:

| Parameter | Description | Example |
| :--- | :--- |  :--- |
| `--port` | Port to listen on | `8887` |
| `--database-uri` | URL to a MongoDB database | `mongodb://database:27017/ghostwriter` |
| `--keep-database` | Keep current database | |

**Be aware:** If you do not pass the `--keep-database` parameter to the Ghostwriter service, it will drop and recreate the provided MongoDB database.

We recommend to add the service to your `package.json`:

```js
{
  ...
  "scripts": {
    "ghostwriter-service":
      "ghostwriter-service --port 8887 --database-uri mongodb://database:27017/ghostwriter",
    ...
  },
  ...
}
```

The previous entry enables you to run the service via `npm`:

```
$ npm run ghostwriter-service
```

### Docker image

Pull the latest `ghostwriter-service` image via:

```
$ docker pull quay.io/process_team/ghostwriter-service:latest
```

The Docker image requires the environment variable `DATABASE_URI` pointing to a MongoDB database and creates a service listening on port `8888`.

Run your Ghostwriter service with the following command:

```
$ docker run \
    -d \
    --name myghostwriter \
    -p 127.0.0.1:8887:8888 \
    --env DATABASE_URI=mongodb://database:27017/ghostwriter \
    quay.io/process_team/ghostwriter-service:latest
```

**Be aware:** The Ghostwriter service provided as Docker container will drop and recreate the provided MongoDB database. Currently, there is no environment variable available to change the behavior.

See the [Docker manual](https://docs.docker.com/engine/reference/commandline/run/) for more.

## Application Backend

Ghostwriter hooks into your `express` application with the help of middleware. Install the `ghostwriter-middleware` module via:

```
$ npm install ghostwriter-middleware --save
# ... or ...
$ yarn add ghostwriter-middleware
```

The following example shows how to enable the middleware in your application:

```js
...
// e.g. use app name as 'token' (see config below)
const appName = require('./package.json').name;

// e.g. use git commit id as 'version'
import childProcess from 'child_process';
const gitCommitId =
  childProcess.execSync('git rev-parse HEAD').toString().trim();

// e.g. do not pre-render calls to /api*, used as 'urlTest'
const urlTest =
  (url) => !url.startsWith('/api');

// setup ghostwriter middleware for express
import ghostwriter from 'ghostwriter-middleware';
app.use(ghostwriter({
  token: appName,
  version: gitCommitId,
  sitemaps: [ '/sitemap.xml' ],
  urlTest: urlTest,
  gwUrl: 'http://localhost:8887',
  appUrl: 'http://localhost:8888'
}));
...
```

The middleware accepts the following parameters:

| Parameter | Description | Default Value |
| :--- | :--- | :--- |
| `token` | Unique name of your application instance, e.g. the name from your `package.json` | none (required) |
| `version` | A version string to identify the current version of your application, e.g. the git commit id | none (required) |
| `refreshCycle` | The number of hours before a rendered page needs to be refreshed | `1.0` |
| `sandbox.viewportWidth` | The width of the rendering viewport in pixels | `1280` |
| `sandbox.viewportHeight` | The height of the rendering viewport in pixels | `800` |
| `sandbox.completionTimeout` | The number of seconds to wait before rendering fails | `30.0` |
| `sitemaps` | An array of sitemap paths used to actively crawl the application | `[ '/sitemap.xml' ]` |
| `gwUrl` | URL pointing to Ghostwriter (can be on the local network) | none (required) |
| `appUrl` | URL pointing to your application (can be on the local network) | `'http://localhost'` |

## Application Frontend

Your frontend application is required to confirm the successful completion of the rendering process. This is accomplished by defining so-called 'sections' with the help of the `ghostwriter-apptools` module. Install the `ghostwriter-apptools` module via:

```
$ npm install ghostwriter-apptools --save
# ... or ...
$ yarn add ghostwriter-apptools
```

Define the 'sections' as soon as possible in your entry point. The sections need to be defined via the `setup` function before they can be confirmed and there has to be only one call to the `setup` function. The `setup` function accepts an arbitrary number of 'section' names, e.g.:

```js
...
// define sections which require render confirmation at the very first
import * as ghostwriter from 'ghostwriter-apptool';
ghostwriter.setup('newsticker', 'page');
...
```

Confirm the rendering of the 'sections' in your components with the `done` function as soon as the DOM represents the expected rendering result. Think about it twice and read the documentation of your rendering library carefully. The `done` function expects a valid 'section' name as a single parameter.

Below you will find two React-based examples.

```js
...
import * as ghostwriter from 'ghostwriter-apptool';

// a 'page' which does not load additional data
export default class SomePage extends React.Component {
  componentDidMount() {
    ghostwriter.done('page');
  }
  render() {
    return (<div className="some-page">...</div>);
  }
};
...

// a 'page' which does load additional data (confirm after rendering of data)
export default class AnotherPage extends React.Component {
  componentDidMount() {
    loadPageData((data) => {
      this.setState({ data }, () => {
        ghostwriter.done('page');
      });
    });
  }
  render() {
    return (<div className="another-page">...</div>);
  }
};
...
```

### Handling of script, link and style tags

All instances of the tags `<script type="text/javascript">`, `<link rel="stylesheet">` and `<style type="text/css">` will be filtered by Ghostwriter if not marked with the attribute `data-ghostwriter-keep`. This behavior might be surprising on the first sight but is well-thought. A lot of external libraries clutter the DOM with these tags without proper checks for duplicates. Therefore if not controlled, libraries start to add these tags twice and might trigger undefined behavior. Just add `data-ghostwriter-keep` to your tags you want to be part of the pre-rendered result, and you are ready to go.

To make things easier, we created the module [ghostwriter-html-webpack-plugin](https://www.npmjs.com/package/ghostwriter-html-webpack-plugin) as a drop-in replacement for the [html-webpack-plugin](https://www.npmjs.com/package/html-webpack-plugin). The `ghostwriter-html-webpack-plugin` imports and extends the `html-webpack-plugin` internally. You can use `ghostwriter-html-webpack-plugin` exactly like you would use `html-webpack-plugin`. The only difference in behavior is that `ghostwriter-html-webpack-plugin` adds the attribute `data-ghostwriter-keep` to the previously mentioned tags.

Below you will find a simple example setup:

```js
// ghostwriter-html-webpack-plugin is a drop-in
// replacement for html-webpack-plugin
var HtmlWebpackPlugin = require('ghostwriter-html-webpack-plugin');
var webpackConfig = {
  entry: 'index.js',
  output: {
    path: 'dist',
    filename: 'index_bundle.js'
  },
  plugins: [new HtmlWebpackPlugin()]
};
```

This will generate a file `dist/index.html` containing the following:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Webpack App</title>
  </head>
  <body>
    <script src="index_bundle.js" data-ghostwriter-keep></script>
  </body>
</html>
```

For further information, please see the [documentation of the html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin/blob/master/README.md).

### Advanced: rendering targets

Ghostwriter identifies a limited set of rendering targets to support fine-tuning of the pre-rendered result. This capability might be useful e.g. to iron-out specific incompatibilities between social networks and their required metadata. Please use this feature with care and do not use it for cloaking purposes.

Currently, Ghostwriter identifies the following rendering targets:

| Identifier | Target |
| :-- | :-- |
| `facebook` | Facebook crawler |
| `twitter` | Twitter crawler |
| `pinterest` | Pinterest crawler |
| `standard` | All other, e.g. regular browser, Google, ... |

You can retrieve the current rendering target via the `target` function of the `ghostwriter-apptool` module. Example:

```js
import * as ghostwriter from 'ghostwriter-apptool';
import React from 'react';
import DocumentMeta from 'react-document-meta';
...
<div className="some-page">
  <DocumentMeta
    meta={{ property:
      'article:author':
        ghostwriter.target() != 'pinterest'
          ? 'https://www.facebook.com/niklas.salmoukas'
          : 'Niklas Salmoukas'
    }}
    ...
  />
  ...
</div>
...
```

### Advanced: add style hints

Ghostwriter uses [PhantomJS](http://phantomjs.org/) internally to perform the pre-rendering of the pages. There are some edge cases which are not perfectly supported by PhantomJS. Most of these issues are ironed-out by Ghostwriter internally. Still, there is one issue left which might need your intervention.

In case you care about perfect pre-rendered pages, and you use modern `style` attributes in the DOM, which are not supported by PhantomJS, you need to add these styles to the `data-ghostwriter-style` attribute. Setting this attribute will ensure, the unsupported styles are still included in the pre-rendered page correctly.

**Example:** PhantomJS does not support the style `object-fit`. Therefore `<img src="..." style="border: 0; object-fit: cover;">` would result in `<img src="..." style="border: 0;">`. If you render `<img src="..." style="border: 0; object-fit: cover;" data-ghostwriter-style="object-fit: cover;">` instead, it will get translated to the expected `<img src="..." style="border: 0; object-fit: cover;">` in the pre-rendered code.

*Just to be clear:* In case you do not use these modern styles in the DOM or in case you do not care if the pre-rendered matches your dynamic application to the point, just leave it out.
