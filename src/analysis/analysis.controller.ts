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
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { UpdateAnalysisDto } from './dto/update-analysis.dto';

@UseGuards(JwtAuthGuard)
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly notes: AnalysisService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAnalysisDto,
  ) {
    return this.notes.create(user.id, dto);
  }

  @Get('idea/:ideaId')
  findAllByIdea(
    @CurrentUser() user: AuthenticatedUser,
    @Param('ideaId') ideaId: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.notes.findAllByIdeaId(
      user.id,
      +ideaId,
      includeArchived === 'true',
    );
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAnalysisDto,
  ) {
    return this.notes.update(user.id, +id, dto);
  }

  @Post(':id/archive')
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notes.archive(user.id, +id);
  }

  @Post(':id/restore')
  restore(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notes.restore(user.id, +id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notes.archive(user.id, +id);
  }
}
