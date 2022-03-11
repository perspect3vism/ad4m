import PerspectiveClient, { LinkCallback, PerspectiveHandleCallback } from "./PerspectiveClient";
import { Link, LinkExpression } from "../links/Links";
import { LinkQuery } from "./LinkQuery";
import { Neighbourhood } from "../neighbourhood/Neighbourhood";
import { PerspectiveHandle } from './PerspectiveHandle'
import { Perspective } from "./Perspective";

export type PerspectiveListenerTypes = "link-added" | "link-removed"

export class PerspectiveProxy {
    #handle: PerspectiveHandle
    #client: PerspectiveClient

    constructor(handle: PerspectiveHandle, ad4m: PerspectiveClient) {
        this.#handle = handle
        this.#client = ad4m
    }

    get uuid(): string {
        return this.#handle.uuid
    }

    get name(): string {
        return this.#handle.name
    }

    get sharedUrl(): string|void {
        return this.#handle.sharedUrl
    }

    get neighbourhood(): Neighbourhood|void {
        return this.#handle.neighbourhood
    }

    async get(query: LinkQuery): Promise<LinkExpression[]> {
        return await this.#client.queryLinks(this.#handle.uuid, query)
    }

    async infer(query: string): Promise<any> {
        return await this.#client.queryProlog(this.#handle.uuid, query)
    }

    async add(link: Link): Promise<LinkExpression> {
        return await this.#client.addLink(this.#handle.uuid, link)
    }

    async update(oldLink: LinkExpression, newLink: Link) {
        return await this.#client.updateLink(this.#handle.uuid, oldLink, newLink)
    }

    async remove(link: LinkExpression) {
        return await this.#client.removeLink(this.#handle.uuid, link)
    }

    async addListener(type: PerspectiveListenerTypes, cb: LinkCallback) {
        await this.#client.addPerspectiveLinkListener(this.#handle.uuid, type, cb);
    }
            
    async removeListener(type: PerspectiveListenerTypes, cb: LinkCallback) {
        await this.#client.removePerspectiveLinkListener(this.#handle.uuid, type, cb);
    }

    async snapshot() {
        return this.#client.snapshotByUUID(this.#handle.uuid)
    }

    async loadSnapshot(snapshot: Perspective) {
        for(const link of snapshot.links) {
            await this.add(link.data)
        }
    }

    async getSingleTarget(query: LinkQuery): Promise<string|void> {
        delete query.target
        const foundLinks = await this.get(query)
        if(foundLinks.length)
            return foundLinks[0].data.target
        else
            return null
    }

    async setSingleTarget(link: Link) {
        const query = new LinkQuery({source: link.source, predicate: link.predicate})
        const foundLinks = await this.get(query)
        for(const l of foundLinks)
            await this.remove(l)
        await this.add(link)
    }
}