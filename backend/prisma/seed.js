"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌐 Seeding Languages...');
    await prisma.language.createMany({
        data: [
            { code: 'vi', name: 'Tiếng Việt' },
            { code: 'en', name: 'English' },
            { code: 'jp', name: '日本語' },
            { code: 'ko', name: '한국어' },
        ],
        skipDuplicates: true,
    });
    console.log('⚙️ Seeding System Settings...');
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
    console.log('✅ Seed completed!');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map