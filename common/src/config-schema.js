const CONFIG_SCHEMA = {
  type: 'object',
  properties: {
    version: { type: 'string' },
    refreshCycle: { type: 'integer', minimum: 0 },
    sandbox: {
      type: 'object',
      properties: {
        viewportWidth: { type: 'integer', minimum: 0 },
        viewportHeight: { type: 'integer', minimum: 0 },
        completionTimeout: { type: 'integer', minimum: 0 },
      }
    },
    sitemaps: {
      type: 'array',
      items: { type: 'string' },
    },
    baseUrl: { type: 'string' },
  }
};

export { CONFIG_SCHEMA as default };
