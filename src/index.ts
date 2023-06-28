import { ExtendedClient } from "./structs/ExtendedClient"
export * from "colors";
import config from "./config.json";
import { connect } from "./services/database";

connect();

const client = new ExtendedClient();
client.start();

export { client, config }