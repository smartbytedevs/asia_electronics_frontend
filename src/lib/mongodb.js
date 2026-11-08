import { MongoClient } from "mongodb";

const globalForTaqwa = globalThis;

const MONGO_OPTIONS = {
  appName: "asia-electronics-web",
  serverSelectionTimeoutMS:
    Number.parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS, 10) || 8000,
  connectTimeoutMS:
    Number.parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS, 10) || 10000,
  socketTimeoutMS:
    Number.parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS, 10) || 45000,
  waitQueueTimeoutMS:
    Number.parseInt(process.env.MONGODB_WAIT_QUEUE_TIMEOUT_MS, 10) || 10000,
  maxPoolSize: Number.parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) || 10,
  minPoolSize: Number.parseInt(process.env.MONGODB_MIN_POOL_SIZE, 10) || 0,
  maxIdleTimeMS:
    Number.parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS, 10) || 60000,
  retryReads: true,
  retryWrites: true,
};

function mongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (see .env.example) so Better Auth can persist users and sessions."
    );
  }
  return uri;
}

function isClientUnusable(client) {
  if (!client) {
    return true;
  }
  if (client.s?.hasBeenClosed === true) {
    return true;
  }
  return client.topology?.s?.state === "closed";
}

function createMongoClient(uri) {
  const client = new MongoClient(uri, MONGO_OPTIONS);
  client.__taqwaUri = uri;
  return client;
}

function getMongoClient() {
  const uri = mongoUri();
  const current = globalForTaqwa.__taqwaMongoClient;

  if (current && current.__taqwaUri === uri && !isClientUnusable(current)) {
    return current;
  }

  if (current && !isClientUnusable(current)) {
    current.close().catch(() => {});
  }

  const client = createMongoClient(uri);
  globalForTaqwa.__taqwaMongoClient = client;
  return client;
}

const dbProxy = new Proxy(
  {},
  {
    get(_target, property) {
      const db = getMongoClient().db();
      const value = db[property];
      return typeof value === "function" ? value.bind(db) : value;
    },
  }
);

const clientProxy = new Proxy(
  {},
  {
    get(_target, property) {
      const client = getMongoClient();
      const value = client[property];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
);

export function getBetterAuthMongoClient() {
  return clientProxy;
}

export function getBetterAuthDb() {
  return dbProxy;
}
