// src/types/roles.ts

export enum UserRole {
  Owner = "SchoolOwner",
  Admin = "SchoolAdmin",
  Teacher = "Teacher",
  Student = "Student",
  Guardian = "Guardian",
}

// Optional: full list as array
export const ALL_ROLES: UserRole[] = [
  UserRole.Owner,
  UserRole.Admin,
  UserRole.Teacher,
  UserRole.Student,
  UserRole.Guardian,
];
