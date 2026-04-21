erDiagram
    USER ||--o{ VIDEO : creates
    USER ||--o{ COMMENT : writes
    USER ||--o{ LIKE : gives
    USER ||--o{ BOOKMARK : saves
    USER ||--o{ FOLLOW : "follows (as follower)"
    USER ||--o{ FOLLOW : "is followed by (as following)"
    USER }|--o| LANGUAGE : speaks
    USER ||--o{ SOUND : "uploads original"

    VIDEO ||--o{ COMMENT : contains
    VIDEO ||--o{ LIKE : receives
    VIDEO ||--o{ BOOKMARK : is_saved_by
    VIDEO }o--o| SOUND : uses
    VIDEO ||--o{ VIDEO_HASHTAG : tagged_with

    HASHTAG ||--o{ VIDEO_HASHTAG : included_in

    COMMENT ||--o{ COMMENT : "replies to (parent-child)"

    SOUND ||--o{ VIDEO : "used by"

    SYSTEM_SETTING

    %% Models definitions (simplified for diagram clarity)
    USER {
        string id PK
        string email UK
        string provider
        string username UK
        boolean isVerified
        int followerCount
        int followingCount
    }

    VIDEO {
        string id PK
        string originalUrl
        string hlsUrl
        float duration
        int viewCount
        int likeCount
        string authorId FK
        string soundId FK
    }

    COMMENT {
        string id PK
        string content
        int likeCount
        string videoId FK
        string authorId FK
        string parentId FK
    }

    SOUND {
        string id PK
        string name
        string audioUrl
        int useCount
        string uploaderId FK
    }

    LIKE {
        string userId FK
        string videoId FK
    }

    FOLLOW {
        string followerId FK
        string followingId FK
    }
    
    HASHTAG {
        string id PK
        string name UK
        int useCount
    }