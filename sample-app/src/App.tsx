import React, { useState } from "react";
import { IncomingMessageEnvelope } from "../../src/AzureWebPubSubClient";
import { configureWebPubSub, useGroup } from "../../src/index";
import "./App.css";

await configureWebPubSub("/api/get-client-access-token");

function App() {
  const [messages, updateMessages] = useState<any[]>([]);
  const [group, webPubSub] = useGroup("your-channel-name", (message: IncomingMessageEnvelope<string>) => {
    updateMessages((prev) => [...prev, message]);
  });

  const messagePreviews = messages.map((msg, index) => <li key={index}>{msg.data.text}</li>);

  return (
    <div className="App">
      <header className="App-header">Azure WebPubSub React Hooks Demo</header>
      <div>
        <button
          onClick={() => {
            group.send("test-message", { text: "message text" });
          }}
        >
          Send Message
        </button>
      </div>

      <h2>Messages</h2>
      <ul>{messagePreviews}</ul>
    </div>
  );
}

export default App;
