import { Student } from "../types/models";
import { personName } from "../utils/format";

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
  const shortName = (s: Student) =>
    [s.user.firstName, s.user.lastName].filter(Boolean).join(" ");

  return (
    <div className="border-end pe-3">
      <div className="text-center fw-semibold text-uppercase text-muted mb-2">
        Students
      </div>

      <ul className="list-group">
        {students.map((s) => (
          <li
            key={s.id}
            className={`list-group-item list-group-item-action   ${
              s.id === selectedId ? "active" : ""
            }`}
            role="button"
            onClick={() => onSelect(s.id)}
          >
            <span
              style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
              }}
              title={personName(s.user)}
            >
              {shortName(s)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
