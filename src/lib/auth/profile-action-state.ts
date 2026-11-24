export type ProfileActionState = {
  error: string | null;
  success: string | null;
};

export const initialProfileActionState: ProfileActionState = {
  error: null,
  success: null,
};
