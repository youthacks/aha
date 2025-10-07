"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_entity_1 = require("./entities/event.entity");
let MigrationService = class MigrationService {
    constructor(eventsRepository) {
        this.eventsRepository = eventsRepository;
    }
    generateSlug(name) {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
    async migrateCodeToSlug() {
        try {
            const events = await this.eventsRepository.find();
            let migratedCount = 0;
            const slugMap = new Map();
            for (const event of events) {
                if (event.slug) {
                    continue;
                }
                let baseSlug = this.generateSlug(event.name);
                let slug = baseSlug;
                let counter = 1;
                while (slugMap.has(slug) || await this.eventsRepository.findOne({ where: { slug } })) {
                    slug = `${baseSlug}-${counter}`;
                    counter++;
                }
                slugMap.set(slug, 1);
                event.slug = slug;
                await this.eventsRepository.save(event);
                migratedCount++;
            }
            return {
                success: true,
                message: `Successfully migrated ${migratedCount} events from code to slug`,
                migratedCount,
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Migration failed: ${error.message}`,
                migratedCount: 0,
            };
        }
    }
};
exports.MigrationService = MigrationService;
exports.MigrationService = MigrationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MigrationService);
//# sourceMappingURL=migration.service.js.map