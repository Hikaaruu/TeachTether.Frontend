import { Outlet } from "react-router-dom";

export default function StudentLayout() {
  return (
    <div>
      <h2>Student Area</h2>
      <Outlet />
    </div>
  );
}
