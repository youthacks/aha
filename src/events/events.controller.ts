import { Controller, Get, Post, Body, Param, UseGuards, Request, Put, Delete, Patch } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEventDto, JoinEventDto, UpdateTokensDto, PromoteMemberDto } from './dto/event.dto';
import { CreateStationDto, PurchaseDto, UpdateStationDto } from './dto/station.dto';
import { UpdateEventSettingsDto } from './dto/update-event-settings.dto';

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

  @Get('my-events/archived')
  async getMyArchivedEvents(@Request() req) {
    return this.eventsService.getMyArchivedEvents(req.user.id);
  }

  @Get(':eventSlug')
  async getEventDetails(@Param('eventSlug') eventSlug: string, @Request() req) {
    return this.eventsService.getEventDetailsBySlug(eventSlug, req.user.id);
  }

  @Put(':eventSlug/tokens')
  async updateTokens(
    @Param('eventSlug') eventSlug: string,
    @Request() req,
    @Body() updateDto: UpdateTokensDto,
  ) {
    return this.eventsService.updateTokensBySlug(eventSlug, req.user.id, updateDto);
  }

  @Put(':eventSlug/promote')
  async promoteMember(
    @Param('eventSlug') eventSlug: string,
    @Request() req,
    @Body() promoteDto: PromoteMemberDto,
  ) {
    return this.eventsService.promoteMemberBySlug(eventSlug, req.user.id, promoteDto);
  }

  @Post(':eventSlug/stations')
  async createStation(
    @Param('eventSlug') eventSlug: string,
    @Request() req,
    @Body() createDto: CreateStationDto,
  ) {
    return this.eventsService.createStationBySlug(eventSlug, req.user.id, createDto);
  }

  @Put(':eventSlug/stations/:stationId')
  async updateStation(
    @Param('eventSlug') eventSlug: string,
    @Param('stationId') stationId: string,
    @Request() req,
    @Body() updateDto: UpdateStationDto,
  ) {
    return this.eventsService.updateStationBySlug(eventSlug, stationId, req.user.id, updateDto);
  }

  @Delete(':eventSlug/stations/:stationId')
  async deleteStation(
    @Param('eventSlug') eventSlug: string,
    @Param('stationId') stationId: string,
    @Request() req,
  ) {
    await this.eventsService.deleteStationBySlug(eventSlug, stationId, req.user.id);
    return { message: 'Station deleted successfully' };
  }

  @Post(':eventSlug/purchase')
  async purchase(
    @Param('eventSlug') eventSlug: string,
    @Request() req,
    @Body() purchaseDto: PurchaseDto,
  ) {
    return this.eventsService.purchaseBySlug(eventSlug, req.user.id, purchaseDto);
  }

  @Get(':eventSlug/transactions')
  async getTransactions(@Param('eventSlug') eventSlug: string, @Request() req) {
    return this.eventsService.getTransactionsBySlug(eventSlug, req.user.id);
  }

  @Get(':eventSlug/transactions/all')
  async getAllTransactions(@Param('eventSlug') eventSlug: string, @Request() req) {
    return this.eventsService.getAllTransactionsBySlug(eventSlug, req.user.id);
  }

  @Patch(':eventSlug/settings')
  async updateEventSettings(
    @Param('eventSlug') eventSlug: string,
    @Request() req,
    @Body() updateDto: UpdateEventSettingsDto,
  ) {
    return this.eventsService.updateEventSettingsBySlug(eventSlug, req.user.id, updateDto);
  }

  @Post(':eventSlug/redeem')
  async redeemReceipt(
    @Param('eventSlug') eventSlug: string,
    @Request() req,
    @Body() body: { receiptCode: string },
  ) {
    return this.eventsService.redeemReceiptBySlug(eventSlug, body.receiptCode, req.user.id);
  }

  @Put(':eventSlug/archive')
  async archiveEvent(@Param('eventSlug') eventSlug: string, @Request() req) {
    await this.eventsService.archiveEventBySlug(eventSlug, req.user.id);
    return { message: 'Event archived successfully' };
  }

  @Put(':eventSlug/unarchive')
  async unarchiveEvent(@Param('eventSlug') eventSlug: string, @Request() req) {
    await this.eventsService.unarchiveEventBySlug(eventSlug, req.user.id);
    return { message: 'Event unarchived successfully' };
  }

  @Delete(':eventSlug')
  async deleteEvent(@Param('eventSlug') eventSlug: string, @Request() req) {
    await this.eventsService.deleteEventBySlug(eventSlug, req.user.id);
    return { message: 'Event deleted successfully' };
  }
}
