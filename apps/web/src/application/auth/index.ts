/**
 * Auth application public surface.
 */

export {
  signInAction,
  signUpPasajeroAction,
  signUpConductorAction,
  signUpOperadorAction,
  signOutAction,
  getCurrentProfile,
  type AuthActionResult,
} from "./actions";

export { createAuthService, homePathForRol } from "./auth-service";
export type { AuthService } from "./auth-service";
export {
  parseUiModeCookie,
  resolvePostLoginPath,
  UI_MODE_COOKIE,
} from "./post-login-path";
export { setUiModeAction } from "./set-ui-mode-action";
