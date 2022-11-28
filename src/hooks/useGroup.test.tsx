import { it, beforeEach, describe, expect } from 'vitest';
import { useGroup } from "./useGroup";
import { act } from 'react-dom/test-utils';
import { provideSdkInstance } from '../ReactHooks';
import { render, screen } from '@testing-library/react';
import { AzureWebPubSubClient } from '../AzureWebPubSubClient';
import React, { useState }  from 'react';

describe("useGroup", () => {
    let sutClient: AzureWebPubSubClient;
    let otherClient: AzureWebPubSubClient;

    beforeEach(() => {
        const fakeSocket = {
            _handlers: [],
            readyState: 1,
            onopen: () => {},
            send: function(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
                const fakeEvent = new MessageEvent<any>("message", { data: data });
                this._handlers.forEach(h => h(fakeEvent));
            },
            set onmessage(handler: any) {
                this._handlers.push(handler);
            }
        } as any;

        sutClient = new AzureWebPubSubClient(fakeSocket);
        otherClient = new AzureWebPubSubClient(fakeSocket);

        provideSdkInstance(sutClient);
    });

    it("component can useGroup and renders nothing by default", async () => {
        render(<UseGroupComponent></UseGroupComponent>);
        const messageUl = screen.getAllByRole("messages")[0];

        expect(messageUl.childElementCount).toBe(0);
    });

    it("component updates when message arrives", async () => {
        render(<UseGroupComponent></UseGroupComponent>);

        await act(async () => {
            otherClient.groups.get("blah").send("msg", { text: "message text" });
        });

        const messageUl = screen.getAllByRole("messages")[0];     
        expect(messageUl.childElementCount).toBe(1);
        expect(messageUl.children[0].innerHTML).toBe("message text");
    });

    it("component updates when multiple messages arrive", async () => {
        render(<UseGroupComponent></UseGroupComponent>);

        await act(async () => {
            otherClient.groups.get("blah").send("msg", { text: "message text1" });
            otherClient.groups.get("blah").send("msg", { text: "message text2" });
        });

        const messageUl = screen.getAllByRole("messages")[0];
        expect(messageUl.children[0].innerHTML).toBe("message text1");
        expect(messageUl.children[1].innerHTML).toBe("message text2");
    });
});

const UseGroupComponent = () => {
    const [messages, updateMessages] = useState<any[]>([]);
    const [group, client] = useGroup("blah", (message) => {
        updateMessages((prev) => [...prev, message]);
    });
    
    const messagePreviews = messages.map((msg, index) => <li key={index}>{msg.data.text}</li>);
    
    return (<ul role="messages">{messagePreviews}</ul>);
}
