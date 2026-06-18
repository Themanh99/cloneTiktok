import { PrismaClient, AuthProvider, AccountStatus, VideoVisibility } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding languages...');
  await prisma.language.createMany({
    data: [
      { code: 'vi', name: 'Vietnamese' },
      { code: 'en', name: 'English' },
      { code: 'jp', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding system settings...');
  await prisma.systemSetting.createMany({
    data: [
      {
        key: 'max_upload_size_mb',
        value: '100',
        description: 'Maximum video upload size in MB',
      },
      {
        key: 'max_video_duration_seconds',
        value: '180',
        description: 'Maximum video duration in seconds (3 minutes)',
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        description: 'Enable/disable maintenance mode',
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding password...');
  const password = await bcrypt.hash('Test1234', 10);

  // 1. Create target user: the.manh99
  console.log('Seeding user the.manh99...');
  const targetUser = await prisma.user.upsert({
    where: { username: 'the.manh99' },
    update: {
      email: 'the.manh99@example.com',
      password,
      displayName: 'L và M',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop',
      bio: 'fb: Thế Mạnh',
      provider: AuthProvider.LOCAL,
      status: AccountStatus.ACTIVE,
      followerCount: 43,
      followingCount: 84,
      totalLikes: 210,
    },
    create: {
      username: 'the.manh99',
      email: 'the.manh99@example.com',
      password,
      displayName: 'L và M',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop',
      bio: 'fb: Thế Mạnh',
      provider: AuthProvider.LOCAL,
      status: AccountStatus.ACTIVE,
      followerCount: 43,
      followingCount: 84,
      totalLikes: 210,
    },
  });

  // 2. Create the 5 followed accounts shown in the sidebar
  console.log('Seeding sidebar accounts and follows...');
  const followedAccountsData = [
    { username: 'dawn291063', displayName: 'bánh bò nướng', isVerified: true, avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop' },
    { username: 'english_with_vincent', displayName: 'english_with_vincent', isVerified: false, avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop' },
    { username: 'deepoceanx2', displayName: 'Shadow Discipline', isVerified: false, avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop' },
    { username: 'malric_edit', displayName: 'Malric Edit', isVerified: false, avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop' },
    { username: 'slow.english.podcast', displayName: 'Miss Honey', isVerified: false, avatarUrl: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&auto=format&fit=crop' },
  ];

  const createdFollowedAccounts = [];
  for (const account of followedAccountsData) {
    const u = await prisma.user.upsert({
      where: { username: account.username },
      update: {
        displayName: account.displayName,
        isVerified: account.isVerified,
        avatarUrl: account.avatarUrl,
        password,
      },
      create: {
        username: account.username,
        displayName: account.displayName,
        isVerified: account.isVerified,
        avatarUrl: account.avatarUrl,
        email: `${account.username}@example.com`,
        password,
      },
    });
    createdFollowedAccounts.push(u);

    // Make targetUser follow this user
    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: targetUser.id,
          followingId: u.id,
        },
      },
      update: {},
      create: {
        followerId: targetUser.id,
        followingId: u.id,
      },
    });
  }

  // 3. Create sound upload
  const demoSound = await prisma.sound.upsert({
    where: { id: 'original-sound-manh' },
    update: {
      name: 'Original Sound - L và M',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration: 30,
      uploaderId: targetUser.id,
      useCount: 12,
    },
    create: {
      id: 'original-sound-manh',
      name: 'Original Sound - L và M',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration: 30,
      uploaderId: targetUser.id,
      useCount: 12,
    },
  });

  // 4. Create the 12 videos uploaded by the.manh99
  console.log('Seeding 12 videos for the.manh99...');
  const videosData = [
    {
      id: 'v-user-1',
      title: 'Lúc nhỏ mong ước lớn lên thật nhanh để làm gì? 😂 #childhood #growingup #vintage',
      originalUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vintage-tv-screen-playing-cartoons-42969-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop',
      coverUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop',
      viewCount: 4755,
      likeCount: 210,
      commentCount: 5,
      bookmarkCount: 1121,
      visibility: VideoVisibility.PUBLIC,
    },
    {
      id: 'v-user-2',
      title: 'Lỡ tin thằng bạn chỉ đường ra cánh đồng hoa... 🌸🌾 #dichoiphuot #travelvietnam #spring',
      originalUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fields-of-yellow-flowers-under-a-clear-blue-sky-42352-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=600&auto=format&fit=crop',
      coverUrl: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=600&auto=format&fit=crop',
      viewCount: 66,
      likeCount: 5,
      commentCount: 1,
      bookmarkCount: 0,
      visibility: VideoVisibility.PUBLIC,
    },
    {
      id: 'v-user-3',
      title: 'Dạo bước qua phố cổ Hà Nội ngày thu se lạnh 🍂🛵 #hanoi #dailyvlog #chill',
      originalUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cyclist-riding-on-a-paved-street-in-autumn-41489-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop',
      coverUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop',
      viewCount: 54,
      likeCount: 3,
      commentCount: 0,
      bookmarkCount: 1,
      visibility: VideoVisibility.PUBLIC,
    },
    {
      id: 'v-user-4',
      title: 'Buổi chiều hoàng hôn yên bình trên con đường ven biển 🌅🌊 #sunset #beachroad #vibes',
      originalUrl: 'https://assets.mixkit.co/videos/preview/mixkit-driving-on-a-road-facing-the-ocean-at-sunset-42994-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop',
      coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop',
      viewCount: 272,
      likeCount: 18,
      commentCount: 2,
      bookmarkCount: 8,
      visibility: VideoVisibility.PUBLIC,
    },
    {
      id: 'v-user-5',
      title: 'Khu rừng thông ngập nắng sớm mai mang lại cảm giác dễ chịu vô cùng 🌲☀️ #forest #relaxing #morning',
      originalUrl: 'https://assets.mixkit.co/videos/preview/mixkit-sunbeams-through-tall-pine-trees-42358-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop',
      coverUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop',
      viewCount: 348,
      likeCount: 29,
      commentCount: 4,
      bookmarkCount: 12,
      visibility: VideoVisibility.PUBLIC,
    },
    {
      id: 'v-user-6',
      title: 'Một ngày cắm trại bình yên trong rừng cùng bạn bè 🏕️🔥 #camping #outdoorlife #vibe',
      originalUrl: 'https://assets.mixkit.co/videos/preview/mixkit-camping-tent-set-up-in-a-sunny-forest-42359-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&auto=format&fit=crop',
      coverUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&auto=format&fit=crop',
      viewCount: 329,
      likeCount: 25,
      commentCount: 3,
      bookmarkCount: 10,
      visibility: VideoVisibility.PUBLIC,
    },
    {
      id: 'v-user-7',
      title: 'Những con phố ẩm thực tấp nập lúc lên đèn ở Sài Gòn 🍲🛵 #saigon #streetfood #vietnam',
      originalUrl: 'https://assets.mixkit.co/videos/preview/mixkit-street-traffic-on-a-rainy-night-in-a-city-43840-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1535401991746-da3d9055713e?w=600&auto=format&fit=crop',
      coverUrl: 'https://images.unsplash.com/photo-1535401991746-da3d9055713e?w=600&auto=format&fit=crop',
      viewCount: 251,
      likeCount: 14,
      commentCount: 2,
      bookmarkCount: 5,
      visibility: VideoVisibility.PUBLIC,
    },
    {
      id: 'v-user-8',
      title: 'Tập powerloop với tiny75 walksnail bay cực đã 🛸💨 #fpv #drone #quadcopter',
      originalUrl: 'https://assets.mixkit.co/videos/preview/mixkit-forest-river-view-from-a-flying-drone-41485-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&auto=format&fit=crop',
      coverUrl: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&auto=format&fit=crop',
      viewCount: 202,
      likeCount: 33,
      commentCount: 6,
      bookmarkCount: 7,
      visibility: VideoVisibility.PUBLIC,
    },
    {
      id: 'v-user-9',
      title: 'Tự tay pha tách cà phê sữa đá buổi sáng thơm ngon cực chill ☕🥛 #coffee #morningroutine #homemade',
      originalUrl: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-milk-into-a-freshly-brewed-coffee-42997-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop',
      coverUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop',
      viewCount: 239,
      likeCount: 22,
      commentCount: 1,
      bookmarkCount: 4,
      visibility: VideoVisibility.PUBLIC,
    },
    {
      id: 'v-user-10',
      title: 'Kỷ niệm buổi hẹn hò cuối tuần ấm áp bên nhau 👩‍❤️‍👨🍕 #date #couple #love',
      originalUrl: 'https://assets.mixkit.co/videos/preview/mixkit-friends-toasting-at-a-dinner-party-42981-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop',
      coverUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop',
      viewCount: 890,
      likeCount: 75,
      commentCount: 8,
      bookmarkCount: 24,
      visibility: VideoVisibility.PRIVATE,
    },
    {
      id: 'v-user-11',
      title: 'Hà Nội về đêm qua góc nhìn yên bình của tôi 🌃🏍️ #hanoibynight #citylife #aesthetic',
      originalUrl: 'https://assets.mixkit.co/videos/preview/mixkit-driving-on-a-city-street-at-night-42993-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop',
      coverUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop',
      viewCount: 120,
      likeCount: 19,
      commentCount: 1,
      bookmarkCount: 3,
      visibility: VideoVisibility.PUBLIC,
    },
    {
      id: 'v-user-12',
      title: 'Review góc làm việc nhỏ gọn đơn giản vừa hoàn thành 💻⌨️ #setup #workspace #deskinspiration',
      originalUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-laptop-keyboard-42973-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop',
      coverUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop',
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      bookmarkCount: 0,
      visibility: VideoVisibility.PRIVATE,
    },
  ];

  for (const video of videosData) {
    await prisma.video.upsert({
      where: { id: video.id },
      update: {
        title: video.title,
        originalUrl: video.originalUrl,
        thumbnailUrl: video.thumbnailUrl,
        coverUrl: video.coverUrl,
        duration: 15.0,
        width: 1080,
        height: 1920,
        sizeBytes: BigInt(5 * 1024 * 1024),
        visibility: video.visibility,
        authorId: targetUser.id,
        soundId: demoSound.id,
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        commentCount: video.commentCount,
        bookmarkCount: video.bookmarkCount,
      },
      create: {
        id: video.id,
        title: video.title,
        originalUrl: video.originalUrl,
        thumbnailUrl: video.thumbnailUrl,
        coverUrl: video.coverUrl,
        duration: 15.0,
        width: 1080,
        height: 1920,
        sizeBytes: BigInt(5 * 1024 * 1024),
        visibility: video.visibility,
        authorId: targetUser.id,
        soundId: demoSound.id,
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        commentCount: video.commentCount,
        bookmarkCount: video.bookmarkCount,
      },
    });
  }

  // 5. Create detailed comments on the first video: v-user-1
  console.log('Seeding detailed comments on the first video...');
  const commentsSeed = [
    {
      id: 'c-1',
      authorUsername: 'dawn291063',
      content: 'khúc Mbappe ghi bàn phút 117, Camera quay tới Di Maria khóc thấy tội',
      createdAt: new Date('2026-06-14T12:00:00Z'),
      likeCount: 364,
      replies: [
        {
          id: 'c-1-1',
          authorUsername: 'english_with_vincent',
          content: 'Công nhận, góc quay chân thực dã man, tiếc cho Di Maria trận đó.',
          createdAt: new Date('2026-06-14T12:05:00Z'),
          likeCount: 12,
        },
        {
          id: 'c-1-2',
          authorUsername: 'deepoceanx2',
          content: 'Nhưng sau đó Messi đã gánh team thành công và vô địch!',
          createdAt: new Date('2026-06-14T12:10:00Z'),
          likeCount: 25,
        },
      ],
    },
    {
      id: 'c-2',
      authorUsername: 'deepoceanx2',
      content: 'ko có di maria đó messi vô địch đc đấy',
      createdAt: new Date('2026-06-14T13:00:00Z'),
      likeCount: 34,
      replies: [],
    },
    {
      id: 'c-3',
      authorUsername: 'malric_edit',
      content: 'Vừa rút Dimaria ra phát là hiểu vấn đề liền, hên có dibu cứu chúa',
      createdAt: new Date('2026-06-10T14:00:00Z'),
      likeCount: 18,
      replies: [],
    },
    {
      id: 'c-4',
      authorUsername: 'slow.english.podcast',
      content: 'Nhớ mãi khoảnh khắc lúc pháp gỡ 2-2 dimaria ôm áo khóc.',
      createdAt: new Date('2026-06-15T09:00:00Z'),
      likeCount: 6,
      replies: [],
    },
    {
      id: 'c-5',
      authorUsername: 'english_with_vincent',
      content: 'hog khéo trận 2014 có maria hog lheos vô địch cũng có',
      createdAt: new Date('2026-06-14T15:00:00Z'),
      likeCount: 37,
      replies: [],
    },
  ];

  for (const c of commentsSeed) {
    const authorUser = createdFollowedAccounts.find(x => x.username === c.authorUsername) || targetUser;
    
    // Seed main comment
    const mainComment = await prisma.comment.upsert({
      where: { id: c.id },
      update: {
        content: c.content,
        likeCount: c.likeCount,
        videoId: 'v-user-1',
        authorId: authorUser.id,
        mentions: [],
      },
      create: {
        id: c.id,
        content: c.content,
        likeCount: c.likeCount,
        videoId: 'v-user-1',
        authorId: authorUser.id,
        mentions: [],
      },
    });

    // Seed replies
    for (const r of c.replies) {
      const replyAuthor = createdFollowedAccounts.find(x => x.username === r.authorUsername) || targetUser;
      await prisma.comment.upsert({
        where: { id: r.id },
        update: {
          content: r.content,
          likeCount: r.likeCount,
          videoId: 'v-user-1',
          authorId: replyAuthor.id,
          parentId: mainComment.id,
          mentions: [],
        },
        create: {
          id: r.id,
          content: r.content,
          likeCount: r.likeCount,
          videoId: 'v-user-1',
          authorId: replyAuthor.id,
          parentId: mainComment.id,
          mentions: [],
        },
      });
    }
  }

  // Also seed demo account info if needed
  console.log('Seeding other demo accounts...');
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {
      password,
      displayName: 'Demo User',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
      bio: 'Demo account for local API testing',
      provider: AuthProvider.LOCAL,
      status: AccountStatus.ACTIVE,
    },
    create: {
      email: 'demo@example.com',
      password,
      username: 'demo',
      displayName: 'Demo User',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
      bio: 'Demo account for local API testing',
      provider: AuthProvider.LOCAL,
      status: AccountStatus.ACTIVE,
    },
  });

  const creatorUser = await prisma.user.upsert({
    where: { email: 'creator@example.com' },
    update: {
      password,
      displayName: 'Creator User',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop',
      bio: 'Creator account with sample videos',
      provider: AuthProvider.LOCAL,
      status: AccountStatus.ACTIVE,
    },
    create: {
      email: 'creator@example.com',
      password,
      username: 'creator',
      displayName: 'Creator User',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop',
      bio: 'Creator account with sample videos',
      provider: AuthProvider.LOCAL,
      status: AccountStatus.ACTIVE,
    },
  });

  // Make demoUser follow targetUser
  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: demoUser.id,
        followingId: targetUser.id,
      },
    },
    update: {},
    create: {
      followerId: demoUser.id,
      followingId: targetUser.id,
    },
  });

  console.log('Seed completed successfully!');
  console.log('Target user seeded: username: the.manh99, password: Test1234');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
