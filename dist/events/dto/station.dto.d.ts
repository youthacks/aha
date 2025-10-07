export declare class CreateStationDto {
    name: string;
    description?: string;
    price: number;
    stock?: number;
    purchaseLimit?: number;
    imageUrl?: string;
}
export declare class UpdateStationDto {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    purchaseLimit?: number;
    isAvailable?: boolean;
    imageUrl?: string;
}
export declare class PurchaseDto {
    stationId: string;
}
