import { Outlet } from "react-router-dom";

export default function GuardianLayout() {
  return (
    <div>
      <h2>Guardian Area</h2>
      <Outlet />
    </div>
  );
}
