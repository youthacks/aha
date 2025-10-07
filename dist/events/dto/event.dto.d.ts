export declare class CreateEventDto {
    name: string;
    description?: string;
}
export declare class JoinEventDto {
    slug: string;
}
export declare class UpdateTokensDto {
    userId: string;
    amount: number;
}
export declare class PromoteMemberDto {
    userId: string;
    role: string;
}
