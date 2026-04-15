export interface UserBase {
  firstName: string;
  middleName?: string;
  lastName: string;
  sex: string;
}

export interface School {
  id: number;
  name: string;
}

export interface SchoolAdmin {
  id: number;
  user: UserBase;
}

export interface Teacher {
  id: number;
  dateOfBirth: string;
  user: UserBase;
  schoolId?: number;
}

export interface Student {
  id: number;
  dateOfBirth: string;
  user: UserBase;
  schoolId?: number;
}

export interface Guardian {
  id: number;
  dateOfBirth: string;
  user: UserBase;
}

export interface Subject {
  id: number;
  name: string;
  schoolId?: number;
}

export interface ClassGroup {
  id: number;
  gradeYear: number;
  section: string;
  homeroomTeacherId: number;
  schoolId?: number;
}

export interface Announcement {
  id: number;
  teacherId: number;
  title: string;
  message: string;
  createdAt: string;
}

export interface Grade {
  id: number;
  gradeValue: number;
  gradeType: string;
  gradeDate: string;
  comment?: string;
  teacherName?: string;
}

export interface Behavior {
  id: number;
  behaviorScore: number;
  behaviorDate: string;
  comment?: string;
  teacherName?: string;
}

export interface Attendance {
  id: number;
  attendanceDate: string;
  status: string;
  comment?: string;
  teacherName?: string;
}

export interface ClassAvg {
  gradeAverage: number | null;
  behaviorAverage: number | null;
  attendance: {
    presentPercentage: number;
    latePercentage: number;
    absentPercentage: number;
    excusedPercentage: number;
  };
}

export interface Thread {
  id: number;
  teacherId: number;
  guardianId: number;
}

export interface Message {
  id: number;
  threadId: number;
  senderUserId: string;
  content: string | null;
  sentAt: string;
  isRead: boolean;
}

export interface CreatedCredentials {
  username: string;
  password: string;
}

export interface PersonFormState {
  id?: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  sex: "M" | "F";
  dateOfBirth?: string;
}
