import { Arg, Mutation, Query, Resolver, Subscription } from "type-graphql";
import { LinkExpression, LinkExpressionInput, LinkInput } from "../links/Links";
import { Neighbourhood } from "../neighbourhood/Neighbourhood";
import { LinkQuery } from "./LinkQuery";
import { Perspective } from "./Perspective";
import { PerspectiveHandle } from "./PerspectiveHandle";
import { PerspectiveLink } from './PerspectiveLink'

const testLink = new LinkExpression()
testLink.author = "did:ad4m:test"
testLink.timestamp = Date.now()
testLink.data = {
    source: 'root',
    target: 'neighbourhood://Qm12345'
}
testLink.proof = {
    signature: '',
    key: '',
    valid: true
}

/**
 * Resolver classes are used here to define the GraphQL schema 
 * (through the type-graphql annotations)
 * and are spawned in the client tests in Ad4mClient.test.ts.
 * For the latter, they return test fixtures.
 */
@Resolver()
export default class PerspectiveResolver {
    @Query(returns => [PerspectiveHandle])
    perspectives(): PerspectiveHandle[] {
        const p1 = new PerspectiveHandle()
        p1.name = 'test-perspective-1'
        p1.uuid = '00001'
        const p2 = new PerspectiveHandle()
        p2.name = 'test-perspective-2'
        p2.uuid = '00002'
        p2.sharedUrl = 'neighbourhood://Qm12345'
        p2.neighbourhood = new Neighbourhood("language://Qm12345", new Perspective())
        return [p1, p2]
    }

    @Query(returns => PerspectiveHandle, {nullable: true})
    perspective(@Arg('uuid') uuid: string): PerspectiveHandle|null {
        return new PerspectiveHandle(uuid, 'test-perspective-1')
    }

    @Query(returns => Perspective, {nullable: true})
    perspectiveSnapshot(@Arg('uuid') uuid: string): Perspective|null {
        return new Perspective([testLink])
    }

    @Mutation(returns => String, {nullable: true})
    perspectivePublishSnapshot(@Arg('uuid') uuid: string): String|null {
        return 'perspective://Qm12345'
    }

    @Query(returns => [LinkExpression], {nullable: true})
    perspectiveQueryLinks(@Arg('uuid') uuid: string, @Arg('query') query: LinkQuery): LinkExpression[] {
        return [testLink]
    }

    @Query(returns => String)
    perspectiveQueryProlog(@Arg('uuid') uuid: string, @Arg('query') query: String): string {
        return `[{"X": 1}]`
    }

    @Mutation(returns => PerspectiveHandle)
    perspectiveAdd(@Arg('name') name: string): PerspectiveHandle {
        return new PerspectiveHandle('00006', name)
    }

    @Mutation(returns => PerspectiveHandle, {nullable: true})
    perspectiveUpdate(@Arg('uuid') uuid: string, @Arg('name') name: string): PerspectiveHandle {
        return new PerspectiveHandle(uuid, name)
    }

    @Mutation(returns => Boolean)
    perspectiveRemove(@Arg('uuid') uuid: string): boolean {
        return true
    }

    @Mutation(returns => LinkExpression)
    perspectiveAddLink(@Arg('uuid') uuid: string, @Arg('link') link: LinkInput): LinkExpression {
        const l = new LinkExpression()
        l.author = 'did:ad4m:test'
        l.timestamp = Date.now()
        l.proof = testLink.proof
        l.data = link
        return l
    }
 
    @Mutation(returns => LinkExpression)
    perspectiveUpdateLink(@Arg('uuid') uuid: string, @Arg('oldLink') oldlink: LinkExpressionInput, @Arg('newLink') newlink: LinkInput): LinkExpression {
        const l = new LinkExpression()
        l.author = 'did:ad4m:test'
        l.timestamp = Date.now()
        l.proof = testLink.proof
        l.data = newlink
        return l    
    }

    @Mutation(returns => Boolean)
    perspectiveRemoveLink(@Arg('uuid') uuid: string, @Arg('link') link: LinkExpressionInput): Boolean {
        return true
    }

    @Subscription({topics: "", nullable: true})
    perspectiveAdded(): PerspectiveHandle {
        return new PerspectiveHandle('00001', 'New Perspective')
    }

    @Subscription({topics: "", nullable: true})
    perspectiveUpdated(): PerspectiveHandle {
        return new PerspectiveHandle('00001', 'New Perspective')
    }

    @Subscription({topics: "", nullable: true})
    perspectiveRemoved(): string {
        return '00006'
    }

    @Subscription({topics: "", nullable: true})
    perspectiveLinkAdded(): PerspectiveLink {
        const p = new PerspectiveHandle('00004', 'name')
        p.name = 'test-perspective-2'
        p.sharedUrl = 'neighbourhood://Qm12345'
        p.neighbourhood = new Neighbourhood("language://Qm12345", new Perspective())
        const pLink = new PerspectiveLink(testLink, p);
        return pLink
    }

    @Subscription({topics: "", nullable: true})
    perspectiveLinkRemoved(): PerspectiveLink {
        const p = new PerspectiveHandle('00004', 'name')
        p.name = 'test-perspective-2'
        p.sharedUrl = 'neighbourhood://Qm12345'
        p.neighbourhood = new Neighbourhood("language://Qm12345", new Perspective())
        const pLink = new PerspectiveLink(testLink, p);
        return pLink
    }
}