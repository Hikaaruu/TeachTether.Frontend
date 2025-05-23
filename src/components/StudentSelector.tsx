import React from "react";

type Student = {
  id: number;
  user: {
    firstName: string;
    lastName: string;
    middleName?: string;
    sex: string;
  };
};

type Props = {
  students: Student[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

export default function StudentSelector({
  students,
  selectedId,
  onSelect,
}: Props) {
  const fullName = (s: Student) =>
    [s.user.firstName, s.user.middleName, s.user.lastName]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="border-end pe-3">
      {/* Centered and styled using Bootstrap only */}
      <div className="text-center fw-semibold text-uppercase text-muted mb-2">
        Students
      </div>

      <ul className="list-group">
        {students.map((s) => (
          <li
            key={s.id}
            className={`list-group-item list-group-item-action ${
              s.id === selectedId ? "active" : ""
            }`}
            role="button"
            onClick={() => onSelect(s.id)}
          >
            {fullName(s)}
          </li>
        ))}
      </ul>
    </div>
  );
}
