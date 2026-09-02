export type ProfileRole = 'student' | 'mentor' | 'admin';

export interface Profile {
  id: string;
  role: ProfileRole;
  name: string;
  bio: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  key: 'career' | 'skill' | 'project' | 'academic';
  label: string;
}

export interface MentorCategory {
  mentor_id: string;
  category_id: number;
}

export type MatchRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface MatchRequest {
  id: string;
  student_id: string;
  mentor_id: string;
  category_id: number;
  status: MatchRequestStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}
