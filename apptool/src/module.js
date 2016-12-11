import _ from 'underscore';
import serialize from './dom-serialize.js';

// detect if we are in ghostwriter sandbox
let _sandbox = navigator.userAgent.indexOf('Ghostwriter') !== -1;

export function sandbox() {
  return _sandbox;
}

// setup function
let _status = null;

export function setup(...tokens) {
  if(_status) {
    throw new Error('cannot call setup twice!');
  }
  _status = { };
  for(let token of tokens) {
    _status[token] = false;
  }
}

// done function
export function done(token) {
  if(!_status) {
    throw new Error('cannot call done before setup!');
  }
  if(typeof _status[token] === 'undefined') {
    throw new Error('token does not exist!');
  }
  _status[token] = true;
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
  // completed!
  return (_completed = true);
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
          window.___ghostwriterSource = serialize(document);
        }, 1000);
      }
    }, 5);
  })();
}
