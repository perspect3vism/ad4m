import { ApolloClient, gql } from "@apollo/client";
import { Link, LinkExpressionInput, LinkExpression, LinkInput } from "../links/Links";
import unwrapApolloResult from "../unwrapApolloResult";
import { LinkQuery } from "./LinkQuery";
import { Perspective } from "./Perspective";
import { PerspectiveHandle } from "./PerspectiveHandle";
import { PerspectiveProxy } from './PerspectiveProxy';

const LINK_EXPRESSION_FIELDS = `
author
timestamp
data { source, predicate, target }
proof { valid, invalid, signature, key }
`

const PERSPECTIVE_HANDLE_FIELDS = `
uuid
name
sharedUrl
neighbourhood { 
    linkLanguage 
    meta { 
        links
            {
                author
                timestamp
                data { source, predicate, target }
                proof { valid, invalid, signature, key }
            }  
    } 
}
`

export type PerspectiveHandleCallback = (perspective: PerspectiveHandle) => null
export type UuidCallback = (uuid: string) => null
export type LinkCallback = (link: LinkExpression) => null
export default class PerspectiveClient {
    #apolloClient: ApolloClient<any>
    #perspectiveAddedCallbacks: PerspectiveHandleCallback[]
    #perspectiveUpdatedCallbacks: PerspectiveHandleCallback[]
    #perspectiveRemovedCallbacks: UuidCallback[]
    #perspectiveLinkAddedCallbacks: Map<String, LinkCallback[]>
    #perspectiveLinkRemovedCallbacks: Map<String, LinkCallback[]>

    constructor(client: ApolloClient<any>, subscribe: boolean) {
        this.#apolloClient = client
        this.#perspectiveAddedCallbacks = []
        this.#perspectiveUpdatedCallbacks = []
        this.#perspectiveRemovedCallbacks = []
        this.#perspectiveLinkAddedCallbacks = new Map()
        this.#perspectiveLinkRemovedCallbacks = new Map()

        if(subscribe) {
            this.subscribePerspectiveAdded()
            this.subscribePerspectiveUpdated()
            this.subscribePerspectiveRemoved()
        }
    }

