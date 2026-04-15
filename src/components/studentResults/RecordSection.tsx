import React from "react";

type SectionProps<T> = {
  title: string;
  data: T[];
  editable: boolean;
  onAdd: () => void;
  render: (item: T) => React.ReactNode;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
};

export default function RecordSection<T extends { id: number }>({
  title,
  data,
  editable,
  onAdd,
  render,
  onEdit,
  onDelete,
}: SectionProps<T>) {
  return (
    <section className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">{title}</h6>
        {editable && (
          <button className="btn btn-sm btn-outline-primary" onClick={onAdd}>
            + Add
          </button>
        )}
      </div>

      {data.length === 0 ? (
        <p className="text-muted">No records yet.</p>
      ) : (
        <div className="overflow-auto" style={{ maxHeight: 300 }}>
          <ul className="list-group">
            {data.map((item) => (
              <li
                key={item.id}
                className="list-group-item d-flex justify-content-between align-items-start"
              >
                <div
                  className="flex-grow-1 overflow-hidden"
                  style={{ minWidth: 0 }}
                >
                  {render(item)}
                </div>
                {editable && (
                  <div className="ms-2 btn-group btn-group-sm">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => onEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => onDelete(item)}
                    >
                      Del
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
