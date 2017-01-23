const CONFIG_SCHEMA = {
  type: 'object',
  properties: {
    version: { type: 'string' }, // version string, e.g. git commit id
    refreshCycle: { type: 'number', minimum: 0 }, // hours
    sandbox: {
      type: 'object',
      properties: {
        viewportWidth: { type: 'integer', minimum: 0 }, // pixels
        viewportHeight: { type: 'integer', minimum: 0 }, // pixels
        completionTimeout: { type: 'number', minimum: 0 }, // seconds
      }
    },
    sitemaps: {
      type: 'array',
      items: { type: 'string' }, // url path, e.g. '/sitemap.xml'
    },
    targets: {
      type: 'array',
      items: { type: 'string' }, // target identifier, e.g. 'facebook'
    },
    appUrl: { type: 'string' }, // url
  }
};

export { CONFIG_SCHEMA as default };
