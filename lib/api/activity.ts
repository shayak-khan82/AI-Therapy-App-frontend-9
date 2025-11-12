
const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://ai-agents-backend-2.onrender.com";

/* ✅ Get User Activities */
export async function getUserActivities() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/activity`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to load activities");
  }

  return res.json();
}

/* ✅ Log Activity */
export async function logActivity(data: any) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/activity`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to log activity");
  }

  return res.json();
}

/* ✅ Save Mood */
export async function saveMoodData({
  mood,
  note,
}: {
  mood: number;
  note: string;
}) {
  return logActivity({
    type: "mood",
    name: "Mood Check-in",
    moodScore: mood,
    description: note,
    completed: true,
  });
}
// ✅ Add this function
export async function updateActivityStatus(id: string, completed: boolean) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/activity/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ completed }),
    }
  );

  if (!res.ok) throw new Error("Failed to update activity");
  return res.json();
}