    async all(): Promise<PerspectiveProxy[]> {
        const { perspectives } = unwrapApolloResult(await this.#apolloClient.query({
            query: gql`query perspectives {
                perspectives {
                    ${PERSPECTIVE_HANDLE_FIELDS}
                }
                
            }`
        }))
        return perspectives.map(handle => new PerspectiveProxy(handle, this))
    }

    async byUUID(uuid: string): Promise<PerspectiveProxy|null> {
        const { perspective } = unwrapApolloResult(await this.#apolloClient.query({
            query: gql`query perspective($uuid: String!) {
                perspective(uuid: $uuid) {
                    ${PERSPECTIVE_HANDLE_FIELDS}
                }
            }`,
            variables: { uuid }
        }))
        if(!perspective) return null
        return new PerspectiveProxy(perspective, this)
    }

    async snapshotByUUID(uuid: string): Promise<Perspective|null> {
        const { perspectiveSnapshot } = unwrapApolloResult(await this.#apolloClient.query({
            query: gql`query perspectiveSnapshot($uuid: String!) {
                perspectiveSnapshot(uuid: $uuid) {
                    links { ${LINK_EXPRESSION_FIELDS} }
                }
            }`,
            variables: { uuid }
        }))
        return perspectiveSnapshot
    }
    async publishSnapshotByUUID(uuid: string): Promise<string|null> {
        const { perspectivePublishSnapshot } = unwrapApolloResult(await this.#apolloClient.mutate({
            mutation: gql`mutation perspectivePublishSnapshot($uuid: String!) {
                perspectivePublishSnapshot(uuid: $uuid)
            }`,
            variables: { uuid }
        }))
        return perspectivePublishSnapshot
    }

    async queryLinks(uuid: string, query: LinkQuery): Promise<LinkExpression[]> {
        const { perspectiveQueryLinks } = unwrapApolloResult(await this.#apolloClient.query({
            query: gql`query perspectiveQueryLinks($uuid: String!, $query: LinkQuery!) {
                perspectiveQueryLinks(query: $query, uuid: $uuid) {
                    ${LINK_EXPRESSION_FIELDS}
                }
            }`,
            variables: { uuid, query }
        }))
        return perspectiveQueryLinks
    }

    async queryProlog(uuid: string, query: string): Promise<any> {
        const { perspectiveQueryProlog } = unwrapApolloResult(await this.#apolloClient.query({
            query: gql`query perspectiveQueryProlog($uuid: String!, $query: String!) {
                perspectiveQueryProlog(uuid: $uuid, query: $query)
            }`,
            variables: { uuid, query }
        }))

        return JSON.parse(perspectiveQueryProlog)
    }

    async add(name: string): Promise<PerspectiveProxy> {
        const { perspectiveAdd } = unwrapApolloResult(await this.#apolloClient.mutate({
            mutation: gql`mutation perspectiveAdd($name: String!) {
                perspectiveAdd(name: $name) {
                    ${PERSPECTIVE_HANDLE_FIELDS}
                }
            }`,
            variables: { name }
        }))
        return new PerspectiveProxy(perspectiveAdd, this)
    }

    async update(uuid: string, name: string): Promise<PerspectiveProxy> {
        const { perspectiveUpdate } = unwrapApolloResult(await this.#apolloClient.mutate({
            mutation: gql`mutation perspectiveUpdate($uuid: String!, $name: String!) {
                perspectiveUpdate(uuid: $uuid, name: $name) {
                    ${PERSPECTIVE_HANDLE_FIELDS}
                }
            }`,
            variables: { uuid, name }
        }))
        return new PerspectiveProxy(perspectiveUpdate, this)
    }

    async remove(uuid: string): Promise<{perspectiveRemove: boolean}> {
        return unwrapApolloResult(await this.#apolloClient.mutate({
            mutation: gql`mutation perspectiveRemove($uuid: String!) {
                perspectiveRemove(uuid: $uuid)
            }`,
            variables: { uuid }
        }))
    }

    async addLink(uuid: string, link: Link): Promise<LinkExpression> {
        const { perspectiveAddLink } = unwrapApolloResult(await this.#apolloClient.mutate({
            mutation: gql`mutation perspectiveAddLink($uuid: String!, $link: LinkInput!){
                perspectiveAddLink(link: $link, uuid: $uuid) {
                    ${LINK_EXPRESSION_FIELDS}
                }
            }`,
            variables: { uuid, link }
        }))
        return perspectiveAddLink
    }
 
    async updateLink(uuid: string, oldLink: LinkExpressionInput, newLink: LinkInput): Promise<LinkExpression> {
        const { perspectiveUpdateLink } = unwrapApolloResult(await this.#apolloClient.mutate({
            mutation: gql`mutation perspectiveUpdateLink(
                $uuid: String!, 
                $newLink: LinkInput!
                $oldLink: LinkExpressionInput!
            ){
                perspectiveUpdateLink(
                    newLink: $newLink, 
                    oldLink: $oldLink, 
                    uuid: $uuid
                ) {
                    ${LINK_EXPRESSION_FIELDS}
                }
            }`,
            variables: { uuid, oldLink, newLink }
        }))
        return perspectiveUpdateLink
    }

    async removeLink(uuid: string, link: LinkExpressionInput): Promise<{perspectiveRemoveLink: boolean}> {
        return unwrapApolloResult(await this.#apolloClient.mutate({
            mutation: gql`mutation perspectiveRemoveLink($link: LinkExpressionInput!, $uuid: String!) {
                perspectiveRemoveLink(link: $link, uuid: $uuid)
            }`,
            variables: { uuid, link }
        }))
    }

    // Subscriptions:
    addPerspectiveAddedListener(cb: PerspectiveHandleCallback) {
        this.#perspectiveAddedCallbacks.push(cb)
    }

    subscribePerspectiveAdded() {
        this.#apolloClient.subscribe({
            query: gql` subscription {
                perspectiveAdded { ${PERSPECTIVE_HANDLE_FIELDS} }
            }   
        `}).subscribe({
            next: result => {
                this.#perspectiveAddedCallbacks.forEach(cb => {
                    cb(result.data.perspectiveAdded)
                })
            },
            error: (e) => console.error(e)
        })
    }

    addPerspectiveUpdatedListener(cb: PerspectiveHandleCallback) {
        this.#perspectiveUpdatedCallbacks.push(cb)
    }

    subscribePerspectiveUpdated() {
        this.#apolloClient.subscribe({
            query: gql` subscription {
                perspectiveUpdated { ${PERSPECTIVE_HANDLE_FIELDS} }
            }   
        `}).subscribe({
            next: result => {
                this.#perspectiveUpdatedCallbacks.forEach(cb => {
                    cb(result.data.perspectiveUpdated)
                })
            },
            error: (e) => console.error(e)
        })
    }

    addPerspectiveRemovedListener(cb: UuidCallback) {
        this.#perspectiveRemovedCallbacks.push(cb)
    }

    subscribePerspectiveRemoved() {
        this.#apolloClient.subscribe({
            query: gql` subscription {
                perspectiveRemoved
            }   
        `}).subscribe({
            next: result => {
                this.#perspectiveRemovedCallbacks.forEach(cb => {
                    cb(result.data.perspectiveRemoved)
                })
            },
            error: (e) => console.error(e)
        })
    }

    addPerspectiveLinkAddedListener(uuid: String, cb: LinkCallback) {
        let callbacks = this.#perspectiveLinkAddedCallbacks.get(uuid) || []
        callbacks.push(cb)
        this.#perspectiveLinkAddedCallbacks.set(uuid, callbacks)
    }

    removePerspectiveLinkAddedListener(uuid: String, cb: LinkCallback) {
        let callbacks = this.#perspectiveLinkAddedCallbacks.get(uuid) || []

        const index = callbacks.indexOf(cb);
        callbacks.splice(index, 1);

        this.#perspectiveLinkAddedCallbacks.set(uuid, callbacks)
    }

    subscribePerspectiveLinkAdded(uuid: String) {
        this.#apolloClient.subscribe({
            query: gql` subscription {
                perspectiveLinkAdded(uuid: "${uuid}") { ${LINK_EXPRESSION_FIELDS} }
            }   
        `}).subscribe({
            next: result => {
                this.#perspectiveLinkAddedCallbacks.get(uuid).forEach(cb => {
                    cb(result.data.perspectiveLinkAdded)
                })
            },
            error: (e) => console.error(e)
        })
    }

    addPerspectiveLinkRemovedListener(uuid: String, cb: LinkCallback) {
        let callbacks = this.#perspectiveLinkRemovedCallbacks.get(uuid) || []
        callbacks.push(cb)
        this.#perspectiveLinkRemovedCallbacks.set(uuid, callbacks)
    }

    removePerspectiveLinkRemovedListener(uuid: String, cb: LinkCallback) {
        let callbacks = this.#perspectiveLinkRemovedCallbacks.get(uuid) || []

        const index = callbacks.indexOf(cb);
        callbacks.splice(index, 1);

        this.#perspectiveLinkRemovedCallbacks.set(uuid, callbacks)
    }

    subscribePerspectiveLinkRemoved(uuid: String) {
        this.#apolloClient.subscribe({
            query: gql` subscription {
                perspectiveLinkRemoved(uuid: "${uuid}") { ${LINK_EXPRESSION_FIELDS} }
            }   
        `}).subscribe({
            next: result => {
                this.#perspectiveLinkRemovedCallbacks.get(uuid).forEach(cb => {
                    cb(result.data.perspectiveLinkRemoved)
                })
            },
            error: (e) => console.error(e)
        })
    }
}