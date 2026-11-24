export type AuthActionState = {
  error: string | null;
  success: string | null;
  fieldErrors?: Record<string, string>;
};

export const initialAuthActionState: AuthActionState = { error: null, success: null };
