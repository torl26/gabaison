export type ProfileRole = 'student' | 'mentor' | 'admin';

export interface Profile {
  id: string;
  role: ProfileRole;
  name: string;
  bio: string;
  avatar_url: string | null;
  headline: string;
  affiliation: string;
  title: string;
  experience_years: number | null;
  availability: string;
  accepting: boolean;
  skills: string[];
  topics: string[];
  github_url: string | null;
  x_url: string | null;
  website_url: string | null;
  alma_mater: string;
  alma_mater_department: string;
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

export type MatchRequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'completed';

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

export interface Review {
  id: string;
  match_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export type BadgeSource = 'manual' | 'match_count';

export interface BadgeDefinition {
  id: string;
  slug: string;
  label: string;
  icon: string;
  source: BadgeSource;
  threshold: number | null;
  created_by: string | null;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_definition_id: string;
  awarded_by: string | null;
  awarded_at: string;
}
