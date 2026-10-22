import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HistoryService } from '../history/history.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { CreateProjectFromIdeaDto } from './dto/create-project-from-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { IdeaPriority, IdeaStatus } from './entities/idea.entity';
import { IdeasService } from './ideas.service';

@UseGuards(JwtAuthGuard)
@Controller('ideas')
export class IdeasController {
  constructor(
    private readonly ideas: IdeasService,
    private readonly history: HistoryService,
  ) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateIdeaDto) {
    return this.ideas.create(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('search') search?: string,
    @Query('status') status?: IdeaStatus,
    @Query('priority') priority?: IdeaPriority,
    @Query('focus') focus?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.ideas.findAll(user.id, {
      search,
      status,
      priority,
      focus: focus === undefined ? undefined : focus === 'true',
      includeArchived: includeArchived === 'true',
    });
  }

  @Get(':id/history')
  historyForIdea(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.history.findForIdea(user.id, +id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ideas.findOne(user.id, +id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateIdeaDto,
  ) {
    return this.ideas.update(user.id, +id, dto);
  }

  @Post(':id/archive')
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ideas.archive(user.id, +id);
  }

  @Post(':id/restore')
  restore(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ideas.restore(user.id, +id);
  }

  @Post(':id/project')
  createProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateProjectFromIdeaDto,
  ) {
    return this.ideas.createProject(user.id, +id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ideas.archive(user.id, +id);
  }
}
