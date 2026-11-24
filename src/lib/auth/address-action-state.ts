export type AddressActionState = {
  error: string | null;
  success: string | null;
};

export const initialAddressActionState: AddressActionState = {
  error: null,
  success: null,
};
