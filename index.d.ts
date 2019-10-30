/*
Copyright 2019 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Socket } from "net";
import { EventEmitter } from "events";

type CbFunction = (err: Error|null) => void;

// Type definitions for node-irc
// Project: matrix-org
// Definitions by: Will Hunt https://github.com/matrix-org/node-irc
export interface IrcClientOpts {
    password?: string|null;
    userName?: string;
    realName?: string;
    port?: number;
    family: number|null;
    bustRfc3484: boolean;
    localAddress?: string|null;
    localPort?: number|null;
    debug?: boolean;
    showErrors?: boolean;
    autoRejoin?: boolean;
    autoConnect?: boolean;
    channels?: string[];
    retryCount?: number|null;
    retryDelay?: number;
    secure?: boolean|object;
    selfSigned?: boolean;
    certExpired?: boolean;
    floodProtection?: boolean;
    floodProtectionDelay?: number;
    sasl?: boolean;
    stripColors?: boolean;
    channelPrefixes?: string;
    messageSplit?: number;
    encoding?: string|false;
    onNickConflict?: (maxLen: number) => number,
    webirc?: {
        pass: string,
        ip: string,
        user: string
    };
}

export interface ChanData {
    key: string;
    serverName: string;
    users: {[nick: string]: string /* mode */},
    mode: string;
}

export interface WhoisResponse {
    user: string;
    idle: number;
    channels: string[];
    host: string;
    realname: string;
}

export class Client extends EventEmitter {
    readonly modeForPrefix: {[prefix: string]: string};
    readonly nick: string;
    readonly chans: {[channel: string]: ChanData};
    readonly supported?: {
        nicklength?: number;
    }
    readonly conn?: Socket;
    constructor(server: string, nick: string, opts: IrcClientOpts);
    connect(retryCount: number, callback: CbFunction): void;
    disconnect(reason?: string|CbFunction, callback?: CbFunction): void
    send(...data: string[]): Promise<void>;
    action(channel: string, text: string): Promise<void>;
    notice(channel: string, text: string): Promise<void>;
    say(channel: string, text: string): Promise<void>;
    join(channel: string, cb?: () => void): Promise<void>;
    part(channel: string, reason: string, cb?: () => void): Promise<void>;
    ctcp(to: string, type: string, text: string): Promise<void>;
    whois(nick: string, cb: (whois: WhoisResponse) => void): void;
    mode(channelOrNick: string, cb?: () => void): Promise<void>;
    setUserMode(mode: string, nick?: string): Promise<void>;
    names(channel: string, cb: (channelName: string, names: {[nick: string]: string}) => void): void;
    isUserPrefixMorePowerfulThan(prefix: string, testPrefix: string): boolean;
    _toLowerCase(str: string): string;
    getSplitMessages(target: string, text: string): string[];
    chanData(channel: string, create?: boolean): ChanData|undefined;
}
