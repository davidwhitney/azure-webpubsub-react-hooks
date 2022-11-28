# Azure WebPubSub React Hooks

Use Azure WebPubSub in your React application using idiomatic, easy to use, React Hooks!

Using this package you can:

- Interact with Azure WebPubSub groups using a react hook.
- Send messages via Azure WebPubSub using the group instances the hooks provide
- Get notifications of user presence on groups

The hooks provide a simplified syntax for interacting with Azure WebPubSub, and manage the lifecycle of the Azure WebPubSub SDK instances for you taking care to subscribe and unsubscribe to groups and events when your react components re-render.

---

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=false} -->
<!-- code_chunk_output -->

- [Installation](#installation)
  - [Compatible React Versions](#compatible-react-versions)
  - [Azure WebPubSub groups and API keys](#azure-webpubsub-groups-and-api-keys)
- [Usage](#usage)
- [Developer Notes](#developer-notes)

<!-- /code_chunk_output -->
---

## Installation

The hooks ship as an ES6 module, so you can use the `import` syntax in your react code.

```bash
npm install --save azure-webpubsub-react-hooks
```

This works out of the box using `create-react-app` - and you can use the package immediately.

### Compatible React Versions

The latest version of this package tracks the latest version of react.

| React Version | azure-webpubsub-react-hooks Version |
|----------|--------|
| >=17.0.2 |  1.1.8 |
| >=18.1.0 |  2.0.x (current) |

### Azure WebPubSub groups and API keys

- Get Endpoint Connection String from Azure Portal

---

## Usage

Once you've added the package using `npm` to your project, you can use the hooks in your `react` code.

Start by adding a reference to the hooks

```javascript
import { configureAzure WebPubSub, useGroup } from "azure-webpubsub-react-hooks";
```

Then you need to use the `configureWebPubSub` function to create an instance of the `Azure WebPubSub` JavaScript SDK.

```javascript
configureWebPubSub("/your-get-client-access-token-url");
```

Once you've done this, you can use the `hooks` in your code. The simplest example is as follows:

```javascript
const [group] = useGroup("your-group-name", (message) => {
    console.log(message);
});
```

Every time a message is sent to `your-group-name` it'll be logged to the console. You can do whatever you need to with those messages.

---

### useGroup

The useGroup hook lets you subscribe to a group and receive messages from it.

```javascript
const [group, Azure WebPubSub] = useGroup("your-group-name", (message) => {
    console.log(message);
});
```

**Both the group instance, and the Azure WebPubSub JavaScript SDK instance are returned from the useGroup call.**

`useGroup` really shines when combined with a regular react `useState` hook - for example, you could keep a list of messages in your app state, and use the `useGroup` hook to subscribe to a group, and update the state when new messages arrive.

```javascript
const [messages, updateMessages] = useState([]);
const [group] = useGroup("your-group-name", (message) => {
    updateMessages((prev) => [...prev, message]);
});

// Convert the messages to list items to render in a react component
const messagePreviews = messages.map((msg, index) => <li key={index}>{msg.data.someProperty}</li>);
```

`useGroup` supports all of the parameter combinations of a regular call to `group.subscribe`, so you can filter the messages you subscribe to by providing a `message type` to the `useGroup` function:

```javascript
const [group] = useGroup("your-group-name", "test-message", (message) => {
    console.log(message); // Only logs messages sent using the `test-message` message type
});
```

The `group` instance returned by `useGroup` can be used to send messages to the group. It's just a regular Azure WebPubSub JavaScript SDK `group` instance.

```javascript
group.publish("test-message", { text: "message text" });
```

Because we're returning the group instance, and Azure WebPubSub SDK instance from our `useGroup` hook, you can subsequently use these to perform any operations you like on the group.

For example, you could retrieve history like this:

```javascript
const [group] = useGroup("your-group-name", (message) => {
    console.log(message);
});

const history = group.history((err, result) => {
    var lastMessage = resultPage.items[0];
    console.log('Last message: ' + lastMessage.id + ' - ' + lastMessage.data);
});
```

---

## Developer Notes

This repository is configured to execute using Vite - which will load a sample web app that acts as a simple test harness for the hooks.

You can run the dev server from the terminal using:

```bash
npm run start
```

You'll need to provide an API key for the sample to work (or you'll just get a white page and some errors in the console). To do this, create the file `./api/.env` and add the following line:

```.env
AZURE_WEBPUBSUB_CONNECTION_STRING=VALUE-FROM-AZURE-PORTAL
```

You can run the `unit tests` by running `npm run test` in the terminal.

You can build the published artefacts by running `npm run ci` in the terminal. The node module is distrubted as an ES6 module, and requires consumers to be able to import modules in their react apps. The test application and unit tests are excluded from the generated `dist` folder to prevent confusion at runtime.
