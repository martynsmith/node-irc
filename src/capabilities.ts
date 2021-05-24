import { Message } from "./parse_message";

interface CapabilitiesSet {
    caps: string[];
    saslTypes?: string[];
}

/**
 * A helper class to handle capabilities sent by the IRCd.
 */
export class IrcCapabilities {

    static parseCapabilityString(caps: string): CapabilitiesSet {
        const allCaps = caps.split(' ');
        // Not all servers respond with the type of sasl supported.
        const saslTypes = allCaps.find((s) => s.startsWith('sasl='))?.split('=')[1]
            .split(',')
            .map((s) => s.toUpperCase());
        return {
            caps: allCaps,
            saslTypes: saslTypes,
        }
    }

    constructor(
        private readonly onCapsList: () => void,
        private readonly onCapsConfirmed: () => void) {

    }

    public get capsReady() {
        return !!this.userCapabilites;
    }

    public get supportsSasl() {
        if (!this.serverCapabilites) {
            throw Error('Server response has not arrived yet');
        }
        return this.serverCapabilites.caps.includes('sasl');
    }

    /**
     * Check if the IRCD supports a given Sasl method.
     * @param method The method of SASL (e.g. 'PLAIN', 'EXTERNAL') to check support for. Case insensitive.
     * @param allowNoMethods Not all implementations support explicitly mentioning SASL methods,
     * so optionally we can return true here.
     * @returns True if supported, false otherwise.
     * @throws If the capabilites have not returned yet.
     */
    public supportsSaslMethod(method: string, allowNoMethods=false) {
        if (!this.serverCapabilites) {
            throw Error('Server caps response has not arrived yet');
        }
        if (!this.serverCapabilites.caps.includes('sasl')) {
            return false;
        }
        if (!this.serverCapabilites.saslTypes) {
            return allowNoMethods;
        }
        return this.serverCapabilites.saslTypes.includes(method.toUpperCase());
    }

    private serverCapabilites?: CapabilitiesSet;
    private userCapabilites?: CapabilitiesSet;

    /**
     * Handle an incoming `CAP` message.
     */
    public onCap(message: Message) {
        // E.g. CAP * LS :account-notify away-notify chghost extended-join multi-prefix
        // sasl=PLAIN,ECDSA-NIST256P-CHALLENGE,EXTERNAL tls account-tag cap-notify echo-message
        // solanum.chat/identify-msg solanum.chat/realhost
        const [target, subCmd, parts] = message.args;
        if (subCmd === 'LS') {
            // Listing all caps
            this.serverCapabilites = IrcCapabilities.parseCapabilityString(parts);
            // We now need to request
            this.onCapsList();
        }
        // The target might be * or the nickname, for now just accept either.
        if (subCmd === 'ACK') {
            // Listing all caps
            this.userCapabilites = IrcCapabilities.parseCapabilityString(parts);
            this.onCapsConfirmed();
        }
    }
}