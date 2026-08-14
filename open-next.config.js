import { defineMinifyConfig } from "@opennextjs/cloudflare";
/** @type {import('@opennextjs/aws/types/open-next.js').OpenNextConfig} */
const config = {
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

export default config;