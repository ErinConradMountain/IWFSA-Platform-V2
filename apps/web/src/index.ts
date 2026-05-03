import { getServiceConfig } from "@iwfsa/common/runtime";
import { createWebServer } from "./server.ts";

const config = getServiceConfig("web", 3000);
const server = createWebServer(config);

server.listen(config.port, config.host, () => {
  process.stdout.write(`IWFSA V2 Web listening on http://${config.host}:${config.port}\n`);
});
