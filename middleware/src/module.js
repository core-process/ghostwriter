import _ from 'underscore';
import request from 'request-promise';
import querystring from 'querystring';
import { validate } from 'jsonschema';

import CONFIG_SCHEMA from 'ghostwriter-common/build/config-schema.js';

export default function(config) {
  // strip token, urlTest and gwUrl from configuration
  let
    token = config.token,
    urlTest = config.urlTest,
    gwUrl = config.gwUrl,
    fallbackOnError = !!config.fallbackOnError;
  config = _.omit(config, 'token', 'urlTest', 'gwUrl', 'fallbackOnError');
  // verify gwUrl
  if(typeof gwUrl != 'string') {
    throw new Error('gwUrl is invalid');
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
  // verify configuration
  if(!validate(config, CONFIG_SCHEMA).valid) {
    throw new Error('invalid configuration');
  }
  // retrievePage function
  let configApplied = false;
  async function retrievePage(url, target) {
    // apply config if not done already
    if(!configApplied) {
      await request({
        simple: true,
        method: 'POST',
        uri: gwUrl + '/configure?' + querystring.stringify({ token }),
        body: config,
        json: true,
      });
      configApplied = true;
    }
    // retrieve page
    return JSON.parse(await request({
      simple: true,
      method: 'GET',
      uri: gwUrl + '/retrieve-page?' + querystring.stringify({
        token,
        pageUrl: url,
        target
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
    // detect target
    let target = 'standard';
    if(userAgent.indexOf('facebookexternalhit') !== -1 || userAgent.indexOf('Facebot') !== -1) {
      target = 'facebook';
    }
    else
    if(userAgent.indexOf('Twitterbot') !== -1) {
      target = 'twitter';
    }
    else
    if(userAgent.indexOf('Pinterest') !== -1) {
      target = 'pinterest';
    }
    // lets do our magic
    retrievePage(request.url, target)
      .then((page) => {
        response.set('Content-Type', 'text/html; charset=utf-8');
        response
          .status(page.status)
          .send(page.content);
      })
      .catch((error) => {
        console.error('ghostwriter:', 'load failed!', error.message || 'unknown error');
        // fallback to default
        if(fallbackOnError) {
          next();
        }
        // report
        else {
          response.set('Content-Type', 'text/html; charset=utf-8');
          response
            .status(500)
            .send('Ghostwriter service failed!');
        }
      });
  }
}
