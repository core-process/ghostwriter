var HtmlWebpackPlugin = require('html-webpack-plugin');

const createHtmlTag = HtmlWebpackPlugin.prototype.createHtmlTag;

HtmlWebpackPlugin.prototype.createHtmlTag = function(definition) {
  if(  definition.tagName == 'script'
    && definition.attributes
    && definition.attributes['type'] == 'text/javascript'
  ) {
    definition = clone(definition);
    definition.attributes['data-ghostwriter-keep'] = true;
  }
  if(  definition.tagName == 'link'
    && definition.attributes
    && definition.attributes['rel'] == 'stylesheet'
  ) {
    definition = clone(definition);
    definition.attributes['data-ghostwriter-keep'] = true;
  }
  if(  definition.tagName == 'style'
    && definition.attributes
    && definition.attributes['type'] == 'text/css'
  ) {
    definition = clone(definition);
    definition.attributes['data-ghostwriter-keep'] = true;
  }
  return createHtmlTag(definition);
};

module.exports = HtmlWebpackPlugin;
