import type { Address } from '../Address'
import { Field, ObjectType } from "type-graphql";


// Unique Language ID with option type
@ObjectType()
export class LanguageRef {
    @Field()
    address: Address;
    
    @Field()
    name: string;
}
