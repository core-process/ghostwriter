import _ from 'underscore';
import serialize from './dom-serialize.js';

// detect if we are in ghostwriter sandbox
let _sandbox = navigator.userAgent.indexOf('Ghostwriter') !== -1;

export function sandbox() {
  return _sandbox;
}

// request tracking
const ACTIVITY_TIMEOUT = 1 * 1000;

const now = (performance && performance.now)
  ? () => performance.now()
  : () => Date.now();

let tracking = {
  pending: 0,
  activity: now()
};

const XMLHttpRequest_open = XMLHttpRequest.prototype.open;

XMLHttpRequest.prototype.open = function (method, url, async_, user, pass) {
  tracking.pending++;
  tracking.activity = now();
  this.addEventListener("readystatechange", function () {
      if(this.readyState == 4) {
        tracking.pending--;
        tracking.activity = now();
      }
    }, false);
  XMLHttpRequest_open.call(this, method, url, async_, user, pass);
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
  // check if there are no pending requests
  if(  !ready
    || tracking.pending > 0
    || (now() - tracking.activity) < ACTIVITY_TIMEOUT
  ) {
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
        window.___ghostwriterSource = serialize(document);
      }
    }, 5);
  })();
}
