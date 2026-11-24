export type StockActionState = { error: string | null; success: string | null };
export const initialStockActionState: StockActionState = { error: null, success: null };

export type OrderStatusActionState = { error: string | null; success: string | null };
export const initialOrderStatusActionState: OrderStatusActionState = {
  error: null,
  success: null,
};

export type SettingsActionState = { error: string | null; success: string | null };
export const initialSettingsActionState: SettingsActionState = {
  error: null,
  success: null,
};

export type ImageActionState = { error: string | null; success: string | null };
export const initialImageActionState: ImageActionState = { error: null, success: null };
