use ic_cdk::storage;
use candid::{CandidType, Deserialize};
use std::cell::RefCell;
use ic_cdk::api::caller;
use candid::Principal;
use ic_stable_structures::{StableBTreeMap, DefaultMemoryImpl, storable::BoundedStorable, storable::Storable};
use std::borrow::Cow;

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Artist {
    pub id: u64,
    pub name: String,
    pub bio: String,
    pub social: Option<String>,
    pub royalty_balance: u64,
    pub profile_image_url: Option<String>,
    pub links: Option<Vec<String>>,
    pub user_principal: Principal,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Comment {
    pub commenter: u64, // artist id
    pub text: String,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Split {
    pub id: u64, // artist id
    pub pct: u8, // percentage
}

#[derive(Clone, Debug, CandidType, Deserialize, PartialEq)]
pub enum TrackVisibility {
    Public,
    Private,
    InviteOnly,
}

#[derive(Clone, Debug, CandidType, Deserialize, PartialEq)]
pub enum TrackRole {
    Owner,
    Collaborator,
    Viewer,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Track {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub contributors: Vec<u64>, // artist ids
    pub version: u32,
    pub splits: Option<Vec<Split>>,
    pub comments: Vec<Comment>,
    pub payments: Vec<Payment>,
    pub visibility: TrackVisibility,
    pub invited: Vec<u64>, // user ids invited to collaborate
    pub roles: Vec<(u64, TrackRole)>, // user id, role
    pub ratings: Vec<(u64, u8)>, // user_id, rating (1-5)
    pub tags: Vec<String>,
    pub genre: Option<String>,
    pub play_count: u64, // new field for analytics
    pub downloadable: bool,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct TrackVersion {
    pub version: u32,
    pub title: String,
    pub description: String,
    pub contributors: Vec<u64>,
    pub changed_by: Principal,
    pub changed_at: u64,
    pub change_description: Option<String>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Payment {
    pub payer: u64, // artist id or user id
    pub amount: u64, // in smallest unit (e.g., tokens)
    pub timestamp: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Activity {
    pub user_id: u64,
    pub action: String,
    pub timestamp: u64,
    pub details: String,
}

// Collaboration Request and Task Management
#[derive(Clone, Debug, CandidType, Deserialize, PartialEq)]
pub enum CollabRequestStatus {
    Pending,
    Accepted,
    Declined,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct CollabRequest {
    pub id: u64,
    pub from: u64, // artist id
    pub to: u64,   // artist id
    pub track_id: u64,
    pub message: Option<String>,
    pub status: CollabRequestStatus,
    pub timestamp: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize, PartialEq)]
pub enum TaskStatus {
    Open,
    InProgress,
    Completed,
    Cancelled,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Task {
    pub id: u64,
    pub track_id: u64,
    pub assigned_to: u64, // artist id
    pub description: String,
    pub status: TaskStatus,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct User {
    pub principal: Principal,
    pub username: String,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub role: UserRole,
}

#[derive(Clone, Debug, CandidType, Deserialize, PartialEq)]
pub enum UserRole {
    User,
    Admin,
    Moderator,
}

// 1. Notifications System
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Notification {
    pub id: u64,
    pub user_principal: Principal,
    pub message: String,
    pub timestamp: u64,
    pub read: bool,
}

// 4. Playlist Management
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Playlist {
    pub id: u64,
    pub owner: Principal,
    pub name: String,
    pub description: Option<String>,
    pub track_ids: Vec<u64>,
    pub created_at: u64,
    pub updated_at: u64,
}

// --- Reporting & Moderation ---
#[derive(Clone, Debug, CandidType, Deserialize, PartialEq)]
pub enum ReportTargetType {
    User,
    Artist,
    Track,
    Comment,
}

#[derive(Clone, Debug, CandidType, Deserialize, PartialEq)]
pub enum ReportStatus {
    Pending,
    Reviewed,
    Dismissed,
    Resolved,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Report {
    pub id: u64,
    pub reporter: Principal,
    pub target_type: ReportTargetType,
    pub target_id: String, // Could be principal, artist id, track id, or comment id as string
    pub reason: String,
    pub details: Option<String>,
    pub status: ReportStatus,
    pub created_at: u64,
    pub reviewed_by: Option<Principal>,
    pub reviewed_at: Option<u64>,
    pub resolution_notes: Option<String>,
}

// --- Track Licensing/Contracts ---
#[derive(Clone, Debug, CandidType, Deserialize, PartialEq)]
pub enum LicenseType {
    AllRightsReserved,
    CreativeCommons,
    Custom,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct TrackLicense {
    pub track_id: u64,
    pub license_type: LicenseType,
    pub terms: Option<String>,
    pub contract_text: Option<String>,
    pub issued_at: u64,
}

// --- API Rate Limiting ---
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct RateLimitEntry {
    pub principal: Principal,
    pub last_call: u64,
    pub call_count: u32,
    pub window_start: u64,
}

// --- Audit Log & Admin Actions History ---
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct AuditLogEntry {
    pub id: u64,
    pub admin: Principal,
    pub action: String,
    pub target_type: String,
    pub target_id: String,
    pub timestamp: u64,
    pub details: Option<String>,
}

// --- Content Moderation Queue ---
#[derive(Clone, Debug, CandidType, Deserialize, PartialEq)]
pub enum ModerationTargetType {
    Track,
    Comment,
}

#[derive(Clone, Debug, CandidType, Deserialize, PartialEq)]
pub enum ModerationStatus {
    Pending,
    Approved,
    Removed,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct ModerationQueueItem {
    pub id: u64,
    pub target_type: ModerationTargetType,
    pub target_id: String,
    pub flagged_by: Option<Principal>,
    pub reason: String,
    pub status: ModerationStatus,
    pub created_at: u64,
    pub reviewed_by: Option<Principal>,
    pub reviewed_at: Option<u64>,
    pub notes: Option<String>,
}

// --- Suspension & Appeals ---
#[derive(Clone, Debug, CandidType, Deserialize, PartialEq)]
pub enum SuspensionTargetType {
    User,
    Artist,
    Track,
}

#[derive(Clone, Debug, CandidType, Deserialize, PartialEq)]
pub enum SuspensionStatus {
    Active,
    Lifted,
    Expired,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Suspension {
    pub id: u64,
    pub target_type: SuspensionTargetType,
    pub target_id: String,
    pub reason: String,
    pub imposed_by: Principal,
    pub imposed_at: u64,
    pub duration_secs: Option<u64>,
    pub status: SuspensionStatus,
    pub lifted_by: Option<Principal>,
    pub lifted_at: Option<u64>,
    pub notes: Option<String>,
}

#[derive(Clone, Debug, CandidType, Deserialize, PartialEq)]
pub enum AppealStatus {
    Pending,
    Approved,
    Denied,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct SuspensionAppeal {
    pub id: u64,
    pub suspension_id: u64,
    pub submitted_by: Principal,
    pub submitted_at: u64,
    pub content: String,
    pub status: AppealStatus,
    pub reviewed_by: Option<Principal>,
    pub reviewed_at: Option<u64>,
    pub notes: Option<String>,
}

// Storage for workflow management
thread_local! {
    static ARTISTS: RefCell<Vec<Artist>> = RefCell::new(Vec::new());
    static TRACKS: RefCell<Vec<Track>> = RefCell::new(Vec::new());
    static ARTIST_ID: RefCell<u64> = RefCell::new(1);
    static TRACK_ID: RefCell<u64> = RefCell::new(1);
    static TRACK_VERSIONS: RefCell<Vec<(u64, Vec<TrackVersion>)>> = RefCell::new(Vec::new()); // track_id -> versions
    static ACTIVITY_LOG: RefCell<Vec<Activity>> = RefCell::new(Vec::new());
    static COLLAB_REQUESTS: RefCell<Vec<CollabRequest>> = RefCell::new(Vec::new());
    static COLLAB_REQUEST_ID: RefCell<u64> = RefCell::new(1);
    static TASKS: RefCell<Vec<Task>> = RefCell::new(Vec::new());
    static TASK_ID: RefCell<u64> = RefCell::new(1);
    static USERS: RefCell<Vec<User>> = RefCell::new(Vec::new());
    static USER_ACTIVITY_LOG: RefCell<Vec<UserActivity>> = RefCell::new(Vec::new());
    static NOTIFICATIONS: RefCell<Vec<Notification>> = RefCell::new(Vec::new());
    static NOTIFICATION_ID: RefCell<u64> = RefCell::new(1);
    static FOLLOWED_ARTISTS: RefCell<Vec<(Principal, Vec<Principal>)>> = RefCell::new(Vec::new());
    static FOLLOWED_TRACKS: RefCell<Vec<(Principal, Vec<u64>)>> = RefCell::new(Vec::new());
    static PLAYLISTS: RefCell<Vec<Playlist>> = RefCell::new(Vec::new());
    static PLAYLIST_ID: RefCell<u64> = RefCell::new(1);
    static PLAY_COUNTS: RefCell<Vec<PlayDownloadCount>> = RefCell::new(Vec::new());
    static MESSAGES: RefCell<Vec<Message>> = RefCell::new(Vec::new());
    static MESSAGE_ID: RefCell<u64> = RefCell::new(1);
    static REPORTS: RefCell<Vec<Report>> = RefCell::new(Vec::new());
    static REPORT_ID: RefCell<u64> = RefCell::new(1);
    static TRACK_LICENSES: RefCell<Vec<TrackLicense>> = RefCell::new(Vec::new());
    static RATE_LIMITS: RefCell<Vec<RateLimitEntry>> = RefCell::new(Vec::new());
    static AUDIT_LOG: RefCell<Vec<AuditLogEntry>> = RefCell::new(Vec::new());
    static AUDIT_LOG_ID: RefCell<u64> = RefCell::new(1);
    static MODERATION_QUEUE: RefCell<Vec<ModerationQueueItem>> = RefCell::new(Vec::new());
    static MODERATION_QUEUE_ID: RefCell<u64> = RefCell::new(1);
    static SUSPENSIONS: RefCell<Vec<Suspension>> = RefCell::new(Vec::new());
    static SUSPENSION_ID: RefCell<u64> = RefCell::new(1);
    static SUSPENSION_APPEALS: RefCell<Vec<SuspensionAppeal>> = RefCell::new(Vec::new());
    static SUSPENSION_APPEAL_ID: RefCell<u64> = RefCell::new(1);
    static BANNED_KEYWORDS: RefCell<Vec<String>> = RefCell::new(vec![
        "spam".to_string(),
        "scam".to_string(),
        "fake".to_string(),
        "copyright".to_string(),
        "illegal".to_string(),
    ]);
    
    // Workflow management storage
    static WORKFLOW_STEPS: RefCell<Vec<WorkflowStep>> = RefCell::new(Vec::new());
    static COLLABORATION_SESSIONS: RefCell<Vec<CollaborationSession>> = RefCell::new(Vec::new());
    static WORKFLOW_TEMPLATES: RefCell<Vec<WorkflowTemplate>> = RefCell::new(Vec::new());
    static WORKFLOW_STEP_ID: RefCell<u64> = RefCell::new(1);
    static SESSION_ID: RefCell<u64> = RefCell::new(1);
    static TEMPLATE_ID: RefCell<u64> = RefCell::new(1);
    static TRACK_FILES: RefCell<StableBTreeMap<u64, TrackFile, DefaultMemoryImpl>> = RefCell::new(StableBTreeMap::new(DefaultMemoryImpl::default()));
}

/// Max file size: 10MB
const MAX_FILE_SIZE: usize = 10 * 1024 * 1024;

#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

// Artist CRUD
#[ic_cdk::update]
fn register_artist(name: String, bio: String, social: Option<String>, profile_image_url: Option<String>, links: Option<Vec<String>>) -> Option<Artist> {
    if name.trim().is_empty() {
        return None;
    }
    let principal = caller();
    ARTISTS.with(|artists| {
        ARTIST_ID.with(|id| {
            let mut id_mut = id.borrow_mut();
            let artist = Artist {
                id: *id_mut,
                name: name.clone(),
                bio: bio.clone(),
                social: social.clone(),
                royalty_balance: 0,
                profile_image_url: profile_image_url.clone(),
                links: links.clone(),
                user_principal: principal,
            };
            artists.borrow_mut().push(artist.clone());
            *id_mut += 1;
            let now = ic_cdk::api::time() / 1_000_000;
            log_user_activity(principal, "register_artist", now, &format!("Registered artist: {}", name));
            Some(artist)
        })
    })
}

#[ic_cdk::query]
fn get_artist(id: u64) -> Option<Artist> {
    ARTISTS.with(|artists| artists.borrow().iter().find(|a| a.id == id).cloned())
}

#[ic_cdk::update]
fn update_artist(id: u64, name: String, bio: String, social: Option<String>, profile_image_url: Option<String>, links: Option<Vec<String>>) -> Option<Artist> {
    let principal = caller();
    ARTISTS.with(|artists| {
        let mut artists = artists.borrow_mut();
        if let Some(artist) = artists.iter_mut().find(|a| a.id == id) {
            artist.name = name.clone();
            artist.bio = bio.clone();
            artist.social = social.clone();
            artist.profile_image_url = profile_image_url.clone();
            artist.links = links.clone();
            let now = ic_cdk::api::time() / 1_000_000;
            log_user_activity(principal, "update_artist", now, &format!("Updated artist: {}", name));
            return Some(artist.clone());
        }
        None
    })
}

#[ic_cdk::query]
fn list_artists() -> Vec<Artist> {
    ARTISTS.with(|artists| artists.borrow().clone())
}

// Track CRUD
#[ic_cdk::update]
fn create_track(title: String, description: String, contributors: Vec<u64>) -> Option<Track> {
    if title.trim().is_empty() || description.trim().is_empty() || contributors.is_empty() {
        return None;
    }
    let now = ic_cdk::api::time() / 1_000_000;
    let contributors_for_log = contributors.clone();
    let track_id = TRACK_ID.with(|id| {
        let mut id_mut = id.borrow_mut();
        let current_id = *id_mut;
        *id_mut += 1;
        current_id
    });
    
    // Check content for banned words
    let content_to_check = format!("{} {}", title, description);
    auto_flag_content_if_needed(ModerationTargetType::Track, track_id.to_string(), &content_to_check);
    
    let creator = caller();
    TRACKS.with(|tracks| {
        let mut roles = vec![];
        for &cid in &contributors {
            roles.push((cid, TrackRole::Owner));
        }
        let track = Track {
            id: track_id,
            title: title.clone(),
            description: description.clone(),
            contributors: contributors.clone(),
            version: 1,
            splits: None,
            comments: vec![],
            payments: vec![],
            visibility: TrackVisibility::Public,
            invited: vec![],
            roles,
            ratings: vec![],
            tags: vec![],
            genre: None,
            play_count: 0,
            downloadable: true,
        };
        tracks.borrow_mut().push(track.clone());
        // Store initial version
        TRACK_VERSIONS.with(|tv| {
            let mut tv = tv.borrow_mut();
            let version = TrackVersion {
                version: 1,
                title,
                description,
                contributors,
                changed_by: creator,
                changed_at: now,
                change_description: Some("Initial version".to_string()),
            };
            tv.push((track.id, vec![version]));
        });
        // Log activity for each contributor
        for &cid in &contributors_for_log {
            log_activity(cid, "create_track", now, &format!("Track {} created", track.id));
        }
        Some(track)
    })
}

#[ic_cdk::query]
fn get_track(id: u64) -> Option<Track> {
    TRACKS.with(|tracks| tracks.borrow().iter().find(|t| t.id == id).cloned())
}

#[ic_cdk::update]
fn update_track(id: u64, title: String, description: String, contributors: Vec<u64>, version: u32) -> Option<Track> {
    TRACKS.with(|tracks| {
        let mut tracks = tracks.borrow_mut();
        if let Some(track) = tracks.iter_mut().find(|t| t.id == id) {
            track.title = title;
            track.description = description;
            track.contributors = contributors;
            track.version = version;
            return Some(track.clone());
        }
        None
    })
}

#[ic_cdk::query]
fn list_tracks() -> Vec<Track> {
    TRACKS.with(|tracks| tracks.borrow().clone())
}

// Add/Update splits for a track
#[ic_cdk::update]
fn set_track_splits(track_id: u64, splits: Vec<Split>) -> Option<Track> {
    TRACKS.with(|tracks| {
        let mut tracks = tracks.borrow_mut();
        if let Some(track) = tracks.iter_mut().find(|t| t.id == track_id) {
            track.splits = Some(splits);
            return Some(track.clone());
        }
        None
    })
}

#[ic_cdk::query]
fn get_track_splits(track_id: u64) -> Option<Vec<Split>> {
    TRACKS.with(|tracks| {
        tracks.borrow().iter().find(|t| t.id == track_id).and_then(|t| t.splits.clone())
    })
}

// Add a comment to a track
#[ic_cdk::update]
fn add_comment(track_id: u64, commenter: u64, text: String) -> Option<Track> {
    let now = ic_cdk::api::time() / 1_000_000;
    
    // Check comment for banned words
    auto_flag_content_if_needed(ModerationTargetType::Comment, format!("track_{}_comment_{}", track_id, now), &text);
    
    TRACKS.with(|tracks| {
        let mut tracks = tracks.borrow_mut();
        if let Some(track) = tracks.iter_mut().find(|t| t.id == track_id) {
            track.comments.push(Comment { commenter, text: text.clone() });
            log_activity(commenter, "add_comment", now, &format!("Commented on track {}: {}", track_id, text));
            return Some(track.clone());
        }
        None
    })
}

#[ic_cdk::query]
fn list_comments(track_id: u64) -> Vec<Comment> {
    TRACKS.with(|tracks| {
        tracks.borrow().iter().find(|t| t.id == track_id).map(|t| t.comments.clone()).unwrap_or_default()
    })
}

// Add a new version to a track
#[ic_cdk::update]
fn add_track_version(track_id: u64, title: String, description: String, contributors: Vec<u64>, change_description: Option<String>) -> Option<TrackVersion> {
    let now = ic_cdk::api::time() / 1_000_000;
    let changer = caller();
    TRACK_VERSIONS.with(|tv| {
        let mut tv = tv.borrow_mut();
        if let Some((id, versions)) = tv.iter_mut().find(|(tid, _)| *tid == track_id) {
            let new_version_num = versions.len() as u32 + 1;
            let version = TrackVersion {
                version: new_version_num,
                title: title.clone(),
                description: description.clone(),
                contributors: contributors.clone(),
                changed_by: changer,
                changed_at: now,
                change_description,
            };
            versions.push(version.clone());
            // Update the main track
            TRACKS.with(|tracks| {
                if let Some(track) = tracks.borrow_mut().iter_mut().find(|t| t.id == track_id) {
                    track.title = title;
                    track.description = description;
                    track.contributors = contributors;
                    track.version = new_version_num;
                }
            });
            Some(version)
        } else {
            None
        }
    })
}

#[ic_cdk::query]
fn get_track_versions(track_id: u64) -> Vec<TrackVersion> {
    TRACK_VERSIONS.with(|tv| {
        tv.borrow().iter().find(|(id, _)| *id == track_id).map(|(_, versions)| versions.clone()).unwrap_or_default()
    })
}

// Search tracks by title (case-insensitive substring)
#[ic_cdk::query]
fn search_tracks_by_title(query: String) -> Vec<Track> {
    let q = query.to_lowercase();
    TRACKS.with(|tracks| {
        if q.is_empty() {
            tracks.borrow().clone()
        } else {
            tracks.borrow().iter().filter(|t| t.title.to_lowercase().contains(&q)).cloned().collect()
        }
    })
}

// Search tracks by contributor (artist id)
#[ic_cdk::query]
fn search_tracks_by_contributor(artist_id: u64) -> Vec<Track> {
    TRACKS.with(|tracks| {
        tracks.borrow().iter().filter(|t| t.contributors.contains(&artist_id)).cloned().collect()
    })
}

// Delete a track by id
#[ic_cdk::update]
fn delete_track(track_id: u64) -> bool {
    let mut deleted = false;
    TRACKS.with(|tracks| {
        let mut tracks = tracks.borrow_mut();
        let len_before = tracks.len();
        tracks.retain(|t| t.id != track_id);
        deleted = tracks.len() < len_before;
    });
    TRACK_VERSIONS.with(|tv| {
        let mut tv = tv.borrow_mut();
        tv.retain(|(id, _)| *id != track_id);
    });
    deleted
}

// Distribute payment for a track
#[ic_cdk::update]
fn distribute_payment(track_id: u64, payer: u64, amount: u64, timestamp: u64) -> bool {
    let mut distributed = false;
    TRACKS.with(|tracks| {
        let mut tracks = tracks.borrow_mut();
        if let Some(track) = tracks.iter_mut().find(|t| t.id == track_id) {
            if let Some(splits) = &track.splits {
                for split in splits {
                    let share = amount * (split.pct as u64) / 100;
                    // Debug: log split info
                    ic_cdk::println!("Distributing {} to artist {} ({}%)", share, split.id, split.pct);
                    ARTISTS.with(|artists| {
                        let mut artists = artists.borrow_mut();
                        if let Some(artist) = artists.iter_mut().find(|a| a.id == split.id) {
                            artist.royalty_balance += share;
                            ic_cdk::println!("Updated artist {} balance: {}", artist.id, artist.royalty_balance);
                        } else {
                            ic_cdk::println!("Artist {} not found for royalty distribution", split.id);
                        }
                    });
                }
                track.payments.push(Payment { payer, amount, timestamp });
                distributed = true;
                log_activity(payer, "distribute_payment", timestamp, &format!("Paid {} for track {}", amount, track_id));
            } else {
                ic_cdk::println!("No splits set for track {}", track_id);
            }
        } else {
            ic_cdk::println!("Track {} not found for payment distribution", track_id);
        }
    });
    distributed
}

// View artist royalty balance
#[ic_cdk::query]
fn get_royalty_balance(artist_id: u64) -> u64 {
    ARTISTS.with(|artists| {
        artists.borrow().iter().find(|a| a.id == artist_id).map(|a| a.royalty_balance).unwrap_or(0)
    })
}

// View payment history for a track
#[ic_cdk::query]
fn get_payment_history(track_id: u64) -> Vec<Payment> {
    TRACKS.with(|tracks| {
        tracks.borrow().iter().find(|t| t.id == track_id).map(|t| t.payments.clone()).unwrap_or_default()
    })
}

// Set track visibility
#[ic_cdk::update]
fn set_track_visibility(track_id: u64, visibility: TrackVisibility) -> bool {
    TRACKS.with(|tracks| {
        let mut tracks = tracks.borrow_mut();
        if let Some(track) = tracks.iter_mut().find(|t| t.id == track_id) {
            track.visibility = visibility;
            return true;
        }
        false
    })
}

// Get track visibility
#[ic_cdk::query]
fn get_track_visibility(track_id: u64) -> Option<TrackVisibility> {
    TRACKS.with(|tracks| {
        tracks.borrow().iter().find(|t| t.id == track_id).map(|t| t.visibility.clone())
    })
}

// Invite user to track
#[ic_cdk::update]
fn invite_user(track_id: u64, user_id: u64) -> bool {
    TRACKS.with(|tracks| {
        let mut tracks = tracks.borrow_mut();
        if let Some(track) = tracks.iter_mut().find(|t| t.id == track_id) {
            if !track.invited.contains(&user_id) {
                track.invited.push(user_id);
            }
            return true;
        }
        false
    })
}

// Assign role to user
#[ic_cdk::update]
fn assign_role(track_id: u64, user_id: u64, role: TrackRole) -> bool {
    TRACKS.with(|tracks| {
        let mut tracks = tracks.borrow_mut();
        if let Some(track) = tracks.iter_mut().find(|t| t.id == track_id) {
            if let Some(r) = track.roles.iter_mut().find(|(id, _)| *id == user_id) {
                r.1 = role;
            } else {
                track.roles.push((user_id, role));
            }
            return true;
        }
        false
    })
}

// Get user role for a track
#[ic_cdk::query]
fn get_user_role(track_id: u64, user_id: u64) -> Option<TrackRole> {
    TRACKS.with(|tracks| {
        tracks.borrow().iter().find(|t| t.id == track_id)
            .and_then(|track| track.roles.iter().find(|(id, _)| *id == user_id).map(|(_, role)| role.clone()))
    })
}

// Helper to log activity
fn log_activity(user_id: u64, action: &str, timestamp: u64, details: &str) {
    ACTIVITY_LOG.with(|log| {
        log.borrow_mut().push(Activity {
            user_id,
            action: action.to_string(),
            timestamp,
            details: details.to_string(),
        });
    });
}

// Fetch user activity
#[ic_cdk::query]
fn get_user_activity(user_id: u64) -> Vec<Activity> {
    ACTIVITY_LOG.with(|log| {
        log.borrow().iter().filter(|a| a.user_id == user_id).cloned().collect()
    })
}

// Fetch recent activity (most recent N)
#[ic_cdk::query]
fn get_recent_activity(count: u32) -> Vec<Activity> {
    ACTIVITY_LOG.with(|log| {
        let log = log.borrow();
        let len = log.len();
        let start = if len > count as usize { len - count as usize } else { 0 };
        log[start..].to_vec()
    })
}

// Rate a track
#[ic_cdk::update]
fn rate_track(track_id: u64, user_id: u64, rating: u8) -> bool {
    if rating < 1 || rating > 5 {
        return false;
    }
    TRACKS.with(|tracks| {
        let mut tracks = tracks.borrow_mut();
        if let Some(track) = tracks.iter_mut().find(|t| t.id == track_id) {
            if let Some(r) = track.ratings.iter_mut().find(|(uid, _)| *uid == user_id) {
                r.1 = rating;
            } else {
                track.ratings.push((user_id, rating));
            }
            return true;
        }
        false
    })
}

// Get average rating and count for a track
#[ic_cdk::query]
fn get_track_rating(track_id: u64) -> (u32, u8) {
    TRACKS.with(|tracks| {
        tracks.borrow().iter().find(|t| t.id == track_id).map(|t| {
            let count = t.ratings.len() as u32;
            let sum: u32 = t.ratings.iter().map(|(_, r)| *r as u32).sum();
            let avg = if count > 0 { (sum / count) as u8 } else { 0 };
            (count, avg)
        }).unwrap_or((0, 0))
    })
}

// Get a user's rating for a track
#[ic_cdk::query]
fn get_user_track_rating(track_id: u64, user_id: u64) -> Option<u8> {
    TRACKS.with(|tracks| {
        tracks.borrow().iter().find(|t| t.id == track_id)
            .and_then(|t| t.ratings.iter().find(|(uid, _)| *uid == user_id).map(|(_, r)| *r))
    })
}

// Add a tag to a track
#[ic_cdk::update]
fn add_tag(track_id: u64, tag: String) -> bool {
    TRACKS.with(|tracks| {
        let mut tracks = tracks.borrow_mut();
        if let Some(track) = tracks.iter_mut().find(|t| t.id == track_id) {
            if !track.tags.contains(&tag) {
                track.tags.push(tag);
            }
            return true;
        }
        false
    })
}

// Remove a tag from a track
#[ic_cdk::update]
fn remove_tag(track_id: u64, tag: String) -> bool {
    TRACKS.with(|tracks| {
        let mut tracks = tracks.borrow_mut();
        if let Some(track) = tracks.iter_mut().find(|t| t.id == track_id) {
            track.tags.retain(|t| t != &tag);
            return true;
        }
        false
    })
}

// Set genre for a track
#[ic_cdk::update]
fn set_genre(track_id: u64, genre: String) -> bool {
    TRACKS.with(|tracks| {
        let mut tracks = tracks.borrow_mut();
        if let Some(track) = tracks.iter_mut().find(|t| t.id == track_id) {
            track.genre = Some(genre);
            return true;
        }
        false
    })
}

// Get genre for a track
#[ic_cdk::query]
fn get_genre(track_id: u64) -> Option<String> {
    TRACKS.with(|tracks| {
        tracks.borrow().iter().find(|t| t.id == track_id).and_then(|t| t.genre.clone())
    })
}

// Search tracks by tag
#[ic_cdk::query]
fn search_tracks_by_tag(tag: String) -> Vec<Track> {
    TRACKS.with(|tracks| {
        tracks.borrow().iter().filter(|t| t.tags.contains(&tag)).cloned().collect()
    })
}

// Search tracks by genre
#[ic_cdk::query]
fn search_tracks_by_genre(genre: String) -> Vec<Track> {
    TRACKS.with(|tracks| {
        tracks.borrow().iter().filter(|t| t.genre.as_ref().map(|g| g == &genre).unwrap_or(false)).cloned().collect()
    })
}

// Collaboration Request Endpoints
#[ic_cdk::update]
fn send_collab_request(from: u64, to: u64, track_id: u64, message: Option<String>) -> Option<CollabRequest> {
    let now = ic_cdk::api::time() / 1_000_000;
    COLLAB_REQUESTS.with(|requests| {
        COLLAB_REQUEST_ID.with(|id| {
            let mut id_mut = id.borrow_mut();
            // Prevent duplicate pending requests
            if requests.borrow().iter().any(|r| r.from == from && r.to == to && r.track_id == track_id && r.status == CollabRequestStatus::Pending) {
                return None;
            }
            let req = CollabRequest {
                id: *id_mut,
                from,
                to,
                track_id,
                message,
                status: CollabRequestStatus::Pending,
                timestamp: now,
            };
            requests.borrow_mut().push(req.clone());
            *id_mut += 1;
            Some(req)
        })
    })
}

#[ic_cdk::update]
fn respond_collab_request(request_id: u64, accept: bool) -> Option<CollabRequest> {
    COLLAB_REQUESTS.with(|requests| {
        let mut requests = requests.borrow_mut();
        if let Some(req) = requests.iter_mut().find(|r| r.id == request_id && r.status == CollabRequestStatus::Pending) {
            req.status = if accept { CollabRequestStatus::Accepted } else { CollabRequestStatus::Declined };
            return Some(req.clone());
        }
        None
    })
}

#[ic_cdk::query]
fn list_collab_requests_for_user(user_id: u64) -> Vec<CollabRequest> {
    COLLAB_REQUESTS.with(|requests| {
        requests.borrow().iter().filter(|r| r.to == user_id || r.from == user_id).cloned().collect()
    })
}

// Task Management Endpoints
#[ic_cdk::update]
fn create_task(track_id: u64, assigned_to: u64, description: String) -> Option<Task> {
    if description.trim().is_empty() {
        return None;
    }
    let now = ic_cdk::api::time() / 1_000_000;
    TASKS.with(|tasks| {
        TASK_ID.with(|id| {
            let mut id_mut = id.borrow_mut();
            let task = Task {
                id: *id_mut,
                track_id,
                assigned_to,
                description,
                status: TaskStatus::Open,
                created_at: now,
                updated_at: now,
            };
            tasks.borrow_mut().push(task.clone());
            *id_mut += 1;
            Some(task)
        })
    })
}

#[ic_cdk::update]
fn update_task_status(task_id: u64, status: TaskStatus) -> Option<Task> {
    let now = ic_cdk::api::time() / 1_000_000;
    TASKS.with(|tasks| {
        let mut tasks = tasks.borrow_mut();
        if let Some(task) = tasks.iter_mut().find(|t| t.id == task_id) {
            task.status = status;
            task.updated_at = now;
            return Some(task.clone());
        }
        None
    })
}

#[ic_cdk::query]
fn list_tasks_for_track(track_id: u64) -> Vec<Task> {
    TASKS.with(|tasks| {
        tasks.borrow().iter().filter(|t| t.track_id == track_id).cloned().collect()
    })
}

#[ic_cdk::query]
fn list_tasks_for_user(user_id: u64) -> Vec<Task> {
    TASKS.with(|tasks| {
        tasks.borrow().iter().filter(|t| t.assigned_to == user_id).cloned().collect()
    })
}

// Royalty withdrawal endpoint
#[ic_cdk::update]
fn withdraw_royalties(artist_id: u64, amount: u64) -> bool {
    if amount == 0 {
        return false;
    }
    ARTISTS.with(|artists| {
        let mut artists = artists.borrow_mut();
        if let Some(artist) = artists.iter_mut().find(|a| a.id == artist_id) {
            if artist.royalty_balance >= amount {
                artist.royalty_balance -= amount;
                let now = ic_cdk::api::time() / 1_000_000;
                log_activity(artist_id, "withdraw_royalties", now, &format!("Withdrew {} tokens", amount));
                // In production, integrate with ICP ledger here
                return true;
            }
        }
        false
    })
}

// Analytics: increment play count
#[ic_cdk::update]
fn increment_play_count(track_id: u64) -> bool {
    TRACKS.with(|tracks| {
        let mut tracks = tracks.borrow_mut();
        if let Some(track) = tracks.iter_mut().find(|t| t.id == track_id) {
            track.play_count += 1;
            return true;
        }
        false
    })
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct TrackAnalytics {
    pub play_count: u64,
    pub revenue: u64,
    pub comments_count: u64,
    pub ratings_count: u64,
    pub avg_rating: u8,
}

#[ic_cdk::query]
fn get_track_analytics(track_id: u64) -> Option<TrackAnalytics> {
    TRACKS.with(|tracks| {
        tracks.borrow().iter().find(|t| t.id == track_id).map(|t| {
            let revenue: u64 = t.payments.iter().map(|p| p.amount).sum();
            let comments_count = t.comments.len() as u64;
            let ratings_count = t.ratings.len() as u64;
            let avg_rating = if ratings_count > 0 {
                (t.ratings.iter().map(|(_, r)| *r as u32).sum::<u32>() / ratings_count as u32) as u8
            } else { 0 };
            TrackAnalytics {
                play_count: t.play_count,
                revenue,
                comments_count,
                ratings_count,
                avg_rating,
            }
        })
    })
}

// User CRUD
#[ic_cdk::update]
pub fn register_user(username: String, bio: Option<String>, avatar_url: Option<String>) -> Option<User> {
    let principal = caller();
    if username.trim().is_empty() {
        return None;
    }
    USERS.with(|users| {
        let mut users = users.borrow_mut();
        if users.iter().any(|u| u.principal == principal) {
            return None; // Already registered
        }
        let user = User {
            principal,
            username: username.clone(),
            bio: bio.clone(),
            avatar_url: avatar_url.clone(),
            role: UserRole::User,
        };
        users.push(user.clone());
        let now = ic_cdk::api::time() / 1_000_000;
        log_user_activity(principal, "register_user", now, &format!("Registered user: {}", username));
        Some(user)
    })
}

#[ic_cdk::query]
fn get_user() -> Option<User> {
    let principal = caller();
    USERS.with(|users| users.borrow().iter().find(|u| u.principal == principal).cloned())
}

#[ic_cdk::update]
fn update_user(username: String, bio: Option<String>, avatar_url: Option<String>) -> Option<User> {
    let principal = caller();
    USERS.with(|users| {
        let mut users = users.borrow_mut();
        if let Some(user) = users.iter_mut().find(|u| u.principal == principal) {
            user.username = username.clone();
            user.bio = bio.clone();
            user.avatar_url = avatar_url.clone();
            let now = ic_cdk::api::time() / 1_000_000;
            log_user_activity(principal, "update_user", now, &format!("Updated user: {}", username));
            return Some(user.clone());
        }
        None
    })
}

#[ic_cdk::update]
fn delete_user() -> bool {
    let principal = caller();
    USERS.with(|users| {
        let mut users = users.borrow_mut();
        let len_before = users.len();
        users.retain(|u| u.principal != principal);
        let deleted = users.len() < len_before;
        if deleted {
            let now = ic_cdk::api::time() / 1_000_000;
            log_user_activity(principal, "delete_user", now, "Deleted user profile");
        }
        deleted
    })
}

// 1. List all users
#[ic_cdk::query]
fn list_users() -> Vec<User> {
    USERS.with(|users| users.borrow().clone())
}

// 2. Get user by principal
#[ic_cdk::query]
fn get_user_by_principal(principal: Principal) -> Option<User> {
    USERS.with(|users| users.borrow().iter().find(|u| u.principal == principal).cloned())
}

// 3. Search users by username (case-insensitive substring)
#[ic_cdk::query]
fn search_users_by_username(query: String) -> Vec<User> {
    let q = query.to_lowercase();
    USERS.with(|users| {
        users.borrow().iter().filter(|u| u.username.to_lowercase().contains(&q)).cloned().collect()
    })
}

// 6. User activity log
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct UserActivity {
    pub principal: Principal,
    pub action: String,
    pub timestamp: u64,
    pub details: String,
}

fn log_user_activity(principal: Principal, action: &str, timestamp: u64, details: &str) {
    USER_ACTIVITY_LOG.with(|log| {
        log.borrow_mut().push(UserActivity {
            principal,
            action: action.to_string(),
            timestamp,
            details: details.to_string(),
        });
    });
}

#[ic_cdk::query]
fn get_user_activity_log(principal: Principal) -> Vec<UserActivity> {
    USER_ACTIVITY_LOG.with(|log| {
        log.borrow().iter().filter(|a| a.principal == principal).cloned().collect()
    })
}

#[ic_cdk::update]
fn add_dummy_activity() {
    let principal = caller();
    let now = ic_cdk::api::time() / 1_000_000;
    log_user_activity(principal, "dummy_action", now, "This is a test activity");
}

// 2. Audit/Admin Tools
pub fn is_admin(principal: Principal) -> bool {
    USERS.with(|users| users.borrow().iter().any(|u| u.principal == principal && u.role == UserRole::Admin))
}

#[ic_cdk::update]
pub fn ban_user(principal_to_ban: Principal) -> bool {
    let principal = caller();
    if !is_admin(principal) { return false; }
    let mut success = false;
    USERS.with(|users| {
        let mut users = users.borrow_mut();
        if let Some(user) = users.iter_mut().find(|u| u.principal == principal_to_ban) {
            user.role = UserRole::User; // Or add a Banned role if desired
            success = true;
        }
    });
    if success {
        log_admin_action(
            principal,
            "ban_user",
            "User",
            &principal_to_ban.to_text(),
            Some("User banned by admin".to_string()),
        );
    }
    success
}

#[ic_cdk::update]
pub fn delete_user_by_admin(principal_to_delete: Principal) -> bool {
    let principal = caller();
    if !is_admin(principal) { return false; }
    let mut deleted = false;
    USERS.with(|users| {
        let mut users = users.borrow_mut();
        let len_before = users.len();
        users.retain(|u| u.principal != principal_to_delete);
        deleted = users.len() < len_before;
    });
    if deleted {
        log_admin_action(
            principal,
            "delete_user_by_admin",
            "User",
            &principal_to_delete.to_text(),
            Some("User deleted by admin".to_string()),
        );
    }
    deleted
}

#[ic_cdk::update]
pub fn delete_artist_by_admin(artist_id: u64) -> bool {
    let principal = caller();
    if !is_admin(principal) { return false; }
    let mut deleted = false;
    ARTISTS.with(|artists| {
        let mut artists = artists.borrow_mut();
        let len_before = artists.len();
        artists.retain(|a| a.id != artist_id);
        deleted = artists.len() < len_before;
    });
    if deleted {
        log_admin_action(
            principal,
            "delete_artist_by_admin",
            "Artist",
            &artist_id.to_string(),
            Some("Artist deleted by admin".to_string()),
        );
    }
    deleted
}

#[ic_cdk::update]
pub fn delete_track_by_admin(track_id: u64) -> bool {
    let principal = caller();
    if !is_admin(principal) { return false; }
    let mut deleted = false;
    TRACKS.with(|tracks| {
        let mut tracks = tracks.borrow_mut();
        let len_before = tracks.len();
        tracks.retain(|t| t.id != track_id);
        deleted = tracks.len() < len_before;
    });
    if deleted {
        log_admin_action(
            principal,
            "delete_track_by_admin",
            "Track",
            &track_id.to_string(),
            Some("Track deleted by admin".to_string()),
        );
    }
    deleted
}

// 3. Track/Artist Following
#[ic_cdk::update]
pub fn follow_artist(artist_principal: Principal) -> bool {
    let principal = caller();
    FOLLOWED_ARTISTS.with(|fa| {
        let mut fa = fa.borrow_mut();
        if let Some((p, artists)) = fa.iter_mut().find(|(p, _)| *p == principal) {
            if !artists.contains(&artist_principal) {
                artists.push(artist_principal);
            }
        } else {
            fa.push((principal, vec![artist_principal]));
        }
        true
    })
}

#[ic_cdk::update]
pub fn unfollow_artist(artist_principal: Principal) -> bool {
    let principal = caller();
    FOLLOWED_ARTISTS.with(|fa| {
        let mut fa = fa.borrow_mut();
        if let Some((p, artists)) = fa.iter_mut().find(|(p, _)| *p == principal) {
            artists.retain(|a| a != &artist_principal);
            return true;
        }
        false
    })
}

#[ic_cdk::query]
pub fn list_followed_artists() -> Vec<Principal> {
    let principal = caller();
    FOLLOWED_ARTISTS.with(|fa| {
        fa.borrow().iter().find(|(p, _)| *p == principal).map(|(_, artists)| artists.clone()).unwrap_or_default()
    })
}

#[ic_cdk::update]
pub fn follow_track(track_id: u64) -> bool {
    let principal = caller();
    FOLLOWED_TRACKS.with(|ft| {
        let mut ft = ft.borrow_mut();
        if let Some((p, tracks)) = ft.iter_mut().find(|(p, _)| *p == principal) {
            if !tracks.contains(&track_id) {
                tracks.push(track_id);
            }
        } else {
            ft.push((principal, vec![track_id]));
        }
        true
    })
}

#[ic_cdk::update]
pub fn unfollow_track(track_id: u64) -> bool {
    let principal = caller();
    FOLLOWED_TRACKS.with(|ft| {
        let mut ft = ft.borrow_mut();
        if let Some((p, tracks)) = ft.iter_mut().find(|(p, _)| *p == principal) {
            tracks.retain(|t| t != &track_id);
            return true;
        }
        false
    })
}

#[ic_cdk::query]
pub fn list_followed_tracks() -> Vec<u64> {
    let principal = caller();
    FOLLOWED_TRACKS.with(|ft| {
        ft.borrow().iter().find(|(p, _)| *p == principal).map(|(_, tracks)| tracks.clone()).unwrap_or_default()
    })
}

// Notifications System
#[ic_cdk::update]
pub fn send_notification(user_principal: Principal, message: String) -> Notification {
    let now = ic_cdk::api::time() / 1_000_000;
    let id = NOTIFICATION_ID.with(|nid| {
        let mut nid = nid.borrow_mut();
        let id = *nid;
        *nid += 1;
        id
    });
    let notification = Notification {
        id,
        user_principal,
        message,
        timestamp: now,
        read: false,
    };
    NOTIFICATIONS.with(|n| n.borrow_mut().push(notification.clone()));
    notification
}

#[ic_cdk::query]
pub fn list_notifications() -> Vec<Notification> {
    let principal = caller();
    NOTIFICATIONS.with(|n| n.borrow().iter().filter(|notif| notif.user_principal == principal).cloned().collect())
}

#[ic_cdk::update]
pub fn mark_notification_read(notification_id: u64) -> bool {
    let principal = caller();
    NOTIFICATIONS.with(|n| {
        let mut n = n.borrow_mut();
        if let Some(notif) = n.iter_mut().find(|notif| notif.id == notification_id && notif.user_principal == principal) {
            notif.read = true;
            return true;
        }
        false
    })
}

#[ic_cdk::update]
pub fn promote_to_admin() -> bool {
    let principal = caller();
    USERS.with(|users| {
        let mut users = users.borrow_mut();
        if let Some(user) = users.iter_mut().find(|u| u.principal == principal) {
            user.role = UserRole::Admin;
            return true;
        }
        false
    })
}

// 4. Playlist Management
#[ic_cdk::update]
pub fn create_playlist(name: String, description: Option<String>, track_ids: Vec<u64>) -> Option<Playlist> {
    let owner = caller();
    if name.trim().is_empty() {
        return None;
    }
    let now = ic_cdk::api::time() / 1_000_000;
    let id = PLAYLIST_ID.with(|pid| {
        let mut pid = pid.borrow_mut();
        let id = *pid;
        *pid += 1;
        id
    });
    let playlist = Playlist {
        id,
        owner,
        name,
        description,
        track_ids,
        created_at: now,
        updated_at: now,
    };
    PLAYLISTS.with(|p| p.borrow_mut().push(playlist.clone()));
    Some(playlist)
}

#[ic_cdk::update]
pub fn update_playlist(playlist_id: u64, name: String, description: Option<String>, track_ids: Vec<u64>) -> Option<Playlist> {
    let owner = caller();
    PLAYLISTS.with(|p| {
        let mut p = p.borrow_mut();
        if let Some(playlist) = p.iter_mut().find(|pl| pl.id == playlist_id && pl.owner == owner) {
            playlist.name = name;
            playlist.description = description;
            playlist.track_ids = track_ids;
            playlist.updated_at = ic_cdk::api::time() / 1_000_000;
            return Some(playlist.clone());
        }
        None
    })
}

#[ic_cdk::update]
pub fn delete_playlist(playlist_id: u64) -> bool {
    let owner = caller();
    PLAYLISTS.with(|p| {
        let mut p = p.borrow_mut();
        let len_before = p.len();
        p.retain(|pl| !(pl.id == playlist_id && pl.owner == owner));
        p.len() < len_before
    })
}

#[ic_cdk::query]
pub fn list_playlists() -> Vec<Playlist> {
    let owner = caller();
    PLAYLISTS.with(|p| p.borrow().iter().filter(|pl| pl.owner == owner).cloned().collect())
}

#[ic_cdk::query]
pub fn get_playlist(playlist_id: u64) -> Option<Playlist> {
    PLAYLISTS.with(|p| p.borrow().iter().find(|pl| pl.id == playlist_id).cloned())
}

// 5. Track Download/Streaming Controls
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct PlayDownloadCount {
    pub principal: Principal,
    pub track_id: u64,
    pub play_count: u64,
    pub download_count: u64,
}

// Extend Track with downloadable
// (Add: pub downloadable: bool, default true)
// Update Track struct definition and all usages accordingly

#[ic_cdk::update]
pub fn set_track_downloadable(track_id: u64, downloadable: bool) -> bool {
    TRACKS.with(|tracks| {
        let mut tracks = tracks.borrow_mut();
        if let Some(track) = tracks.iter_mut().find(|t| t.id == track_id) {
            track.downloadable = downloadable;
            return true;
        }
        false
    })
}

#[ic_cdk::query]
pub fn can_download_track(track_id: u64) -> bool {
    TRACKS.with(|tracks| {
        tracks.borrow().iter().find(|t| t.id == track_id).map(|t| t.downloadable).unwrap_or(false)
    })
}

#[ic_cdk::update]
pub fn record_play(track_id: u64) -> bool {
    let principal = caller();
    PLAY_COUNTS.with(|pc| {
        let mut pc = pc.borrow_mut();
        if let Some(entry) = pc.iter_mut().find(|e| e.principal == principal && e.track_id == track_id) {
            entry.play_count += 1;
        } else {
            pc.push(PlayDownloadCount { principal, track_id, play_count: 1, download_count: 0 });
        }
        true
    })
}

#[ic_cdk::update]
pub fn record_download(track_id: u64) -> bool {
    let principal = caller();
    PLAY_COUNTS.with(|pc| {
        let mut pc = pc.borrow_mut();
        if let Some(entry) = pc.iter_mut().find(|e| e.principal == principal && e.track_id == track_id) {
            entry.download_count += 1;
        } else {
            pc.push(PlayDownloadCount { principal, track_id, play_count: 0, download_count: 1 });
        }
        true
    })
}

#[ic_cdk::query]
pub fn get_user_play_count(track_id: u64) -> u64 {
    let principal = caller();
    PLAY_COUNTS.with(|pc| {
        pc.borrow().iter().find(|e| e.principal == principal && e.track_id == track_id).map(|e| e.play_count).unwrap_or(0)
    })
}

#[ic_cdk::query]
pub fn get_user_download_count(track_id: u64) -> u64 {
    let principal = caller();
    PLAY_COUNTS.with(|pc| {
        pc.borrow().iter().find(|e| e.principal == principal && e.track_id == track_id).map(|e| e.download_count).unwrap_or(0)
    })
}

// 6. User-to-User Messaging
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Message {
    pub id: u64,
    pub from: Principal,
    pub to: Principal,
    pub content: String,
    pub timestamp: u64,
    pub read: bool,
}

#[ic_cdk::update]
pub fn send_message(to: Principal, content: String) -> Option<Message> {
    let from = caller();
    if content.trim().is_empty() {
        return None;
    }
    let now = ic_cdk::api::time() / 1_000_000;
    let id = MESSAGE_ID.with(|mid| {
        let mut mid = mid.borrow_mut();
        let id = *mid;
        *mid += 1;
        id
    });
    let message = Message {
        id,
        from,
        to,
        content,
        timestamp: now,
        read: false,
    };
    MESSAGES.with(|m| m.borrow_mut().push(message.clone()));
    Some(message)
}

#[ic_cdk::query]
pub fn list_messages_with(user: Principal) -> Vec<Message> {
    let me = caller();
    MESSAGES.with(|m| {
        m.borrow().iter().filter(|msg| (msg.from == me && msg.to == user) || (msg.from == user && msg.to == me)).cloned().collect()
    })
}

#[ic_cdk::update]
pub fn mark_message_read(message_id: u64) -> bool {
    let me = caller();
    MESSAGES.with(|m| {
        let mut m = m.borrow_mut();
        if let Some(msg) = m.iter_mut().find(|msg| msg.id == message_id && msg.to == me) {
            msg.read = true;
            return true;
        }
        false
    })
}

// --- Reporting & Moderation Endpoints ---
#[ic_cdk::update]
pub fn report_content(target_type: ReportTargetType, target_id: String, reason: String, details: Option<String>) -> Option<Report> {
    let reporter = caller();
    let now = ic_cdk::api::time() / 1_000_000;
    let id = REPORT_ID.with(|rid| {
        let mut rid = rid.borrow_mut();
        let id = *rid;
        *rid += 1;
        id
    });
    let report = Report {
        id,
        reporter,
        target_type,
        target_id,
        reason,
        details,
        status: ReportStatus::Pending,
        created_at: now,
        reviewed_by: None,
        reviewed_at: None,
        resolution_notes: None,
    };
    REPORTS.with(|r| r.borrow_mut().push(report.clone()));
    Some(report)
}

#[ic_cdk::query]
pub fn list_reports() -> Vec<Report> {
    REPORTS.with(|r| r.borrow().clone())
}

#[ic_cdk::update]
pub fn review_report(report_id: u64, status: ReportStatus, resolution_notes: Option<String>) -> bool {
    let reviewer = caller();
    let now = ic_cdk::api::time() / 1_000_000;
    if !is_admin(reviewer) {
        return false;
    }
    let mut success = false;
    let mut target_type = String::new();
    let mut target_id = String::new();
    let status_for_log = status.clone();
    REPORTS.with(|r| {
        let mut r = r.borrow_mut();
        if let Some(report) = r.iter_mut().find(|rep| rep.id == report_id) {
            report.status = status;
            report.reviewed_by = Some(reviewer);
            report.reviewed_at = Some(now);
            report.resolution_notes = resolution_notes.clone();
            target_type = format!("{:?}", report.target_type);
            target_id = report.target_id.clone();
            success = true;
        }
    });
    if success {
        log_admin_action(
            reviewer,
            "review_report",
            &target_type,
            &target_id,
            Some(format!("Report {} reviewed: {:?}", report_id, status_for_log)),
        );
    }
    success
}

// --- Track Licensing/Contracts Endpoints ---
#[ic_cdk::update]
pub fn set_track_license(track_id: u64, license_type: LicenseType, terms: Option<String>, contract_text: Option<String>) -> Option<TrackLicense> {
    let now = ic_cdk::api::time() / 1_000_000;
    let license = TrackLicense {
        track_id,
        license_type,
        terms,
        contract_text,
        issued_at: now,
    };
    TRACK_LICENSES.with(|tl| {
        let mut tl = tl.borrow_mut();
        // Replace if exists
        if let Some(existing) = tl.iter_mut().find(|l| l.track_id == track_id) {
            *existing = license.clone();
        } else {
            tl.push(license.clone());
        }
    });
    Some(license)
}

#[ic_cdk::query]
pub fn get_track_license(track_id: u64) -> Option<TrackLicense> {
    TRACK_LICENSES.with(|tl| tl.borrow().iter().find(|l| l.track_id == track_id).cloned())
}

// --- API Rate Limiting (Basic, for demonstration) ---
fn check_rate_limit(principal: Principal, max_calls: u32, window_secs: u64) -> bool {
    let now = ic_cdk::api::time() / 1_000_000;
    let mut allowed = false;
    RATE_LIMITS.with(|rl| {
        let mut rl = rl.borrow_mut();
        if let Some(entry) = rl.iter_mut().find(|e| e.principal == principal) {
            if now - entry.window_start > window_secs {
                entry.window_start = now;
                entry.call_count = 1;
                allowed = true;
            } else if entry.call_count < max_calls {
                entry.call_count += 1;
                allowed = true;
            }
        } else {
            rl.push(RateLimitEntry {
                principal,
                last_call: now,
                call_count: 1,
                window_start: now,
            });
            allowed = true;
        }
    });
    allowed
}

// --- Audit Log Endpoints ---
fn log_admin_action(admin: Principal, action: &str, target_type: &str, target_id: &str, details: Option<String>) {
    let now = ic_cdk::api::time() / 1_000_000;
    AUDIT_LOG_ID.with(|aid| {
        let mut aid = aid.borrow_mut();
        let entry = AuditLogEntry {
            id: *aid,
            admin,
            action: action.to_string(),
            target_type: target_type.to_string(),
            target_id: target_id.to_string(),
            timestamp: now,
            details,
        };
        AUDIT_LOG.with(|log| log.borrow_mut().push(entry));
        *aid += 1;
    });
}

#[ic_cdk::query]
pub fn list_audit_log() -> Vec<AuditLogEntry> {
    AUDIT_LOG.with(|log| log.borrow().clone())
}

// --- Moderation Queue Endpoints ---
#[ic_cdk::update]
pub fn flag_content_for_moderation(target_type: ModerationTargetType, target_id: String, reason: String) -> Option<ModerationQueueItem> {
    let flagged_by = Some(caller());
    let now = ic_cdk::api::time() / 1_000_000;
    let id = MODERATION_QUEUE_ID.with(|mid| {
        let mut mid = mid.borrow_mut();
        let id = *mid;
        *mid += 1;
        id
    });
    let item = ModerationQueueItem {
        id,
        target_type,
        target_id,
        flagged_by,
        reason,
        status: ModerationStatus::Pending,
        created_at: now,
        reviewed_by: None,
        reviewed_at: None,
        notes: None,
    };
    MODERATION_QUEUE.with(|q| q.borrow_mut().push(item.clone()));
    Some(item)
}

#[ic_cdk::query]
pub fn list_moderation_queue() -> Vec<ModerationQueueItem> {
    MODERATION_QUEUE.with(|q| q.borrow().clone())
}

#[ic_cdk::update]
pub fn review_moderation_item(item_id: u64, status: ModerationStatus, notes: Option<String>) -> bool {
    let reviewer = caller();
    let now = ic_cdk::api::time() / 1_000_000;
    if !is_admin(reviewer) {
        return false;
    }
    let mut success = false;
    let mut target_type = String::new();
    let mut target_id = String::new();
    let status_for_log = status.clone();
    MODERATION_QUEUE.with(|q| {
        let mut q = q.borrow_mut();
        if let Some(item) = q.iter_mut().find(|i| i.id == item_id) {
            item.status = status;
            item.reviewed_by = Some(reviewer);
            item.reviewed_at = Some(now);
            item.notes = notes.clone();
            target_type = format!("{:?}", item.target_type);
            target_id = item.target_id.clone();
            success = true;
        }
    });
    if success {
        log_admin_action(
            reviewer,
            "review_moderation_item",
            &target_type,
            &target_id,
            Some(format!("Moderation item {} reviewed: {:?}", item_id, status_for_log)),
        );
    }
    success
}

// --- Suspension & Appeals Endpoints ---
#[ic_cdk::update]
pub fn suspend_target(target_type: SuspensionTargetType, target_id: String, reason: String, duration_secs: Option<u64>) -> Option<Suspension> {
    let imposed_by = caller();
    let now = ic_cdk::api::time() / 1_000_000;
    if !is_admin(imposed_by) {
        return None;
    }
    let id = SUSPENSION_ID.with(|sid| {
        let mut sid = sid.borrow_mut();
        let id = *sid;
        *sid += 1;
        id
    });
    let suspension = Suspension {
        id,
        target_type: target_type.clone(),
        target_id: target_id.clone(),
        reason: reason.clone(),
        imposed_by,
        imposed_at: now,
        duration_secs,
        status: SuspensionStatus::Active,
        lifted_by: None,
        lifted_at: None,
        notes: None,
    };
    SUSPENSIONS.with(|s| s.borrow_mut().push(suspension.clone()));
    log_admin_action(
        imposed_by,
        "suspend_target",
        &format!("{:?}", target_type),
        &target_id,
        Some(format!("Suspension imposed: {}", reason)),
    );
    Some(suspension)
}

#[ic_cdk::update]
pub fn lift_suspension(suspension_id: u64, notes: Option<String>) -> bool {
    let lifter = caller();
    let now = ic_cdk::api::time() / 1_000_000;
    if !is_admin(lifter) {
        return false;
    }
    let mut success = false;
    let mut target_type = String::new();
    let mut target_id = String::new();
    SUSPENSIONS.with(|s| {
        let mut s = s.borrow_mut();
        if let Some(susp) = s.iter_mut().find(|s| s.id == suspension_id && s.status == SuspensionStatus::Active) {
            susp.status = SuspensionStatus::Lifted;
            susp.lifted_by = Some(lifter);
            susp.lifted_at = Some(now);
            susp.notes = notes.clone();
            target_type = format!("{:?}", susp.target_type);
            target_id = susp.target_id.clone();
            success = true;
        }
    });
    if success {
        log_admin_action(
            lifter,
            "lift_suspension",
            &target_type,
            &target_id,
            Some(format!("Suspension {} lifted", suspension_id)),
        );
    }
    success
}

#[ic_cdk::query]
pub fn list_suspensions() -> Vec<Suspension> {
    SUSPENSIONS.with(|s| s.borrow().clone())
}

#[ic_cdk::update]
pub fn submit_suspension_appeal(suspension_id: u64, content: String) -> Option<SuspensionAppeal> {
    let submitted_by = caller();
    let now = ic_cdk::api::time() / 1_000_000;
    let id = SUSPENSION_APPEAL_ID.with(|aid| {
        let mut aid = aid.borrow_mut();
        let id = *aid;
        *aid += 1;
        id
    });
    let appeal = SuspensionAppeal {
        id,
        suspension_id,
        submitted_by,
        submitted_at: now,
        content,
        status: AppealStatus::Pending,
        reviewed_by: None,
        reviewed_at: None,
        notes: None,
    };
    SUSPENSION_APPEALS.with(|a| a.borrow_mut().push(appeal.clone()));
    Some(appeal)
}

#[ic_cdk::update]
pub fn review_suspension_appeal(appeal_id: u64, status: AppealStatus, notes: Option<String>) -> bool {
    let reviewer = caller();
    let now = ic_cdk::api::time() / 1_000_000;
    if !is_admin(reviewer) {
        return false;
    }
    let mut success = false;
    let mut suspension_id = 0u64;
    let status_for_log = status.clone();
    SUSPENSION_APPEALS.with(|a| {
        let mut a = a.borrow_mut();
        if let Some(appeal) = a.iter_mut().find(|ap| ap.id == appeal_id) {
            appeal.status = status;
            appeal.reviewed_by = Some(reviewer);
            appeal.reviewed_at = Some(now);
            appeal.notes = notes.clone();
            suspension_id = appeal.suspension_id;
            success = true;
        }
    });
    if success {
        log_admin_action(
            reviewer,
            "review_suspension_appeal",
            "SuspensionAppeal",
            &suspension_id.to_string(),
            Some(format!("Appeal {} reviewed: {:?}", appeal_id, status_for_log)),
        );
    }
    success
}

#[ic_cdk::query]
pub fn list_suspension_appeals() -> Vec<SuspensionAppeal> {
    SUSPENSION_APPEALS.with(|a| a.borrow().clone())
}

// Simple content check function
fn check_content_for_banned_words(content: &str) -> Option<String> {
    let content_lower = content.to_lowercase();
    BANNED_KEYWORDS.with(|keywords| {
        for keyword in keywords.borrow().iter() {
            if content_lower.contains(keyword) {
                return Some(format!("Contains banned keyword: {}", keyword));
            }
        }
        None
    })
}

// Auto-flag content if it contains banned words
fn auto_flag_content_if_needed(target_type: ModerationTargetType, target_id: String, content: &str) {
    if let Some(reason) = check_content_for_banned_words(content) {
        let flagged_by = None; // Auto-flagged
        let now = ic_cdk::api::time() / 1_000_000;
        let id = MODERATION_QUEUE_ID.with(|mid| {
            let mut mid = mid.borrow_mut();
            let id = *mid;
            *mid += 1;
            id
        });
        let item = ModerationQueueItem {
            id,
            target_type,
            target_id,
            flagged_by,
            reason,
            status: ModerationStatus::Pending,
            created_at: now,
            reviewed_by: None,
            reviewed_at: None,
            notes: Some("Auto-flagged by system".to_string()),
        };
        MODERATION_QUEUE.with(|q| q.borrow_mut().push(item));
    }
}

// --- Automated Content Moderation Endpoints ---
#[ic_cdk::update]
pub fn add_banned_keyword(keyword: String) -> bool {
    let admin = caller();
    if !is_admin(admin) {
        return false;
    }
    let keyword_lower = keyword.to_lowercase();
    BANNED_KEYWORDS.with(|keywords| {
        let mut keywords = keywords.borrow_mut();
        if !keywords.contains(&keyword_lower) {
            keywords.push(keyword_lower);
            log_admin_action(
                admin,
                "add_banned_keyword",
                "Keyword",
                &keyword,
                Some("Banned keyword added".to_string()),
            );
            true
        } else {
            false
        }
    })
}

#[ic_cdk::update]
pub fn remove_banned_keyword(keyword: String) -> bool {
    let admin = caller();
    if !is_admin(admin) {
        return false;
    }
    let keyword_lower = keyword.to_lowercase();
    BANNED_KEYWORDS.with(|keywords| {
        let mut keywords = keywords.borrow_mut();
        let len_before = keywords.len();
        keywords.retain(|k| k != &keyword_lower);
        let removed = keywords.len() < len_before;
        if removed {
            log_admin_action(
                admin,
                "remove_banned_keyword",
                "Keyword",
                &keyword,
                Some("Banned keyword removed".to_string()),
            );
        }
        removed
    })
}

#[ic_cdk::query]
pub fn list_banned_keywords() -> Vec<String> {
    BANNED_KEYWORDS.with(|keywords| keywords.borrow().clone())
}

// --- Enhanced Version Management ---
#[ic_cdk::update]
fn revert_to_version(track_id: u64, version_number: u32) -> Option<Track> {
    let now = ic_cdk::api::time() / 1_000_000;
    let reverter = caller();
    
    // Check if user has permission to modify this track
    let has_permission = TRACKS.with(|tracks| {
        if let Some(track) = tracks.borrow().iter().find(|t| t.id == track_id) {
            track.contributors.contains(&1) // Simple check - in real app, check actual user ID
        } else {
            false
        }
    });
    
    if !has_permission {
        return None;
    }
    
    TRACK_VERSIONS.with(|tv| {
        let mut tv = tv.borrow_mut();
        if let Some((_, versions)) = tv.iter_mut().find(|(tid, _)| *tid == track_id) {
            if let Some(target_version) = versions.iter().find(|v| v.version == version_number) {
                // Clone the target version data to avoid borrow checker issues
                let target_title = target_version.title.clone();
                let target_description = target_version.description.clone();
                let target_contributors = target_version.contributors.clone();
                
                // Create a new version that reverts to the target version
                let new_version_num = versions.len() as u32 + 1;
                let revert_version = TrackVersion {
                    version: new_version_num,
                    title: target_title.clone(),
                    description: target_description.clone(),
                    contributors: target_contributors.clone(),
                    changed_by: reverter,
                    changed_at: now,
                    change_description: Some(format!("Reverted to version {}", version_number)),
                };
                versions.push(revert_version);
                
                // Update the main track
                TRACKS.with(|tracks| {
                    if let Some(track) = tracks.borrow_mut().iter_mut().find(|t| t.id == track_id) {
                        track.title = target_title;
                        track.description = target_description;
                        track.contributors = target_contributors;
                        track.version = new_version_num;
                        Some(track.clone())
                    } else {
                        None
                    }
                })
            } else {
                None
            }
        } else {
            None
        }
    })
}

#[ic_cdk::query]
fn get_version_history(track_id: u64) -> Vec<TrackVersion> {
    get_track_versions(track_id)
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct VersionComparison {
    pub version1: u32,
    pub version2: u32,
    pub title_changed: bool,
    pub description_changed: bool,
    pub contributors_changed: bool,
    pub title_diff: Option<String>,
    pub description_diff: Option<String>,
    pub contributors_diff: Option<String>,
}

#[ic_cdk::query]
fn compare_versions(track_id: u64, version1: u32, version2: u32) -> Option<VersionComparison> {
    TRACK_VERSIONS.with(|tv| {
        let tv = tv.borrow();
        if let Some((_, versions)) = tv.iter().find(|(tid, _)| *tid == track_id) {
            let v1 = versions.iter().find(|v| v.version == version1);
            let v2 = versions.iter().find(|v| v.version == version2);
            
            if let (Some(ver1), Some(ver2)) = (v1, v2) {
                let title_changed = ver1.title != ver2.title;
                let description_changed = ver1.description != ver2.description;
                let contributors_changed = ver1.contributors != ver2.contributors;
                
                Some(VersionComparison {
                    version1,
                    version2,
                    title_changed,
                    description_changed,
                    contributors_changed,
                    title_diff: if title_changed { Some(format!("{} -> {}", ver1.title, ver2.title)) } else { None },
                    description_diff: if description_changed { Some(format!("{} -> {}", ver1.description, ver2.description)) } else { None },
                    contributors_diff: if contributors_changed { Some(format!("{:?} -> {:?}", ver1.contributors, ver2.contributors)) } else { None },
                })
            } else {
                None
            }
        } else {
            None
        }
    })
}

// --- Advanced Analytics & Insights ---
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct TrackPerformanceMetrics {
    pub track_id: u64,
    pub total_plays: u64,
    pub unique_listeners: u64,
    pub avg_rating: f64,
    pub total_revenue: u64,
    pub comments_count: u64,
    pub shares_count: u64,
    pub download_count: u64,
    pub engagement_rate: f64,
    pub growth_rate: f64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct UserEngagementMetrics {
    pub user_id: u64,
    pub total_tracks_created: u64,
    pub total_plays_received: u64,
    pub total_revenue_earned: u64,
    pub avg_track_rating: f64,
    pub active_days: u64,
    pub followers_count: u64,
    pub following_count: u64,
    pub engagement_score: f64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct RevenueInsights {
    pub total_platform_revenue: u64,
    pub top_earning_tracks: Vec<(u64, u64)>, // (track_id, revenue)
    pub top_earning_artists: Vec<(u64, u64)>, // (artist_id, revenue)
    pub revenue_by_genre: Vec<(String, u64)>,
    pub monthly_revenue_trend: Vec<(u64, u64)>, // (month_timestamp, revenue)
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct PlatformAnalytics {
    pub total_tracks: u64,
    pub total_users: u64,
    pub total_artists: u64,
    pub total_plays: u64,
    pub total_revenue: u64,
    pub avg_track_rating: f64,
    pub most_popular_genres: Vec<(String, u64)>,
    pub most_active_users: Vec<(u64, u64)>, // (user_id, activity_score)
}

// --- Advanced Analytics Endpoints ---
#[ic_cdk::query]
fn get_track_performance_metrics(track_id: u64) -> Option<TrackPerformanceMetrics> {
    TRACKS.with(|tracks| {
        if let Some(track) = tracks.borrow().iter().find(|t| t.id == track_id) {
            let total_plays = track.play_count;
            let unique_listeners = track.play_count; // Simplified - in real app, track unique listeners
            let avg_rating = if !track.ratings.is_empty() {
                let sum: u64 = track.ratings.iter().map(|(_, rating)| *rating as u64).sum();
                sum as f64 / track.ratings.len() as f64
            } else {
                0.0
            };
            
            let total_revenue = track.payments.iter().map(|p| p.amount).sum();
            let comments_count = track.comments.len() as u64;
            let shares_count = 0; // Not implemented yet
            let download_count = 0; // Not implemented yet
            
            let engagement_rate = if total_plays > 0 {
                (comments_count + shares_count) as f64 / total_plays as f64
            } else {
                0.0
            };
            
            let growth_rate = 0.0; // Would need historical data
            
            Some(TrackPerformanceMetrics {
                track_id,
                total_plays,
                unique_listeners,
                avg_rating,
                total_revenue,
                comments_count,
                shares_count,
                download_count,
                engagement_rate,
                growth_rate,
            })
        } else {
            None
        }
    })
}

#[ic_cdk::query]
fn get_user_engagement_metrics(user_id: u64) -> Option<UserEngagementMetrics> {
    let mut total_tracks_created = 0;
    let mut total_plays_received = 0;
    let mut total_revenue_earned = 0;
    let mut total_ratings = 0;
    let mut rating_sum = 0;
    
    TRACKS.with(|tracks| {
        for track in tracks.borrow().iter() {
            if track.contributors.contains(&user_id) {
                total_tracks_created += 1;
                total_plays_received += track.play_count;
                total_revenue_earned += track.payments.iter().map(|p| p.amount).sum::<u64>();
                
                for (_, rating) in &track.ratings {
                    total_ratings += 1;
                    rating_sum += *rating as u64;
                }
            }
        }
    });
    
    let avg_track_rating = if total_ratings > 0 {
        rating_sum as f64 / total_ratings as f64
    } else {
        0.0
    };
    
    // Simplified metrics - in real app, would calculate from activity logs
    let active_days = 30; // Placeholder
    let followers_count = 0; // Not implemented yet
    let following_count = 0; // Not implemented yet
    let engagement_score = if total_tracks_created > 0 {
        (total_plays_received + total_revenue_earned) as f64 / total_tracks_created as f64
    } else {
        0.0
    };
    
    Some(UserEngagementMetrics {
        user_id,
        total_tracks_created,
        total_plays_received,
        total_revenue_earned,
        avg_track_rating,
        active_days,
        followers_count,
        following_count,
        engagement_score,
    })
}

#[ic_cdk::query]
fn get_revenue_insights() -> RevenueInsights {
    let mut total_platform_revenue = 0;
    let mut track_revenues = Vec::new();
    let mut artist_revenues = std::collections::HashMap::new();
    let mut genre_revenues = std::collections::HashMap::new();
    
    TRACKS.with(|tracks| {
        for track in tracks.borrow().iter() {
            let track_revenue = track.payments.iter().map(|p| p.amount).sum::<u64>();
            total_platform_revenue += track_revenue;
            
            if track_revenue > 0 {
                track_revenues.push((track.id, track_revenue));
            }
            
            // Aggregate by artist
            for &contributor in &track.contributors {
                *artist_revenues.entry(contributor).or_insert(0) += track_revenue;
            }
            
            // Aggregate by genre
            if let Some(ref genre) = track.genre {
                *genre_revenues.entry(genre.clone()).or_insert(0) += track_revenue;
            }
        }
    });
    
    // Sort by revenue (descending)
    track_revenues.sort_by(|a, b| b.1.cmp(&a.1));
    let top_earning_tracks = track_revenues.into_iter().take(10).collect();
    
    let mut artist_revenue_vec: Vec<(u64, u64)> = artist_revenues.into_iter().collect();
    artist_revenue_vec.sort_by(|a, b| b.1.cmp(&a.1));
    let top_earning_artists = artist_revenue_vec.into_iter().take(10).collect();
    
    let mut genre_revenue_vec: Vec<(String, u64)> = genre_revenues.into_iter().collect();
    genre_revenue_vec.sort_by(|a, b| b.1.cmp(&a.1));
    
    let monthly_revenue_trend = vec![(ic_cdk::api::time() / 1_000_000, total_platform_revenue)]; // Simplified
    
    RevenueInsights {
        total_platform_revenue,
        top_earning_tracks,
        top_earning_artists,
        revenue_by_genre: genre_revenue_vec,
        monthly_revenue_trend,
    }
}

#[ic_cdk::query]
fn get_platform_analytics() -> PlatformAnalytics {
    let mut total_tracks = 0;
    let mut total_plays = 0;
    let mut total_revenue = 0;
    let mut total_ratings = 0;
    let mut rating_sum = 0;
    let mut genre_counts = std::collections::HashMap::new();
    let mut user_activity = std::collections::HashMap::new();
    
    TRACKS.with(|tracks| {
        for track in tracks.borrow().iter() {
            total_tracks += 1;
            total_plays += track.play_count;
            total_revenue += track.payments.iter().map(|p| p.amount).sum::<u64>();
            
            for (_, rating) in &track.ratings {
                total_ratings += 1;
                rating_sum += *rating as u64;
            }
            
            if let Some(ref genre) = track.genre {
                *genre_counts.entry(genre.clone()).or_insert(0) += 1;
            }
            
            for &contributor in &track.contributors {
                *user_activity.entry(contributor).or_insert(0) += track.play_count + track.comments.len() as u64;
            }
        }
    });
    
    let avg_track_rating = if total_ratings > 0 {
        rating_sum as f64 / total_ratings as f64
    } else {
        0.0
    };
    
    let mut genre_vec: Vec<(String, u64)> = genre_counts.into_iter().collect();
    genre_vec.sort_by(|a, b| b.1.cmp(&a.1));
    let most_popular_genres = genre_vec.into_iter().take(10).collect();
    
    let mut user_activity_vec: Vec<(u64, u64)> = user_activity.into_iter().collect();
    user_activity_vec.sort_by(|a, b| b.1.cmp(&a.1));
    let most_active_users = user_activity_vec.into_iter().take(10).collect();
    
    PlatformAnalytics {
        total_tracks,
        total_users: 100, // Placeholder - would count actual users
        total_artists: 50, // Placeholder - would count actual artists
        total_plays,
        total_revenue,
        avg_track_rating,
        most_popular_genres,
        most_active_users,
    }
}

// --- Collaborative Workflow Management ---
#[derive(Clone, Debug, CandidType, Deserialize)]
pub enum WorkflowStatus {
    Planning,
    Recording,
    Mixing,
    Mastering,
    Review,
    Published,
    Archived,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct WorkflowStep {
    pub id: u64,
    pub track_id: u64,
    pub step_name: String,
    pub status: WorkflowStatus,
    pub assigned_to: Vec<u64>,
    pub due_date: Option<u64>,
    pub completed_at: Option<u64>,
    pub notes: Option<String>,
    pub dependencies: Vec<u64>, // IDs of steps that must be completed first
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct CollaborationSession {
    pub id: u64,
    pub track_id: u64,
    pub session_name: String,
    pub participants: Vec<u64>,
    pub start_time: u64,
    pub end_time: Option<u64>,
    pub notes: Option<String>,
    pub recording_url: Option<String>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct WorkflowTemplate {
    pub id: u64,
    pub name: String,
    pub description: String,
    pub steps: Vec<String>,
    pub estimated_duration_days: u32,
    pub genre_specific: bool,
    pub target_genre: Option<String>,
}

// --- Collaborative Workflow Management Endpoints ---
#[ic_cdk::update]
fn create_workflow_step(track_id: u64, step_name: String, assigned_to: Vec<u64>, due_date: Option<u64>, notes: Option<String>) -> Option<WorkflowStep> {
    let step_id = WORKFLOW_STEP_ID.with(|id| {
        let mut id_mut = id.borrow_mut();
        let current_id = *id_mut;
        *id_mut += 1;
        current_id
    });
    
    let now = ic_cdk::api::time() / 1_000_000;
    let step = WorkflowStep {
        id: step_id,
        track_id,
        step_name,
        status: WorkflowStatus::Planning,
        assigned_to,
        due_date,
        completed_at: None,
        notes,
        dependencies: vec![],
    };
    
    WORKFLOW_STEPS.with(|steps| {
        steps.borrow_mut().push(step.clone());
    });
    
    Some(step)
}

#[ic_cdk::update]
fn update_workflow_step_status(step_id: u64, status: WorkflowStatus, notes: Option<String>) -> Option<WorkflowStep> {
    let now = ic_cdk::api::time() / 1_000_000;
    WORKFLOW_STEPS.with(|steps| {
        if let Some(step) = steps.borrow_mut().iter_mut().find(|s| s.id == step_id) {
            step.status = status.clone();
            if let Some(ref new_notes) = notes {
                step.notes = Some(new_notes.clone());
            }
            if matches!(status, WorkflowStatus::Published) {
                step.completed_at = Some(now);
            }
            Some(step.clone())
        } else {
            None
        }
    })
}

#[ic_cdk::query]
fn get_track_workflow_steps(track_id: u64) -> Vec<WorkflowStep> {
    WORKFLOW_STEPS.with(|steps| {
        steps.borrow().iter().filter(|s| s.track_id == track_id).cloned().collect()
    })
}

#[ic_cdk::update]
fn create_collaboration_session(track_id: u64, session_name: String, participants: Vec<u64>, notes: Option<String>) -> Option<CollaborationSession> {
    let session_id = SESSION_ID.with(|id| {
        let mut id_mut = id.borrow_mut();
        let current_id = *id_mut;
        *id_mut += 1;
        current_id
    });
    
    let now = ic_cdk::api::time() / 1_000_000;
    let session = CollaborationSession {
        id: session_id,
        track_id,
        session_name,
        participants,
        start_time: now,
        end_time: None,
        notes,
        recording_url: None,
    };
    
    COLLABORATION_SESSIONS.with(|sessions| {
        sessions.borrow_mut().push(session.clone());
    });
    
    Some(session)
}

#[ic_cdk::update]
fn end_collaboration_session(session_id: u64, notes: Option<String>) -> Option<CollaborationSession> {
    let now = ic_cdk::api::time() / 1_000_000;
    COLLABORATION_SESSIONS.with(|sessions| {
        if let Some(session) = sessions.borrow_mut().iter_mut().find(|s| s.id == session_id) {
            session.end_time = Some(now);
            if let Some(ref new_notes) = notes {
                session.notes = Some(new_notes.clone());
            }
            Some(session.clone())
        } else {
            None
        }
    })
}

#[ic_cdk::query]
fn get_track_collaboration_sessions(track_id: u64) -> Vec<CollaborationSession> {
    COLLABORATION_SESSIONS.with(|sessions| {
        sessions.borrow().iter().filter(|s| s.track_id == track_id).cloned().collect()
    })
}

#[ic_cdk::update]
fn create_workflow_template(name: String, description: String, steps: Vec<String>, estimated_duration_days: u32, genre_specific: bool, target_genre: Option<String>) -> Option<WorkflowTemplate> {
    let template_id = TEMPLATE_ID.with(|id| {
        let mut id_mut = id.borrow_mut();
        let current_id = *id_mut;
        *id_mut += 1;
        current_id
    });
    
    let template = WorkflowTemplate {
        id: template_id,
        name,
        description,
        steps,
        estimated_duration_days,
        genre_specific,
        target_genre,
    };
    
    WORKFLOW_TEMPLATES.with(|templates| {
        templates.borrow_mut().push(template.clone());
    });
    
    Some(template)
}

#[ic_cdk::query]
fn get_workflow_templates() -> Vec<WorkflowTemplate> {
    WORKFLOW_TEMPLATES.with(|templates| templates.borrow().clone())
}

#[ic_cdk::query]
fn get_workflow_templates_by_genre(genre: String) -> Vec<WorkflowTemplate> {
    WORKFLOW_TEMPLATES.with(|templates| {
        templates.borrow().iter()
            .filter(|t| !t.genre_specific || t.target_genre.as_ref() == Some(&genre))
            .cloned()
            .collect()
    })
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct TrackFile {
    pub track_id: u64,
    pub filename: String,
    pub content_type: String,
    pub data: Vec<u8>,
    pub uploaded_by: Principal,
    pub uploaded_at: u64,
}

#[ic_cdk::update]
pub fn upload_track_file(track_id: u64, filename: String, content_type: String, data: Vec<u8>) -> Result<(), String> {
    let caller = ic_cdk::api::caller();
    // Check file size
    if data.len() > MAX_FILE_SIZE {
        return Err("File too large (max 10MB)".to_string());
    }
    // Only owner or collaborator can upload
    let track = get_track(track_id).ok_or("Track not found")?;
    let user_id = get_user_id_by_principal(caller).ok_or("User not found")?;
    let is_owner = track.contributors.get(0) == Some(&user_id);
    let is_collab = track.contributors.contains(&user_id);
    if !is_owner && !is_collab {
        return Err("Not authorized to upload file for this track".to_string());
    }
    let now = ic_cdk::api::time() / 1_000_000;
    let file = TrackFile {
        track_id,
        filename,
        content_type,
        data,
        uploaded_by: caller,
        uploaded_at: now,
    };
    TRACK_FILES.with(|files| files.borrow_mut().insert(track_id, file));
    Ok(())
}

#[ic_cdk::query]
pub fn get_track_file(track_id: u64) -> Option<TrackFile> {
    TRACK_FILES.with(|files| files.borrow().get(&track_id).map(|f| f.clone()))
}

// Helper to get user id by principal
fn get_user_id_by_principal(principal: Principal) -> Option<u64> {
    // This is a stub. Replace with your actual user lookup logic.
    // For now, just return Some(1) for demo purposes.
    Some(1)
}

impl Storable for TrackFile {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for TrackFile {
    const MAX_SIZE: u32 = 10 * 1024 * 1024 + 1024; // 10MB + metadata buffer
    const IS_FIXED_SIZE: bool = false;
}