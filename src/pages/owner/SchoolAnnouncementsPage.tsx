import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import { api } from "../../api/client";

type Announcement = {
  id: number;
  teacherId: number;
  title: string;
  message: string;
  createdAt: string;
};

export default function SchoolAnnouncementsPage() {
  const { id: schoolId } = useParams();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get<Announcement[]>(`/schools/${schoolId}/announcements`)
      .then((res) =>
        setAnnouncements(
          [...res.data].sort(
            (a, b) =>
              dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
          )
        )
      )
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [schoolId]);

  return (
    <div>
      <div className="text-center mb-3">
        <h5 className="mb-0">Announcements</h5>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : announcements.length === 0 ? (
        <p className="text-muted">No announcements.</p>
      ) : (
        <ul className="list-group">
          {announcements.map((a) => (
            <li key={a.id} className="list-group-item">
              <div className="fw-semibold">{a.title}</div>
              <small className="text-muted">
                {dayjs(a.createdAt).format("DD MMM YYYY HH:mm")}
              </small>
              <p className="mb-0 mt-2 white-space-pre-line">{a.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
