export enum UserRole {
  Owner = "SchoolOwner",
  Admin = "SchoolAdmin",
  Teacher = "Teacher",
  Student = "Student",
  Guardian = "Guardian",
}

export const ALL_ROLES = Object.values(UserRole);
