import _ from 'underscore';
import serialize from './dom-serialize.js';

// detect if we are in ghostwriter sandbox
let _sandbox = navigator.userAgent.indexOf('+https://github.com/coreprocess/ghostwriter') !== -1;

export function sandbox() {
  return _sandbox;
}

// detect taret if we are in ghostwriter sandbox
let _target = 'standard';

if(_sandbox) {
  let t = navigator.userAgent.match(/Ghostwriter\/[^(]*\(.*target\s([^\s;)]*)/);
  if(t) {
    _target = atob(t[1]);
  }
}

export function target() {
  return _target;
}

// setup function
let _status = null;
let _flushMethod = null;

export function setup(...tokens) {
  if(_status) {
    throw new Error('cannot call setup twice!');
  }
  if(tokens.length == 0) {
    throw new Error('please provide at least one token or flush method!');
  }
  if(typeof tokens[tokens.length-1] === 'function') {
    _flushMethod = tokens.pop();
  }
  _status = { };
  for(let token of tokens) {
    _status[token] = false;
  }
}

// done function
let _code = 200;

export function done(token, code = 200) {
  if(!_status) {
    throw new Error('cannot call done before setup!');
  }
  if(typeof _status[token] === 'undefined') {
    throw new Error('token does not exist!');
  }
  _status[token] = true;
  if(code > _code) {
    _code = code;
  }
}

// completed function
let _completed = false;

export function completed() {
  // if _status is undefined, setup is still missing
  if(!_status) {
    return false;
  }
  // once it is done, its done
  if(_completed) {
    return true;
  }
  // check if all tokens are done
  const ready = _.filter(
    _.keys(_status),
    (token) => !_status[token]
  ).length == 0;
  if(!ready) {
    return false;
  }
  // check if all images are loaded
  for(let img of document.getElementsByTagName('img')) {
    if(!img.complete) {
      return false;
    }
  }
  // run flush routine if defined
  if(_flushMethod) {
    if(!_flushMethod()) {
      return false;
    }
  }
  // completed!
  return (_completed = true);
}

// code function
export function code() {
  return _code;
}

// update global completion state if we are in a sandbox
if(sandbox()) {
  (function check() {
    setTimeout(() => {
      if(!completed()) {
        check();
      }
      else {
        setTimeout(() => {
          window.___ghostwriterCode = code();
          window.___ghostwriterSource = serialize(document);
        }, 1000);
      }
    }, 5);
  })();
}
