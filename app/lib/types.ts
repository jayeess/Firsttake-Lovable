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
export type AuditionType =
  | 'FILM'
  | 'SERIES'
  | 'COMMERCIAL'
  | 'THEATRE'
  | 'VOICE_OVER'
  | 'LIVE_EVENT'
  | 'OTHER';
export type WorkMode = 'ONSITE' | 'REMOTE' | 'HYBRID';
export type PaymentType = 'PAID' | 'UNPAID' | 'HONORARIUM' | 'UNSPECIFIED';
export type ApplicationStatus =
  | 'APPLIED'
  | 'VIEWED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'MAYBE'
  | 'REJECTED'
  | 'SELECTED'
  | 'WITHDRAWN';
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
  | 'application_under_review'
  | 'application_shortlisted'
  | 'application_maybe'
  | 'application_rejected'
  | 'application_selected'
  | 'audition_published'
  | 'audition_removed'
  | 'audition_restored'
  | 'talent_profile_photo_uploaded'
  | 'talent_portfolio_media_added'
  | 'talent_media_hidden'
  | 'talent_media_removed'
  | 'public_profile_enabled'
  | 'public_profile_disabled'
  | 'public_slug_changed'
  | 'public_profile_admin_disabled'
  | 'conversation_started'
  | 'new_message'
  | 'conversation_closed'
  | 'user_suspended'
  | 'user_restored'
  | 'report_received'
  | 'report_submitted_admin_alert'
  | 'report_resolved'
  | 'content_removed'
  | 'account_suspended'
  | 'conversation_blocked';
export type ConversationStatus = 'active' | 'archived' | 'blocked' | 'closed';
export type MessageModerationStatus = 'active' | 'hidden' | 'removed';
export type ReportTargetType =
  | 'audition'
  | 'talentProfile'
  | 'publicProfile'
  | 'media'
  | 'message'
  | 'conversation'
  | 'recruiter'
  | 'talent';
export type ReportReasonCode =
  | 'fake_audition'
  | 'scam_or_fraud'
  | 'inappropriate_content'
  | 'harassment'
  | 'spam'
  | 'impersonation'
  | 'unsafe_contact_request'
  | 'misleading_information'
  | 'other';
export type ReportStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';
export type ReportPriority = 'low' | 'medium' | 'high' | 'urgent';

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
  publicProfileEnabled?: boolean;
  publicSlug?: string;
  publicShowLocation?: boolean;
  publicShowSocialLinks?: boolean;
  publicProfileCreatedAt?: Date | Timestamp;
  publicProfileUpdatedAt?: Date | Timestamp;
  talentVerificationStatus?: TalentVerificationStatus;
  profileCompletenessScore?: number;
  profileCompletenessChecklist?: ProfileCompletenessChecklist;
  verifiedAt?: Date | Timestamp;
}

export interface PublicTalentMedia {
  id: string;
  type: 'image' | 'video_link' | 'showreel_link';
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  isFeatured: boolean;
  sortOrder: number;
}

export interface PublicTalentProfile {
  uid: string;
  slug: string;
  enabled: boolean;
  displayName: string;
  category: TalentCategory;
  experienceLevel: ExperienceLevel;
  location?: string;
  bio: string;
  profilePhotoUrl?: string;
  skills: string[];
  languages: string[];
  instagramUrl?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
  talentVerificationStatus: TalentVerificationStatus;
  media: PublicTalentMedia[];
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
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
  targetType:
    | 'recruiter'
    | 'talent'
    | 'user'
    | 'audition'
    | 'media'
    | 'application'
    | 'conversation'
    | 'message'
    | 'report'
    | 'feedback';
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
  languages?: string[];
  auditionType?: AuditionType;
  workMode?: WorkMode;
  paymentType?: PaymentType;
  searchKeywords?: string[];
  normalizedTitle?: string;
  normalizedLocation?: string;
  normalizedCategory?: string;
  normalizedLanguages?: string[];
  deadline: Date | Timestamp;
  status: AuditionStatus;
  moderationStatus?: ModerationStatus;
  moderationReason?: string;
  recruiterVerified?: boolean;
  applicantCount: number;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface SavedAudition {
  auditionId: string;
  savedAt?: Date | Timestamp;
  titleSnapshot: string;
  recruiterId: string;
  deadlineSnapshot: Date | Timestamp;
}

export interface Application {
  id: string;
  auditionId: string;
  talentId: string;
  talentEmail?: string;
  coverMessage?: string;
  status: ApplicationStatus;
  recruiterStatus?: ApplicationStatus;
  recruiterNote?: string;
  recruiterNotes?: string;
  recruiterRating?: number;
  internalTags?: string[];
  rejectionReason?: string;
  reviewedAt?: Date | Timestamp;
  shortlistedAt?: Date | Timestamp;
  rejectedAt?: Date | Timestamp;
  selectedAt?: Date | Timestamp;
  statusUpdatedAt?: Date | Timestamp;
  statusUpdatedBy?: string;
  lastRecruiterActionAt?: Date | Timestamp;
  statusHistory?: Array<{
    status: ApplicationStatus;
    changedBy: string;
    changedAt?: Date | Timestamp;
  }>;
  createdAt?: Date | Timestamp;
  lastStatusChange?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  audition?: Audition | null;
}

export interface Conversation {
  id: string;
  applicationId: string;
  auditionId: string;
  recruiterId: string;
  talentId: string;
  participantIds: string[];
  participantRoles: Record<string, 'TALENT' | 'RECRUITER'>;
  titleSnapshot: string;
  auditionTitleSnapshot: string;
  talentNameSnapshot: string;
  recruiterNameSnapshot: string;
  applicationStatus: ApplicationStatus;
  lastMessageText: string;
  lastMessageAt?: Date | Timestamp | string;
  lastMessageSenderId?: string;
  unreadBy: string[];
  status: ConversationStatus;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  createdBy: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'TALENT' | 'RECRUITER';
  body: string;
  createdAt?: Date | Timestamp | string;
  editedAt?: Date | Timestamp | string;
  deletedAt?: Date | Timestamp | string;
  moderationStatus: MessageModerationStatus;
  readBy: string[];
  system: boolean;
  metadata: Record<string, unknown>;
}

export interface AbuseReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetKey: string;
  targetOwnerId: string | null;
  reporterId: string;
  reporterRole: NotificationRole;
  reasonCode: ReportReasonCode;
  reasonText: string;
  status: ReportStatus;
  priority: ReportPriority;
  evidenceSnapshots: Record<string, unknown>;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  reviewedBy?: string | null;
  reviewedAt?: Date | Timestamp | string | null;
  resolutionAction?: string | null;
  resolutionNote?: string | null;
  adminOnlyNotes?: string | null;
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
    | 'media'
    | 'public_profile'
    | 'conversation'
    | 'report';
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
