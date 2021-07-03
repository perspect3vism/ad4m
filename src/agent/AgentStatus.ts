import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class AgentStatus {
    @Field()
    isInitialized: Boolean

    @Field()
    isUnlocked: Boolean

    @Field({nullable: true})
    did: String

    @Field({nullable: true})
    didDocument: String
    
    @Field({nullable: true})
    error: String

    constructor(obj?: object) {
        if(obj) {
            //@ts-ignore
            this.isInitialized = obj.isInitialized
            if(!this.isInitialized) {
                this.isInitialized = false
            }
            //@ts-ignore
            this.isUnlocked = obj.isUnlocked
            if(!this.isUnlocked) {
                this.isUnlocked = false
            }
            //@ts-ignore
            this.did = obj.did
            //@ts-ignore
            this.didDocument = obj.didDocument
            //@ts-ignore
            this.error = obj.error
        } else {
            this.isInitialized = false
            this.isUnlocked = false
        }
        
    }
}