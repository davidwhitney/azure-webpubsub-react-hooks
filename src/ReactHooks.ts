import { AzureWebPubSubClient } from "./AzureWebPubSubClient";

export type ChannelNameAndOptions = { channelName: string; }

let client: AzureWebPubSubClient;

export function provideSdkInstance(instance: AzureWebPubSubClient) {
    client = instance;
}

export async function configureWebPubSub(getClientAccessTokenUrl: string, hub: string = "default_hub") {
  if (client) {
    return client;
  }
  console.log("Creating");
  client = await AzureWebPubSubClient.fromClientAccessToken(getClientAccessTokenUrl, hub);
}

export function assertConfiguration(): AzureWebPubSubClient {
  if (!client) {
    throw new Error('WebPubSub not configured - please call configureWebPubSub(getClientAccessTokenUrl);');
  }

  return client;
}
