import * as dotenv from "dotenv";
import { Context, HttpRequest } from "@azure/functions";
import { WebPubSubServiceClient } from "@azure/web-pubsub";

dotenv.config();

export async function run(context: Context, req: HttpRequest): Promise<void> {

    if (!process.env.AZURE_WEBPUBSUB_CONNECTION_STRING) {
        context.res = {
          status: 500, 
          body: JSON.stringify(`Missing AZURE_WEBPUBSUB_CONNECTION_STRING environment variable.
          If you're running locally, please ensure you have a ./api/.env file with a value for AZURE_WEBPUBSUB_CONNECTION_STRING=your-key.
          If you're running in Azure, make sure you've configured the AppSettings AZURE_WEBPUBSUB_CONNECTION_STRING. 
          Please see README.md for more details on configuring your API Key.`)
        }
        console.log(context.res.body);
        return;
    }

    const clientId = req.query.clientId || generateClientId();
    const hub = req.query.hub || "default_hub";
      
    const service = new WebPubSubServiceClient(process.env.AZURE_WEBPUBSUB_CONNECTION_STRING, hub);
    const token = await service.getClientAccessToken({ 
      userId: clientId,
      roles: ["webpubsub.joinLeaveGroup", "webpubsub.sendToGroup"]
    });

    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(token)
    };
}

function generateClientId(): string {  
  const clientId = "cid-" + Math.random().toString(36).substr(2, 9);
  return clientId;
}

