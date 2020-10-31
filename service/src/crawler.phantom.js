import webpage from 'webpage';
import fs from 'fs';
import system from 'system';
import base64 from 'base-64';

async function crawler(url, target, contentPath, viewportWidth, viewportHeight, completionTimeout) {
  // create page
  const page = webpage.create();
  let httpCode = null;
  page.onResourceRequested = function(requestData, request) {
    console.info('resource requested:', requestData['url']);
  };
  page.onResourceReceived = function(response) {
    if(response.url == url && response.stage == 'end') {
      httpCode = response.status;
    }
  };
  page.onError = function(msg, trace) {
    console.error('error:', msg);
  };
  page.onResourceError = function(error) {
    console.error('resource error:', JSON.stringify(error));
  };
  // trigger page load
  console.log('loading url...');
  page.settings.userAgent = 'Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/538.1 (KHTML, like Gecko) PhantomJS/2.1.1 Safari/538.1 Ghostwriter/1.0 (+https://github.com/coreprocess/ghostwriter; target '+base64.encode(target)+')';
  page.viewportSize = { width: viewportWidth, height: viewportHeight };
  await new Promise((resolve, reject) => {
    page.open(url, (status) => {
      if(status === 'success') {
        if(httpCode == 200) {
          resolve();
        }
        else {
          reject(new Error('http status code '+httpCode));
        }
      }
      else
        reject(new Error('network error'));
    });
  });
  // wait for complete state
  console.log('waiting for completion...');
  const firstCheck = Date.now();
  const result = await new Promise((resolve, reject) => {
    function checkReadyState() {
      setTimeout(function () {
        const source = page.evaluateJavaScript(`function () {
          return typeof window.___ghostwriterSource != 'undefined'
            ? window.___ghostwriterSource
            : '';
        }`);
        const code = page.evaluateJavaScript(`function () {
          return typeof window.___ghostwriterCode != 'undefined'
            ? ''+window.___ghostwriterCode
            : '';
        }`);
        if(source.length > 0 && code.length > 0) {
          resolve({ source, status: parseInt(code) });
        } else {
          if((Date.now() - firstCheck) > completionTimeout) {
            reject(new Error('timeout while waiting for completion'));
          }
          else {
            checkReadyState();
          }
        }
      }, 5);
    }
    checkReadyState();
  });
  // write data to target paths
  console.log('writing result to file...');
  fs.write(contentPath, JSON.stringify(result), { charset: 'utf8' });
};

if(system.args.length != 7) {
  console.error('usage: <program> <url> <target> <contentPath> <viewportWidth> <viewportHeight> <completionTimeout>');
  phantom.exit(1);
}
else {
  crawler(
    system.args[1],
    system.args[2],
    system.args[3],
    parseInt(system.args[4]),
    parseInt(system.args[5]),
    parseInt(system.args[6])
  )
    .then(() => {
      phantom.exit(0);
    })
    .catch((error) => {
      console.error('an error occured', error);
      phantom.exit(2);
    });
}
