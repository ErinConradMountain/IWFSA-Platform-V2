import { createInMemoryAuditRepository } from "@iwfsa/common/audit";
import { createInMemoryPersistenceAdapter, createPostgreSqlAdapter } from "@iwfsa/common/persistence";
import { createInMemoryRepositories } from "@iwfsa/common/repositories";
import { getServiceConfig } from "@iwfsa/common/runtime";
import { createInMemorySessionRepository } from "@iwfsa/common/session-repository";
import { createApiServer } from "./server.ts";

const config = getServiceConfig("api", 4000);
const sessionRepository = createInMemorySessionRepository({ ttlMs: config.sessionTtlMs });
const auditRepository = createInMemoryAuditRepository();
const repositories = createInMemoryRepositories();
const persistenceAdapter =
  config.persistenceTarget === "postgresql"
    ? createPostgreSqlAdapter({ connectionString: process.env.DATABASE_URL || "" })
    : createInMemoryPersistenceAdapter({ environment: config.environment });
const server = createApiServer(config, { sessionRepository, persistenceAdapter, auditRepository, repositories });

server.listen(config.port, config.host, () => {
  process.stdout.write(`IWFSA V2 API listening on http://${config.host}:${config.port}\n`);
});
