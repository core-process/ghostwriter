const DEFAULT_CONFIG = {
  include: () => false,
  sandbox: {
    viewportWidth: 1280,
    viewportHeight: 800,
    completionTimeout: 30 * 1000
  }
};

export default function(config) {
  // return configured middleware
  return function(request, response, next) {
    // detect if one of the configured url matches
    let urlMatches = false;
    if(typeof config.include === 'function') {
      urlMatches = config.include(request.url);
    }
    else if(config.include instanceof RegExp) {
      urlMatches = url.test(request.url);
    }
    else if(config.include instanceof Array) {
      for(let url of config.include) {
        if(url instanceof RegExp) {
          urlMatches = url.test(request.url);
        }
        else if(typeof url === 'string') {
          urlMatches = (url == request.url);
        }
        else {
          console.error('ghostwriter:', 'invalid url configuration!', url);
        }
        if(urlMatches) {
          break;
        }
      }
    }
    if(!urlMatches) {
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
    //console.log('userAgent=', userAgent);
    const sandbox = userAgent.indexOf('Ghostwriter') !== -1;
    if(sandbox) {
      next(); // bail out of we are in the sandbox
      return;
    }
    // lets do our magic
    load(request.url)
      .then(({content}) => {
        response.set('Content-Type', 'text/html; charset=utf-8');
        response.status(200).send(content);
      })
      .catch((error) => {
        console.error('ghostwriter:', 'load failed!', error);
        next(); // fallback to default
      });
  }
}
