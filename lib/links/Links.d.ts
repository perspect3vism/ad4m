import { Expression } from '../expression/Expression';
export default class Link {
    source: string;
    target: string;
    predicate?: string;
    constructor(obj: any);
}
declare const LinkExpression_base: any;
export declare class LinkExpression extends LinkExpression_base {
}
export declare class LinkQuery {
    source?: string;
    target?: string;
    predicate?: string;
    fromDate?: Date;
    untilDate?: Date;
    constructor(obj: object);
    isMatch(l: Link): boolean;
}
export declare function linkEqual(l1: Expression, l2: Expression): boolean;
export declare function isLink(l: any): boolean;
export declare function hashLinkExpression(link: Expression): number;
export {};
