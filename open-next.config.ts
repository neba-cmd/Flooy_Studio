export default {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
    },
  },
  build: {
    esbuild: {
      loader: {
        ".woff2": "file",
        ".woff": "file",
        ".ttf": "file",
        ".eot": "file",
      },
    },
  },
};