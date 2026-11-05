// How the signed-in user is shown in the admin (name, email, initials).
// A small structural type, so it accepts Clerk's user object as it is.
type UserLike = {
  fullName?: string | null;
  username?: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
};

export const emailOf = (user: UserLike): string =>
  user.primaryEmailAddress?.emailAddress ?? "";

export const displayNameOf = (user: UserLike): string =>
  user.fullName || user.username || emailOf(user) || "Signed-in user";

export const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("") || "?";