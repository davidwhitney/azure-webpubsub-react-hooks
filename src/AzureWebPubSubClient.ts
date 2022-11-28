export class AzureWebPubSubClient {
  private _ws: ManagedWebSocket;
  private _groups = new Map<string, GroupClient>();

  constructor(socket: WebSocket) {
    this._ws = new ManagedWebSocket(socket);
  }

  public static async fromClientAccessToken(getClientAccessTokenUrl: string, hub: string): Promise<AzureWebPubSubClient> {
    const ws = await AzureWebPubSubClient.authenticate(getClientAccessTokenUrl, hub);
    return new AzureWebPubSubClient(ws);
  }

  public get state(): string {
    return this._ws.getWebSocketState();
  }

  public groups = {
    get: (groupName: string) => {
      if (!this._groups.has(groupName)) {
        this._groups.set(groupName, new GroupClient(this._ws, groupName));
      }

      return this._groups.get(groupName)!;
    }
  };

  protected static async authenticate(getClientAccessTokenUrl: string, hub: string): Promise<WebSocket> {
    const response = await fetch(getClientAccessTokenUrl + "?hub=" + hub);
    const { token, url, baseUrl } = await response.json();
    return new WebSocket(url, 'json.webpubsub.azure.v1');
  }

}

export class GroupClient {
  private _ws: ManagedWebSocket;
  private _groupName: string;

  public listeners: MessageRegistration[];

  constructor(ws: ManagedWebSocket, groupName: string) {
    this._ws = ws;
    this._groupName = groupName;
    this.listeners = [];

    this.attach();
  }

  public async send<TMessageType>(name: string, message: TMessageType): Promise<void> {
      const payload: MessageEnvelope<TMessageType> = { name: name, data: message };

      this._ws.send(JSON.stringify({
        type: "sendToGroup",
        group: this._groupName,
        data: JSON.stringify(payload)
      }));
  }

  public async subscribe(callback: <T = any>(message: IncomingMessageEnvelope<T>) => void): Promise<void> {
    const defaultFilter = (message) => { return message.group === this._groupName; };
    const subscription = { filter: defaultFilter, handler: callback };
    this.listeners.push(subscription);

    this._ws.dispatcher.addMessageHandler(subscription);
  }

  public async unsubscribe(callback: <T = any>(message: IncomingMessageEnvelope<T>) => void): Promise<void> {
    this._ws.dispatcher.removeMessageHandler(callback);

    const index = this.listeners.findIndex((listener) => listener.handler === callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  public async attach(): Promise<void> {
    this._ws.send(JSON.stringify({
      type: 'joinGroup',
      group: this._groupName,
    }));
  }

  public async detach(): Promise<void> {    
    this._ws.send(JSON.stringify({
      type: 'leaveGroup',
      group: this._groupName,
    }));
  }
}

class ManagedWebSocket {
  public dispatcher: MessageRecievedDispatcher;

  constructor(public connection: WebSocket) {
    this.dispatcher = new MessageRecievedDispatcher()
    this.connection.onopen = () => {
      console.debug("ManagedWebSocket: Connection Opened");
    };

    this.connection.onmessage = (e) => this.onMessageReceived(e);
  }

  public async send(data: string | ArrayBufferLike | Blob | ArrayBufferView): Promise<void> {
    await this.ensureConnected();
    this.connection.send(data);
  }

  private onMessageReceived(event: MessageEvent<any>) {  
    console.debug("ManagedWebSocket: Message Received", event.data);

    const message = JSON.parse(event.data);
    
    if (message.data) {
      const unpackedPayload = JSON.parse(message.data);
      message.name = unpackedPayload?.name;
      message.data = unpackedPayload?.data;
    }

    if (isIncomingMessageEnvelope(message)) {
      this.dispatcher.dispatch(message);
    }

  }
  
  public async ensureConnected() {
    if (this.getWebSocketState() !== "OPEN") {
      await this.waitForConnection();
    }
  }
  
  public async waitForConnection() {    
      return new Promise((resolve, reject) => {
          const interval = setInterval(() => {
  
          const state = this.getWebSocketState();
  
          if (state === "OPEN") {
              clearInterval(interval);
              resolve(true);
          }
          }, 100);
      });
  }
  
  public getWebSocketState() {
    switch (this.connection.readyState) {
      case 0:
        return "CONNECTING";
      case 1:
        return "OPEN";
      case 2:
        return "CLOSING";
      case 3:
        return "CLOSED";
      default:
        return "UNKNOWN";
    }
  }
}

export interface MessageRegistration { 
  handler: <T = any>(message: IncomingMessageEnvelope<T>) => void;
  filter: <T = any>(message: IncomingMessageEnvelope<T>) => boolean;
}

export interface MessageEnvelope<T> {
  name: string;
  data: T;
}

export interface IncomingMessageEnvelope<T> extends MessageEnvelope<T>, MessageEvent<T> {
  data: T;
  from: string;
  group: string;
  type: string;
}

function isIncomingMessageEnvelope<T = any>(message: any): message is IncomingMessageEnvelope<T> {
  return message.name !== undefined && message.data !== undefined;
}

class MessageRecievedDispatcher {
  private _messageHandlers: MessageRegistration[] = [];

  public addMessageHandler(callback: MessageRegistration) {
    this._messageHandlers.push(callback);
  }

  public removeMessageHandler(callback: (message: any) => void) {
    this._messageHandlers = this._messageHandlers.filter((handler) => handler.handler !== callback);
  }

  public dispatch<T = any>(message: IncomingMessageEnvelope<T>) {
    const validHandlers = this._messageHandlers.filter((handler) => handler.filter(message));
    validHandlers.forEach((handler) => handler.handler(message));
  }
}
