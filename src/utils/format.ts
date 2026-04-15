interface HasUser {
  user: { firstName: string; middleName?: string; lastName: string };
}

export function personName(u: {
  firstName: string;
  middleName?: string;
  lastName: string;
}): string {
  return [u.firstName, u.middleName, u.lastName].filter(Boolean).join(" ");
}

export function compareByPersonName<T extends HasUser>(a: T, b: T): number {
  return (
    a.user.lastName.localeCompare(b.user.lastName) ||
    a.user.firstName.localeCompare(b.user.firstName)
  );
}
