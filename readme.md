# Ghostwriter

Ghostwriter prerenders your JavaScript website for search engines, SEO tools, social media crawler and your browser.

| Module | Downloads | Version | License |
| :--- | :--- | :--- | :--- |
| `ghostwriter-middleware` | ![npm downloads total](https://img.shields.io/npm/dt/ghostwriter-middleware.svg) | ![npm version](https://img.shields.io/npm/v/ghostwriter-middleware.svg) | ![npm license](https://img.shields.io/npm/l/ghostwriter-middleware.svg) |
| `ghostwriter-apptool` | ![npm downloads total](https://img.shields.io/npm/dt/ghostwriter-apptool.svg) | ![npm version](https://img.shields.io/npm/v/ghostwriter-apptool.svg) | ![npm license](https://img.shields.io/npm/l/ghostwriter-apptool.svg) |
| `ghostwriter-html-webpack-plugin` | ![npm downloads total](https://img.shields.io/npm/dt/ghostwriter-html-webpack-plugin.svg) | ![npm version](https://img.shields.io/npm/v/ghostwriter-html-webpack-plugin.svg) | ![npm license](https://img.shields.io/npm/l/ghostwriter-html-webpack-plugin.svg) |
| `ghostwriter-service` | ![npm downloads total](https://img.shields.io/npm/dt/ghostwriter-service.svg) | ![npm version](https://img.shields.io/npm/v/ghostwriter-service.svg) | ![npm license](https://img.shields.io/npm/l/ghostwriter-service.svg) |
| `ghostwriter-common` | ![npm downloads total](https://img.shields.io/npm/dt/ghostwriter-common.svg) | ![npm version](https://img.shields.io/npm/v/ghostwriter-common.svg) | ![npm license](https://img.shields.io/npm/l/ghostwriter-common.svg) |

Ghostwriter is a replacement for the prerender.io service. In contrast to prerender.io, it does not limit serving of prerendered pages to a particular set of spiders. Quite the contrary, it serves prerendered pages to all clients and browsers. Therefore Ghostwriter should NOT be vulnerable to accidental cloaking.

This approach results in one simple requirement for your web application: it should not be scared about prerendered content in the DOM, e.g. it should be able to discard and re-render, or it should be able to reconcile the content. Usually, this is not an issue if your web application is structured correctly.

Here you will find a complete example web application based on React: https://github.com/core-process/ghostwriter-example

## Install

### Ghostwriter Service

The Ghostwriter service is provided as [Docker image](https://quay.io/repository/process_team/ghostwriter-service) and as [NPM package](https://www.npmjs.com/package/ghostwriter-service). Just pick whatever flavor you like best.

#### NPM package

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

This enables you to run the service via `npm`:

```
$ npm run ghostwriter-service
```

#### Docker image

Pull the latest `ghostwriter-service` image via:

```
$ docker pull quay.io/process_team/ghostwriter-service:latest
```

The Docker image requires the environment variable `DATABASE_URI` pointing to a valid MongoDB database and creates a service listening on port `8888`.

Create your Ghostwriter service with the following command:

```
$ docker run \
    -d \
    --name myghostwriter \
    -p 127.0.0.1:8887:8888 \
    --env DATABASE_URI=mongodb://database:27017/ghostwriter \
    quay.io/process_team/ghostwriter-service:latest
```

See the [Docker manual](https://docs.docker.com/engine/reference/commandline/run/) for more.

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

### Frontend

```js
...
// define sections which require render confirmation
import * as ghostwriter from 'ghostwriter-apptool';
ghostwriter.setup('newsticker', 'page');
...
```

```js
...
// confirm rendering of a section
import * as ghostwriter from 'ghostwriter-apptool';
export default class SomePage extends React.Component {
  componentDidMount() {
    ghostwriter.done('page');
  }
  render() {
    return (<div>...</div>);
  }
};
...
```
