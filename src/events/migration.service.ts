import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';

@Injectable()
export class MigrationService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async migrateCodeToSlug(): Promise<{ success: boolean; message: string; migratedCount: number }> {
    try {
      // Get all events
      const events = await this.eventsRepository.find();

      let migratedCount = 0;
      const slugMap = new Map<string, number>();

      for (const event of events) {
        // If slug is already set, skip
        if (event.slug) {
          continue;
        }

        // Generate slug from name
        let baseSlug = this.generateSlug(event.name);
        let slug = baseSlug;

        // Handle duplicates by adding a number suffix
        let counter = 1;
        while (slugMap.has(slug) || await this.eventsRepository.findOne({ where: { slug } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        slugMap.set(slug, 1);

        // Update the event with the new slug
        event.slug = slug;
        await this.eventsRepository.save(event);
        migratedCount++;
      }

      return {
        success: true,
        message: `Successfully migrated ${migratedCount} events from code to slug`,
        migratedCount,
      };
    } catch (error) {
      return {
        success: false,
        message: `Migration failed: ${error.message}`,
        migratedCount: 0,
      };
    }
  }
}

