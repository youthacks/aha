"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const events_service_1 = require("./events/events.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    app.enableCors({
        origin: frontendUrl,
        credentials: true,
    });
    try {
        const eventsService = app.get(events_service_1.EventsService);
        const updatedCount = await eventsService.backfillJoinCodes();
        if (updatedCount > 0) {
            console.log(`Backfilled join codes for ${updatedCount} event(s).`);
        }
    }
    catch (error) {
        console.error('Failed to backfill join codes:', error);
    }
    await app.listen(3000);
    console.log('Application is running on: http://localhost:3000');
}
bootstrap();
//# sourceMappingURL=main.js.map