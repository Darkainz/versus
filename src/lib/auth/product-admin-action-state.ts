export type ProductAdminActionState = {
  error: string | null;
  success: string | null;
};

export const initialProductAdminActionState: ProductAdminActionState = {
  error: null,
  success: null,
};
