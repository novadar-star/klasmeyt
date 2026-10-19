export type Role = "mentee" | "mentor" | "admin";
export type VStatus = "submitted" | "pending" | "under_review" | "verified" | "info_requested" | "rejected";

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  email: string;
  year_level: string | null;
  program: string | null;
  about: string | null;
  interests: string | null;
  preferred_schedule: string | null;
  mentoring_format: "one_on_one" | "group" | "both" | null;
  intro: string | null;
  academic_experience: string | null;
  skills_achievements: string | null;
  vouched_by: string | null;
  privacy_consent_at: string | null;
  modality: string | null;
  created_at: string;
};

export type Verification = {
  user_id: string;
  kind: Role;
  status: VStatus;
  reviewer_note: string | null;
  reviewed_at: string | null;
  updated_at: string;
};

export type Slot = { id?: string; user_id?: string; day: number; start_time: string; end_time: string };

export type Doc = { id: string; owner_id: string; type: "coe" | "student_id" | "academic_record" | "cv"; path: string; file_name: string | null; uploaded_at: string };

export type Group = { id: string; mentor_id: string; subject_id: number; kind: "individual" | "group"; name: string; created_at: string };

export type Session = {
  id: string;
  group_id: string;
  mentor_id: string;
  subject_id: number;
  proposed_by: string;
  starts_at: string;
  duration_min: number;
  format: "individual" | "group";
  teams_link: string | null;
  notes: string | null;
  status: "pending" | "scheduled" | "completed" | "cancelled";
  mentor_confirmed: boolean;
  created_at: string;
};

export const DOC_LABEL: Record<Doc["type"], string> = {
  coe: "Certificate of Enrollment",
  student_id: "Student ID",
  academic_record: "Academic record",
  cv: "CV",
};
