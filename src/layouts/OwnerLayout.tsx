import { Outlet } from "react-router-dom";

export default function OwnerLayout() {
  return (
    <div>
      <h2>Owner Area</h2>
      <Outlet />
    </div>
  );
}
