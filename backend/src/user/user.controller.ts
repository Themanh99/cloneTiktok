import { Controller, Get, Patch, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto } from '../common/dtos/pagination.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  // GET /api/users/me — Current user's own profile (requires auth)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.userService.getMyProfile(userId);
  }

  // PATCH /api/users/me — Update own profile
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(userId, dto);
  }

  // GET /api/users/search?q=keyword
  @Get('search')
  searchUsers(@Query('q') query: string, @Query() pagination: PaginationDto) {
    return this.userService.searchUsers(query || '', pagination);
  }

  // GET /api/users/:id — Public profile
  @Get(':id')
  getPublicProfile(
    @Param('id') targetUserId: string,
    @CurrentUser('id') currentUserId?: string,
    // currentUserId will be undefined if not logged in
    // TODO: Create an optional auth guard for this case
  ) {
    return this.userService.getPublicProfile(targetUserId, currentUserId);
  }

  // POST /api/users/:id/follow
  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  follow(@CurrentUser('id') followerId: string, @Param('id') followingId: string) {
    return this.userService.follow(followerId, followingId);
  }

  // DELETE /api/users/:id/follow
  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  unfollow(@CurrentUser('id') followerId: string, @Param('id') followingId: string) {
    return this.userService.unfollow(followerId, followingId);
  }

  // GET /api/users/:id/followers
  @Get(':id/followers')
  getFollowers(@Param('id') userId: string, @Query() pagination: PaginationDto) {
    return this.userService.getFollowers(userId, pagination);
  }

  // GET /api/users/:id/following
  @Get(':id/following')
  getFollowing(@Param('id') userId: string, @Query() pagination: PaginationDto) {
    return this.userService.getFollowing(userId, pagination);
  }
}
