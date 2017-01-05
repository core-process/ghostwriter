
/**
 * Module dependencies.
 */

var voidElements = require('void-elements');
var xregexp = require('xregexp');

/**
 * Module exports.
 */

exports = module.exports = serialize;
exports.serializeElement = serializeElement;
exports.serializeAttribute = serializeAttribute;
exports.serializeText = serializeText;
exports.serializeComment = serializeComment;
exports.serializeDocument = serializeDocument;
exports.serializeDoctype = serializeDoctype;
exports.serializeDocumentFragment = serializeDocumentFragment;
exports.serializeNodeList = serializeNodeList;

/**
 * Serializes any DOM node. Returns a string.
 *
 * @param {Node} node - DOM Node to serialize
 * return {String}
 * @public
 */

function serialize (node) {
  if (!node) return '';
  if (!node.nodeType && 'number' === typeof node.length) {
    // assume it's a NodeList or Array of Nodes
    return exports.serializeNodeList(node);
  }
  switch (node.nodeType) {
    case 1 /* element */:
      return exports.serializeElement(node);
    case 2 /* attribute */:
      return exports.serializeAttribute(node);
    case 3 /* text */:
      return exports.serializeText(node);
    case 8 /* comment */:
      return exports.serializeComment(node);
    case 9 /* document */:
      return exports.serializeDocument(node);
    case 10 /* doctype */:
      return exports.serializeDoctype(node);
    case 11 /* document fragment */:
      return exports.serializeDocumentFragment(node);
  }
  return '';
}

/**
 * Serialize an Attribute node.
 */

function uriOrigin(uri) {
  uri = uri.split("/");
  return uri[0] + "//" + uri[2];
}

function serializeAttribute (node) {
  var name = node.name, value = node.value;
  if(name == 'data-ghostwriter-style') {
    return '';
  }
  if(name == 'style') {
    const gwStyle = node.ownerElement.getAttribute('data-ghostwriter-style');
    if(gwStyle) {
      value += ' ' + gwStyle;
    }
    var base = uriOrigin(node.ownerDocument.documentURI);
    value = value.replace(
      new RegExp('url\\('+xregexp.escape(base)+'(.*?)\\)', 'g'),
      'url($1)'
    );
  }
  return node.name + '="' + value
    .replace(/&/g, "&amp;")
    .replace(/>/g, "&gt;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    + '"';
}

/**
 * Serialize a DOM element.
 */

function serializeElement (node) {
  var c, i, l;
  var name = node.nodeName.toLowerCase();
  var v = voidElements[name] && node.childNodes.length == 0;

  // opening tag
  var r = '<' + name;

  // attributes
  for (i = 0, c = node.attributes, l = c.length; i < l; i++) {
    r += ' ' + exports.serializeAttribute(c[i]);
  }

  r += '>';

  // child nodes
  if(node.childNodes.length > 0) {
    r += exports.serializeNodeList(node.childNodes, null);
  }

  // closing tag, only for non-void elements
  if (!v) {
    r += '</' + name + '>';
  }

  return r;
}

/**
 * Serialize a text node.
 */

function serializeText (node) {
  return node.nodeValue
    .replace(/&/g, "&amp;")
    .replace(/>/g, "&gt;")
    .replace(/</g, "&lt;");
}

/**
 * Serialize a comment node.
 */

function serializeComment (node) {
  return '<!--' + node.nodeValue + '-->';
}

/**
 * Serialize a Document node.
 */

function serializeDocument (node) {
  return exports.serializeNodeList(node.childNodes, null);
}

/**
 * Serialize a DOCTYPE node.
 * See: http://stackoverflow.com/a/10162353
 */

function serializeDoctype (node) {
  var r = '<!DOCTYPE ' + node.name;

  if (node.publicId) {
    r += ' PUBLIC "' + node.publicId + '"';
  }

  if (!node.publicId && node.systemId) {
    r += ' SYSTEM';
  }

  if (node.systemId) {
    r += ' "' + node.systemId + '"';
  }

  r += '>';
  return r;
}

/**
 * Serialize a DocumentFragment instance.
 */

function serializeDocumentFragment (node) {
  return exports.serializeNodeList(node.childNodes, null);
}

/**
 * Serialize a NodeList/Array of nodes.
 */

function serializeNodeList (list) {
  var r = '';
  for (var i = 0, l = list.length; i < l; i++) {
    r += serialize(list[i]);
  }
  return r;
}
