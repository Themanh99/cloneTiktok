generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ================= MASTER DATA & SYSTEM =================
model Language {
  id           Int      @id @default(autoincrement())
  code         String   @unique @db.VarChar(10) // vi, en, jp
  name         String   @db.VarChar(50)         // Vietnamese, English
  isActive     Boolean  @default(true)
  users        User[]
}

model SystemSetting {
  id           Int      @id @default(autoincrement())
  key          String   @unique @db.VarChar(100) // max_upload_size, maintenance_mode
  value        String   @db.Text
  description  String?  @db.VarChar(255)
  updatedAt    DateTime @updatedAt
}

// ================= USER & AUTHENTICATION =================
enum AuthProvider {
  LOCAL
  GOOGLE
  FACEBOOK
  APPLE
}

enum AccountStatus {
  ACTIVE
  BANNED
  SUSPENDED
}

model User {
  id             String        @id @default(uuid())
  // Login Info
  email          String?       @unique // Có thể null nếu đăng nhập bằng Phone/SSO ko cấp email
  phone          String?       @unique
  password       String?       // Null nếu là SSO
  provider       AuthProvider  @default(LOCAL)
  providerId     String?       // ID từ Google/Facebook trả về (SSO)
  
  // User Info
  username       String        @unique @db.VarChar(50) // @nickname
  displayName    String        @db.VarChar(100)
  avatarUrl      String?       @db.Text
  bio            String?       @db.VarChar(200)
  dob            DateTime?     @db.Date
  gender         Int?          // 0: Khác, 1: Nam, 2: Nữ
  isVerified     Boolean       @default(false) // Tích xanh
  status         AccountStatus @default(ACTIVE)

  // Settings
  languageId     Int?
  language       Language?     @relation(fields: [languageId], references: [id])
  
  // Denormalization (Thống kê)
  followerCount  Int           @default(0)
  followingCount Int           @default(0)
  totalLikes     Int           @default(0)

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  // Quan hệ
  videos         Video[]
  comments       Comment[]
  likes          Like[]
  bookmarks      Bookmark[]
  followers      Follow[]      @relation("UserFollowers")
  following      Follow[]      @relation("UserFollowing")
  sounds         Sound[]       @relation("UserUploadedSounds") // Nhạc gốc do user tạo
}

model Follow {
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower    User     @relation("UserFollowing", fields: [followerId], references: [id], onDelete: Cascade)
  following   User     @relation("UserFollowers", fields:[followingId], references: [id], onDelete: Cascade)

  @@id([followerId, followingId])
  @@index([followingId])
}

// ================= VIDEO & SOUND =================
model Sound {
  id            String   @id @default(uuid())
  name          String   @db.VarChar(200)
  audioUrl      String   @db.Text
  duration      Int      // Thời lượng tính bằng giây
  coverUrl      String?  @db.Text // Ảnh bìa của bài hát
  
  uploaderId    String?  // Nếu user tự thu âm
  uploader      User?    @relation("UserUploadedSounds", fields: [uploaderId], references: [id], onDelete: SetNull)
  
  useCount      Int      @default(0) // Số video dùng nhạc này

  createdAt     DateTime @default(now())
  videos        Video[]
}

enum VideoVisibility {
  PUBLIC
  FRIENDS_ONLY
  PRIVATE
}

model Video {
  id              String          @id @default(uuid())
  title           String?         @db.VarChar(500) // Caption (có chứa hashtag)
  
  // Video Source & Metadata
  originalUrl     String          @db.Text // Link MP4 gốc lưu ở Cloud/S3
  hlsUrl          String?         @db.Text // Link M3U8 để streaming siêu mượt (QUAN TRỌNG)
  thumbnailUrl    String?         @db.Text // Ảnh GIF/JPG preview
  coverUrl        String?         @db.Text // Ảnh tĩnh
  duration        Float           // Thời lượng video (giây)
  width           Int             // Độ phân giải ngang (vd: 1080)
  height          Int             // Độ phân giải dọc (vd: 1920)
  sizeBytes       BigInt          // Dung lượng file
  
  // Video Settings
  visibility      VideoVisibility @default(PUBLIC)
  allowComments   Boolean         @default(true)
  allowDuet       Boolean         @default(true)
  allowDownload   Boolean         @default(true)

  // Denormalization (Metrics - Cực kỳ quan trọng cho thuật toán đề xuất)
  viewCount       Int             @default(0)
  likeCount       Int             @default(0)
  commentCount    Int             @default(0)
  shareCount      Int             @default(0)
  bookmarkCount   Int             @default(0)
  completionRate  Float           @default(0) // Tỷ lệ xem hết video (Dành cho AI Recommendation)

  // Foreign Keys
  authorId        String
  author          User            @relation(fields: [authorId], references:[id], onDelete: Cascade)
  
  soundId         String?
  sound           Sound?          @relation(fields: [soundId], references: [id], onDelete: SetNull)

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // Quan hệ
  comments        Comment[]
  likes           Like[]
  bookmarks       Bookmark[]
  hashtags        VideoHashtag[]

  @@index([createdAt])
  @@index([authorId])
  @@index([soundId])
}

// ================= HASHTAG =================
model Hashtag {
  id        String         @id @default(uuid())
  name      String         @unique @db.VarChar(100) // vd: #xuhuong, không chứa dấu #
  useCount  Int            @default(0)
  videos    VideoHashtag[]
}

model VideoHashtag {
  videoId   String
  hashtagId String
  video     Video   @relation(fields: [videoId], references: [id], onDelete: Cascade)
  hashtag   Hashtag @relation(fields: [hashtagId], references: [id], onDelete: Cascade)

  @@id([videoId, hashtagId])
}

// ================= INTERACTIONS =================
model Like {
  userId    String
  videoId   String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references:[id], onDelete: Cascade)
  video     Video    @relation(fields: [videoId], references:[id], onDelete: Cascade)

  @@id([userId, videoId])
  @@index([videoId])
}

model Bookmark { // Tính năng lưu video
  userId    String
  videoId   String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  video     Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@id([userId, videoId])
}

model Comment {
  id          String    @id @default(uuid())
  content     String    @db.Text
  likeCount   Int       @default(0) // Comment cũng có thể thả tim
  
  videoId     String
  video       Video     @relation(fields:[videoId], references: [id], onDelete: Cascade)
  
  authorId    String
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)

  // Hỗ trợ Nested Comments (Trả lời comment)
  parentId    String?
  parent      Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies     Comment[] @relation("CommentReplies")

  // Mentions (@user trong comment)
  mentions    String[]  // Array lưu UserID được mention

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([videoId, createdAt])
  @@index([parentId])
}