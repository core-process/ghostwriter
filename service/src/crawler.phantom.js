import webpage from 'webpage';
import fs from 'fs';
import system from 'system';

async function crawler(url, contentPath, viewportWidth, viewportHeight, completionTimeout) {
  // create page
  const page = webpage.create();
  let httpCode = null;
  page.onResourceRequested = function(requestData, request) {
    console.info('onResourceRequested', requestData['url']);
  };
  page.onResourceReceived = function(response) {
    if(response.url == url && response.stage == 'end') {
      httpCode = response.status;
    }
  };
  page.onError = function(msg, trace) {
    console.error('onError', msg);
  };
  page.onResourceError = function(error) {
    console.error('onResourceError', JSON.stringify(error));
  };
  // trigger page load
  console.log('loading url...');
  page.settings.userAgent = 'Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/538.1 (KHTML, like Gecko) PhantomJS/2.1.1 Safari/538.1 Ghostwriter (+https://github.com/core-process/ghostwriter)';
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
  const source = await new Promise((resolve, reject) => {
    function checkReadyState() {
      setTimeout(function () {
        const source = page.evaluateJavaScript(`function () {
          return typeof window.___ghostwriterSource != 'undefined'
            ? window.___ghostwriterSource
            : '';
        }`);
        if(source.length > 0) {
          resolve(source);
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
  fs.write(contentPath, source, { charset: 'utf8' });
};

if(system.args.length != 6) {
  console.error('usage: <program> <url> <contentPath> <viewportWidth> <viewportHeight> <completionTimeout>');
  phantom.exit(1);
}
else {
  crawler(
    system.args[1],
    system.args[2],
    parseInt(system.args[3]),
    parseInt(system.args[4]),
    parseInt(system.args[5])
  )
    .then(() => {
      phantom.exit(0);
    })
    .catch((error) => {
      console.error('an error occured', error);
      phantom.exit(2);
    });
}
