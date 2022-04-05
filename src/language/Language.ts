import type { Address } from '../Address'
import { DID } from '../DID';
import type { Expression } from '../expression/Expression'
import type { LinkQuery }  from '../perspectives/LinkQuery'
import { Perspective, PerspectiveExpression } from '../perspectives/Perspective';
import { PerspectiveDiff } from '../perspectives/PerspectiveDiff';
import { InputType, Field, ObjectType } from "type-graphql";

export interface Language {
    readonly name: string;

    // Flagging expressions as immutable to enable
    // expression caching in the ad4m-executor
    isImmutableExpression?(expression: Address): boolean;

    // Adapter implementations:
    // ExpressionAdapter implements means of getting an Expression
    // by address and putting an expression
    readonly expressionAdapter?: ExpressionAdapter;

    // Implementation of a Language that defines and stores Languages
    readonly languageAdapter?: LanguageAdapter;

    // Optional adapter for getting Expressions by author
    readonly getByAuthorAdapter?: GetByAuthorAdapter;
    // Optional adapter for getting all Expressions
    readonly getAllAdapter?: GetAllAdapter;
    // Optional adapter for direct messaging between agents
    readonly directMessageAdapter?: DirectMessageAdapter;
    // Optional adpater for sharing links
    readonly linksAdapter?: LinksAdapter;

    readonly expressionUI?: ExpressionUI;
    readonly settingsUI?: SettingsUI;

    // All available interactions this agent could execute on given expression
    interactions(expression: Address): Interaction[];
}

export interface ExpressionUI {
    // UI factories returning web components:
    icon(): string; // returns JS code that implements this Language's web component
    constructorIcon(): string;
}

export interface SettingsUI {
    settingsIcon(): string;
}

// This interface has to implementend by every language
export interface ExpressionAdapter {
    // Returns an Expression by address, or null if there is no Expression
    // with that given address
    get(address: Address): Promise<Expression | null>;

    // Strategy for putting an expression with needs to be different
    // for those two cases:
    // 1. PublicSharing means that this language supports the creation
    //    and sharing of Expressions, which is the common use-case
    // 2. ReadOnlyLanguage means that the Language implements a pre-defined
    //    set of expressions (which can be infinite or finite).
    //    For example the url-iframe Language which directly maps URLs to
    //    addresses - meaning every well formed URL is an address in this
    //    Language. Or a potential Language implementing the verbs/predicates
    //    of a spec like FOAF.
    putAdapter: PublicSharing | ReadOnlyLanguage;
}

// Implement this interface if your Language supports creation of sharing
// of Expressions.
// See ExpressionAdapter
export interface PublicSharing {
    // Create an Expression and shares it.
    // Return the Expression's address.
    // * content is the object created by the constructorIcon component
    createPublic(content: object): Promise<Address>;
}

// Implement this interface if your Language is defined over a static
// set of pre-defined Expressions.
export interface ReadOnlyLanguage {
    // This just calculates the address of an object
    // * content is the object created by the constructorIcon component
    addressOf(content: object): Promise<Address>;
}

export interface LanguageAdapter {
    getLanguageSource(address: Address): Promise<string>;
}

// Implement this if your Language supports retrieval of all Expressions
// authored by a given agent
export interface GetByAuthorAdapter {
    /// Get expressions authored by a given Agent/Identity
    getByAuthor(author: DID, count: number, page: number): Promise<Expression[] | null>;
}

// Implement this if your Language supports retrieval of all Expressions
// stored in the space of that Language.
// Might not be trivial (without trade-off) for Holochain or DHTs
// in general - hence not a required interface.
export interface GetAllAdapter {
    /// Get expressions authored by a given Agent/Identity
    getAll(filter: any, count: number, page: number): Promise<Expression[] | null>;
}

export type NewDiffObserver = (diff: PerspectiveDiff, revision: string)=>void;

