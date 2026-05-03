export type PersistenceTarget = "postgresql" | "memory";

export type RepositoryAdapterHealth = {
  adapter: PersistenceTarget;
  productionReady: boolean;
  status: "ready" | "unavailable";
};

export type PlatformRepositoryAdapter = {
  readonly target: PersistenceTarget;
  health(): RepositoryAdapterHealth;
};

export type PostgreSqlAdapterConfig = {
  connectionString: string;
};

export function createPostgreSqlAdapter(config: PostgreSqlAdapterConfig): PlatformRepositoryAdapter {
  if (!config.connectionString.trim()) {
    throw new Error("PostgreSQL connection string is required for the production persistence target.");
  }

  return {
    target: "postgresql",
    health() {
      return {
        adapter: "postgresql",
        productionReady: true,
        status: "ready"
      };
    }
  };
}

export function createInMemoryPersistenceAdapter(options: { environment: string }): PlatformRepositoryAdapter {
  if (options.environment === "production") {
    throw new Error("In-memory persistence is restricted to local and test boundaries.");
  }

  return {
    target: "memory",
    health() {
      return {
        adapter: "memory",
        productionReady: false,
        status: "ready"
      };
    }
  };
}
