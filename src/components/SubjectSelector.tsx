// File: components/SubjectSelector.tsx
import React from "react";

type Subject = {
  id: number;
  name: string;
};

type Props = {
  subjects: Subject[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

export default function SubjectSelector({
  subjects,
  selectedId,
  onSelect,
}: Props) {
  return (
    <div className="border-end pe-3">
      <div className="text-center fw-semibold text-uppercase text-muted mb-2">
        Subjects
      </div>

      <ul className="list-group">
        {subjects.map((s) => (
          <li
            key={s.id}
            className={`list-group-item list-group-item-action ${
              s.id === selectedId ? "active" : ""
            }`}
            role="button"
            onClick={() => onSelect(s.id)}
          >
            {s.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
