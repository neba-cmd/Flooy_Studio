import type { OpenNextConfig } from "@opennextjs/aws/types/open-next";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: true,
    },
  },
  buildOptions: {
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