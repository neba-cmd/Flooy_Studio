import { defineMinifyConfig } from "@opennextjs/cloudflare";

export default {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: true,
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