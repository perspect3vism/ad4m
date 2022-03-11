import { Field, ObjectType } from "type-graphql";
import { LinkExpression } from "../links/Links";
import { PerspectiveHandle } from './PerspectiveHandle'

// This type is used in the GraphQL interface to reference a mutable
// prespective that is implemented locally by the Ad4m runtime.
// The UUID is used in mutations to identify the perspective that gets mutated.
@ObjectType()
export class PerspectiveLink{
    @Field(type => LinkExpression)
    link: LinkExpression

    @Field(type => PerspectiveHandle)
    perspective: PerspectiveHandle

    constructor(link: LinkExpression, perspective: PerspectiveHandle) {
        this.link = link
        this.perspective = perspective
    }
}
