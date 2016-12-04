import _ from 'underscore';
import request from 'request-promise';
import querystring from 'querystring';

export default function(config) {
  // strip token, urlTest and serviceUrl from configuration
  let
    token = config.token,
    urlTest = config.urlTest,
    serviceUrl = config.serviceUrl;
  config = _.omit(config, 'token', 'urlTest', 'serviceUrl');
  // verify serviceUrl
  if(typeof serviceUrl != 'string') {
    throw new Error('serviceUrl is invalid');
  }
  // convert urlTest to function
  if(typeof urlTest === 'function') {
    urlTest = urlTest;
  }
  else if(urlTest instanceof RegExp) {
    const regExp = urlTest;
    urlTest = (reqUrl) => regExp.test(reqUrl);
  }
  else if(urlTest instanceof Array) {
    const urls = urlTest;
    for(let url of urls) {
      if(!(url instanceof RegExp) && !(typeof url == 'string')) {
        throw new Error('invalid urlTest');
      }
    }
    urlTest = (reqUrl) => {
      for(let url of urls) {
        if(url instanceof RegExp) {
          if(url.test(reqUrl)) {
            return true;
          }
        }
        else {
          if(url == reqUrl) {
            return true;
          }
        }
      }
      return false;
    }
  }
  else {
    throw new Error('invalid urlTest');
  }
  // retrievePage function
  let configApplied = false;
  async function retrievePage(url) {
    // apply config if not done already
    if(!configApplied) {
      await request({
        simple: true,
        method: 'POST',
        uri: serviceUrl + '/configure?' + querystring.stringify({ token }),
        body: config,
        json: true,
      });
      configApplied = true;
    }
    // retrieve page
    return JSON.parse(await request({
      simple: true,
      method: 'GET',
      uri: serviceUrl + '/retrieve-page?' + querystring.stringify({
        token,
        pageUrl: url
      }),
    }));
  }
  // return configured middleware
  return function(request, response, next) {
    // detect if one of the configured url matches
    if(!urlTest(request.url)) {
      next(); // bail out if we do not care about this url
      return;
    }
    // bail out if user does not want to use ghostwriter
    if(typeof request.query.___disableGhostwriter != 'undefined'
      && JSON.parse(request.query.___disableGhostwriter)
    ) {
      next();
      return;
    }
    // detect sandbox mode
    const userAgent = request.get('user-agent') || '';
    const sandbox = userAgent.indexOf('+https://github.com/core-process/ghostwriter') !== -1;
    if(sandbox) {
      next(); // bail out of we are in the sandbox
      return;
    }
    // lets do our magic
    retrievePage(request.url)
      .then((page) => {
        response.set('Content-Type', 'text/html; charset=utf-8');
        response
          .status(200)
          .send(page.content);
      })
      .catch((error) => {
        console.error('ghostwriter:', 'load failed!', error.message || 'unknown error');
        next(); // fallback to default
      });
  }
}
