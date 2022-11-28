import { useEffect } from 'react';
import { AzureWebPubSubClient, GroupClient, IncomingMessageEnvelope } from '../AzureWebPubSubClient.js';
import { assertConfiguration } from "../ReactHooks.js";

export type GroupAndClient = [group: GroupClient, client: AzureWebPubSubClient];

export function useGroup<T>(groupName: string, callbackOnMessage: (message: IncomingMessageEnvelope<T>) => void): GroupAndClient;
export function useGroup<T>(groupName: string, event: string, callbackOnMessage: (message: IncomingMessageEnvelope<T>) => void): GroupAndClient;

export function useGroup(groupName: string, ...channelSubscriptionArguments: any[]): GroupAndClient {
    const webPubSub = assertConfiguration();

    const group = webPubSub.groups.get(groupName);

    const onMount = async () => {
       await group.subscribe.apply(group, channelSubscriptionArguments);
    }

    const onUnmount = async () => {
       await group.unsubscribe.apply(group, channelSubscriptionArguments);
        
        setTimeout(async () => {
            // React is very mount/unmount happy, so if we just detatch the channel
            // it's quite likely it will be reattached again by a subsequent onMount calls.
            // To solve this, we set a timer, and if all the listeners have been removed, we know that the component
            // has been removed for good and we can detatch the channel.

           if (group.listeners.length === 0) {
               await group.detach();
           }
        }, 2500);
    }

    const useEffectHook = () => {
        onMount();
        return () => { onUnmount(); };
    };

    useEffect(useEffectHook, [groupName]);

    return [group, webPubSub];
}
