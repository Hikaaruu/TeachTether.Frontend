import { Outlet } from "react-router-dom";

export default function TeacherLayout() {
  return (
    <div>
      <h2>Teacher Area</h2>
      <Outlet />
    </div>
  );
}
