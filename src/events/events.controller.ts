import { Controller, Get, Post, Body, Param, UseGuards, Request, Put, Delete } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEventDto, JoinEventDto, UpdateTokensDto, PromoteMemberDto } from './dto/event.dto';
import { CreateStationDto, PurchaseDto } from './dto/station.dto';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post()
  async createEvent(@Request() req, @Body() createEventDto: CreateEventDto) {
    return this.eventsService.createEvent(req.user.id, createEventDto);
  }

  @Post('join')
  async joinEvent(@Request() req, @Body() joinEventDto: JoinEventDto) {
    return this.eventsService.joinEvent(req.user.id, joinEventDto);
  }

  @Get('my-events')
  async getMyEvents(@Request() req) {
    return this.eventsService.getMyEvents(req.user.id);
  }

  @Get(':eventId')
  async getEventDetails(@Param('eventId') eventId: string, @Request() req) {
    return this.eventsService.getEventDetails(eventId, req.user.id);
  }

  @Put(':eventId/tokens')
  async updateTokens(
    @Param('eventId') eventId: string,
    @Request() req,
    @Body() updateDto: UpdateTokensDto,
  ) {
    return this.eventsService.updateTokens(eventId, req.user.id, updateDto);
  }

  @Put(':eventId/promote')
  async promoteMember(
    @Param('eventId') eventId: string,
    @Request() req,
    @Body() promoteDto: PromoteMemberDto,
  ) {
    return this.eventsService.promoteMember(eventId, req.user.id, promoteDto);
  }

  @Post(':eventId/stations')
  async createStation(
    @Param('eventId') eventId: string,
    @Request() req,
    @Body() createDto: CreateStationDto,
  ) {
    return this.eventsService.createStation(eventId, req.user.id, createDto);
  }

  @Post(':eventId/purchase')
  async purchase(
    @Param('eventId') eventId: string,
    @Request() req,
    @Body() purchaseDto: PurchaseDto,
  ) {
    return this.eventsService.purchase(eventId, req.user.id, purchaseDto);
  }

  @Get(':eventId/transactions')
  async getTransactions(@Param('eventId') eventId: string, @Request() req) {
    return this.eventsService.getTransactions(eventId, req.user.id);
  }

  @Delete(':eventId')
  async deleteEvent(@Param('eventId') eventId: string, @Request() req) {
    await this.eventsService.deleteEvent(eventId, req.user.id);
    return { message: 'Event deleted successfully' };
  }
}