// Interface for "Link Languages" that facilitate the synchronization
// between agents' local Perspectives inside a Neighbourhood.
// The assumption is that every version of the shared Perspective
// is labeled with a unique revision string.
// Changes are committed and retrieved through diffs.
// Think of a LinkSyncAdapter as a git branch to which agents commit
// their changes to and pull diffs from their current revision
// to the latest one.
export interface LinkSyncAdapter {
    writable(): boolean;
    public(): boolean;
    others(): Promise<DID[]>;

    // Call this to check if there are new changes
    // (compare returned revision with last one that was pulled)
    latestRevision(): string;

    // What revision are we on now -> what changes are included in output of render()
    currentRevision(): string;

    // Check for and get new changes.
    // Updates `currentRevision` so we know which changes we have seen already.
    // 
    // TEMP pseudo code for Holochain implementation (remove before merging into main):
    // if(latestRevision != currentRevision) {
    //   if(currentRevision is ancestor of latestRevision) {
    //     "fast-forward" -> get all diffs in between and merge them -> return diff
    //     currentRevision = latestRevision
    //   } else {
    //     "we're forked" -> commit merge entry and calculate diff between branches
    //     -> return branch diff
    //     currentRevision = merge entry hash 
    //   }
    //   return empty diff
    // }
    pull(): Promise<PerspectiveDiff>;

    // Returns the full, rendered Perspective at currentRevision,
    // applying all diffs until this point.
    //
    // TEMP comment for Holochain implementation:
    // Rendering the full perspective means traversing the chain backwards
    // until:
    //   1. We reach the first diff entry (no parent)
    //   2. We find an entry with attached snapshot
    // Then we walk back up again and apply all diffs.
    render(): Promise<Perspective>;

    // Publish changes.
    // Returns new revision after adding diff.
    //
    // TEMP:
    // 0. if(currentRevision != currentRevision) pull()
    // 1. new_diff = create new diff entry with currentRevision as parent
    // 2. time_index_add_now(new_diff)
    // 3. if(entries since last snapshot > n) {
    //      s = render snapshot
    //      create_link(new_diff, s, "snapshot")
    //    }
    commit(diff: PerspectiveDiff): Promise<string>;

    // Get push notification when a diff got published
    addCallback(callback: NewDiffObserver);
}

export type MessageCallback = (message: PerspectiveExpression) => void;
export type StatusCallback = (caller: DID) => Perspective;
export interface DirectMessageAdapter {
    recipient(): DID;

    status(): Promise<PerspectiveExpression | void>;
    sendP2P(message: Perspective): Promise<PerspectiveExpression|void>;
    sendInbox(message: Perspective): Promise<PerspectiveExpression|void>;

    setStatus(status: PerspectiveExpression);
    inbox(filter?: string): Promise<PerspectiveExpression[]>
    addMessageCallback(callback: MessageCallback);
}

@ObjectType()
export class InteractionParameter {
    @Field()
    name: string

    @Field()
    type: string
}

@ObjectType()
export class InteractionMeta {
    @Field()
    label: string;

    @Field()
    name: string;

    @Field(type => [InteractionParameter])
    parameters: InteractionParameter[]
}
export interface Interaction {
    readonly label: string;
    readonly name: string;
    readonly parameters: InteractionParameter[];
    execute(parameters: object): Promise<string|null>;
}

@InputType()
export class InteractionCall {
    @Field()
    name: string;
    @Field()
    parametersStringified: string;

    public get parameters(): object {
        return JSON.parse(this.parametersStringified)
    }

    constructor(name: string, parameters: object) {
        this.name = name
        this.parametersStringified = JSON.stringify(parameters)
    }
}

export class OnlineAgent {
    did: DID
    status: string
}

export class TelepresenceRpcCall {
    fn_name: string
    params: object
}

export type TelepresenceRpcCallback = (call: TelepresenceRpcCall) => object;

export interface TelepresenceAdapter {
    setOnlineStatus(status: string);
    getOnlineAgents(): [OnlineAgent];

    rpcCall(remoteAgentDid: string, call: TelepresenceRpcCall): object;
    registerRpcCallback(callback: TelepresenceRpcCall);
}