export default {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: async () => ({
        get: async () => null,
        set: async () => {},
        delete: async () => {},
      }),
      tagCache: async () => ({
        getByPath: async () => [],
        getByTag: async () => [],
        writeTags: async () => {},
      }),
      queue: "dummy",
    },
  },
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: async () => ({
        get: async () => null,
        set: async () => {},
        delete: async () => {},
      }),
      tagCache: async () => ({
        getByPath: async () => [],
        getByTag: async () => [],
        writeTags: async () => {},
      }),
      queue: "dummy",
    },
  },
};