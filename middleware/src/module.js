import _ from 'underscore';
import request from 'request-promise';
import querystring from 'querystring';
import { validate } from 'jsonschema';
import detectBrowser from 'detect-browser/lib/detectBrowser.js';

import CONFIG_SCHEMA from 'ghostwriter-common/build/config-schema.js';

export default function(config) {
  // strip token, urlTest and gwUrl from configuration
  let
    token = config.token,
    urlTest = config.urlTest,
    gwUrl = config.gwUrl,
    retriesOnError =
      (typeof config.retriesOnError !== 'undefined'
        ? config.retriesOnError
        : 3
      ),
    firstRequest = true;
  config = _.omit(
    config,
    'token', 'urlTest', 'gwUrl',
    'retriesOnError'
  );
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
  async function retrievePage(url, target, allowEmpty) {
    // try loop
    let lastError = new Error('unknown');
    for(let i = 0; i < (retriesOnError + 1); ++i) {
      // wait a bit on second and third try
      if(i > 0) {
        console.log('ghostwriter: repeated try to retrieve page', url, target);
        await new Promise((resolve) => {
          setTimeout(resolve, 3 * 1000); // wait 3 seconds
        });
      }
      // transfer config upfront if this is the first request
      if(firstRequest) {
        console.log('ghostwriter: send our configuration to the service');
        try {
          await request({
            simple: true,
            method: 'POST',
            uri: gwUrl + '/configure?' + querystring.stringify({ token }),
            body: config,
            json: true,
          });
          --i;
          firstRequest = false;
          continue; // try again
        }
        catch(error) {
          console.log('ghostwriter: could not configure - ', url, target, error.message || 'unknown error');
          lastError = error;
          continue; // try again
        }
      }
      // try to retrieve page
      let response = null;
      try {
        response = await request({
          simple: false,
          resolveWithFullResponse: true,
          method: 'GET',
          uri: gwUrl + '/retrieve-page?' + querystring.stringify({
            token,
            pageUrl: url,
            target,
            allowEmpty: allowEmpty ? 'yes' : 'no',
          }),
        });
      }
      catch(error) {
        console.log('ghostwriter: could not retrieve page - ', url, target, error.message || 'unknown error');
        lastError = error;
        continue; // try again
      }
      // re-apply config if service lost previous configuration (e.g. database reset)
      if(response.statusCode == 401) {
        console.log('ghostwriter: service lost our configuration, re-applying!');
        firstRequest = true;
        --i;
        continue; // try again
      }
      // handle 204 code
      if(response.statusCode == 204) {
        return null;
      }
      // handle non 200 codes
      if(response.statusCode != 200) {
        console.log('ghostwriter: could not retrieve page - ', url, target, 'status code != 200');
        lastError = new Error('status code != 200');
        continue; // try again
      }
      // parse and return page
      try {
        return JSON.parse(response.body);
      }
      catch(error) {
        console.log('ghostwriter: could not retrieve page - ', url, target, error.message || 'unknown error');
        lastError = error;
        continue; // try again
      }
    }
    // throw last error
    throw lastError;
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
    // figure out if we allow an empty response from the service.
    // we will allow an empty response for typical real user agents
    // to speedup delivery of the webpage in case it is currently not cached.
    let allowEmpty = !!detectBrowser(userAgent);
    // lets do our magic
    retrievePage(request.url, target, allowEmpty)
      .then((page) => {
        if(!page) {
          response.set('X-Ghostwriter-Status', '204 Page Currently Not Cached');
          next();
        }
        else {
          response.set('X-Ghostwriter-Status', '200 OK');
          response.set('Content-Type', 'text/html; charset=utf-8');
          response
            .status(page.status)
            .send(page.content);
        }
      })
      .catch((error) => {
        console.error('ghostwriter:', 'load failed!', error.message || 'unknown error');
        response.set('X-Ghostwriter-Status', '500 Error Occurred');
        next();
      });
  }
}
