import type { Timestamp } from 'firebase/firestore';

export type UserType = 'TALENT' | 'RECRUITER' | 'ADMIN';
export type TalentCategory =
  | 'ACTOR'
  | 'MODEL'
  | 'DANCER'
  | 'VOICE_ARTIST'
  | 'ANCHOR';
export type ExperienceLevel =
  | 'FRESHER'
  | '1_3_YRS'
  | '3_5_YRS'
  | '5_PLUS_YRS';
export type AuditionStatus = 'ACTIVE' | 'CLOSED' | 'CANCELLED' | 'DRAFT';
export type ApplicationStatus =
  | 'APPLIED'
  | 'VIEWED'
  | 'SHORTLISTED'
  | 'REJECTED';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';
export type VerificationStatus =
  | 'not_submitted'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended';
export type TalentVerificationStatus =
  | 'not_submitted'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'suspended';
export type ModerationStatus = 'VISIBLE' | 'REMOVED';
export type TalentMediaType =
  | 'image'
  | 'video_link'
  | 'showreel_link'
  | 'document';
export type TalentMediaVisibility = 'private' | 'recruiters' | 'public';
export type TalentMediaModerationStatus = 'active' | 'hidden' | 'removed';
export type NotificationRole = 'TALENT' | 'RECRUITER' | 'ADMIN';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH';
export type NotificationType =
  | 'recruiter_verification_submitted'
  | 'recruiter_verification_approved'
  | 'recruiter_verification_rejected'
  | 'talent_verification_submitted'
  | 'talent_verified'
  | 'talent_rejected'
  | 'application_submitted'
  | 'application_withdrawn'
  | 'application_viewed'
  | 'application_shortlisted'
  | 'application_rejected'
  | 'audition_published'
  | 'audition_removed'
  | 'audition_restored'
  | 'talent_profile_photo_uploaded'
  | 'talent_portfolio_media_added'
  | 'talent_media_hidden'
  | 'talent_media_removed'
  | 'user_suspended'
  | 'user_restored';

export type ProfileCompletenessChecklist = Record<
  | 'basicInfo'
  | 'demographics'
  | 'category'
  | 'experience'
  | 'location'
  | 'bio'
  | 'professionalLinks'
  | 'profilePhoto'
  | 'portfolioMedia'
  | 'skillsAndLanguages',
  boolean
>;

export interface TalentProfile {
  firstName: string;
  lastName: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  height: string;
  bio: string;
  category: TalentCategory;
  experienceLevel: ExperienceLevel;
  location: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
  profilePhotoUrl?: string;
  profilePhotoPath?: string;
  portfolioMediaCount?: number;
  featuredMediaId?: string;
  mediaUpdatedAt?: Date | Timestamp;
  skills?: string[];
  languages?: string[];
  isPublic: boolean;
  talentVerificationStatus?: TalentVerificationStatus;
  profileCompletenessScore?: number;
  profileCompletenessChecklist?: ProfileCompletenessChecklist;
  verifiedAt?: Date | Timestamp;
}

export interface TalentVerification {
  talentId: string;
  talentEmail?: string | null;
  talentVerificationStatus: TalentVerificationStatus;
  profileCompletenessScore: number;
  profileCompletenessChecklist: ProfileCompletenessChecklist;
  identityVerificationNote?: string;
  portfolioReviewNote?: string;
  verifiedAt?: Date | Timestamp;
  rejectedReason?: string;
  submittedAt?: Date | Timestamp;
  reviewedAt?: Date | Timestamp;
  reviewedBy?: string;
  updatedAt?: Date | Timestamp;
}

export interface TalentMedia {
  id: string;
  ownerId: string;
  type: TalentMediaType;
  title: string;
  description: string;
  url?: string;
  storagePath?: string;
  thumbnailUrl?: string;
  externalUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  sortOrder: number;
  isFeatured: boolean;
  visibility: TalentMediaVisibility;
  moderationStatus: TalentMediaModerationStatus;
  moderationReason?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface RecruiterProfile {
  companyName: string;
  phone: string;
  address: string;
  website?: string;
  bio?: string;
  companyLogo?: string;
  isVerified?: boolean;
  verificationStatus?: VerificationStatus;
}

export interface RecruiterVerification {
  recruiterId: string;
  recruiterEmail?: string | null;
  legalName: string;
  contactPerson: string;
  phone: string;
  website?: string;
  socialProofUrl?: string;
  businessType: string;
  workDescription: string;
  verificationNotes?: string;
  status: VerificationStatus;
  adminNote?: string;
  reviewedBy?: string;
  submittedAt?: Date | Timestamp;
  reviewedAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface AuditLog {
  id: string;
  action: string;
  actorUid: string;
  actorEmail?: string | null;
  targetUid?: string;
  targetId?: string;
  targetType: 'recruiter' | 'talent' | 'user' | 'audition' | 'media';
  reason?: string;
  note?: string;
  timestamp?: Date | Timestamp;
  metadata?: Record<string, unknown>;
}

export interface Audition {
  id: string;
  recruiterId: string;
  recruiterName?: string;
  title: string;
  description: string;
  category: TalentCategory;
  experienceLevel: ExperienceLevel;
  location: string;
  duration: string;
  requirements: string;
  numberOfPositions: number;
  payInfo?: string;
  deadline: Date | Timestamp;
  status: AuditionStatus;
  moderationStatus?: ModerationStatus;
  moderationReason?: string;
  recruiterVerified?: boolean;
  applicantCount: number;
  createdAt?: Date | Timestamp;
}

export interface Application {
  id: string;
  auditionId: string;
  talentId: string;
  talentEmail?: string;
  coverMessage?: string;
  status: ApplicationStatus;
  recruiterNotes?: string;
  rejectionReason?: string;
  createdAt?: Date | Timestamp;
  lastStatusChange?: Date | Timestamp;
  audition?: Audition | null;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  recipientRole: NotificationRole;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?:
    | 'application'
    | 'audition'
    | 'verification'
    | 'user'
    | 'media';
  relatedEntityId?: string;
  actionUrl?: string;
  read: boolean;
  createdAt?: Date | Timestamp | string;
  createdBy: string;
  priority: NotificationPriority;
  metadata: Record<string, unknown>;
}

export interface AuditionApplicant {
  application: Application;
  talent: TalentProfile | null;
  media: TalentMedia[];
}

export const CATEGORY_LABELS: Record<TalentCategory, string> = {
  ACTOR: 'Actor',
  MODEL: 'Model',
  DANCER: 'Dancer',
  VOICE_ARTIST: 'Voice artist',
  ANCHOR: 'Anchor',
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  FRESHER: 'Fresher',
  '1_3_YRS': '1-3 years',
  '3_5_YRS': '3-5 years',
  '5_PLUS_YRS': '5+ years',
};

export const formatDate = (value?: Date | Timestamp): string => {
  if (!value) {
    return 'Not specified';
  }

  const date = value instanceof Date ? value : value.toDate();
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};
