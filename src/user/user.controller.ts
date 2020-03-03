import { Controller, Get, Post, Body, Param, Query, UsePipes } from '@nestjs/common';
import { ApiParam, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JoiValidationPipe } from '../common';
import { UserQuerySchema } from './user.query-schema';
import { UserService } from './user.service';
import { BoostsByUserReturnPack, PublicProfileType, ProfileSearchPack } from '../types/api';

@Controller('v2/user')
@ApiTags('User')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get(':eos_account_name/stakes')
    @ApiOperation({ summary: 'Get stakes for a user' })
    @ApiParam({
        name: 'eos_account_name',
        description: `Max 12-char EOS account name
            Example: kedartheiyer`
    })
    @ApiResponse({
        status: 200,
        description: `returns an array of staking actions`
    })
    @UsePipes(new JoiValidationPipe(UserQuerySchema, ['query']))
    async getStakes(@Param('eos_account_name') eos_account_name, @Query() query): Promise<any> {
        return this.userService.getStakes(eos_account_name, query);
    }

    @Get(':eos_account_name/boosts')
    @ApiOperation({ summary: 'Get boosts for a user' })
    @ApiParam({
        name: 'eos_account_name',
        description: `Max 12-char EOS account name
            Example: kedartheiyer`
    })
    @ApiResponse({
        status: 200,
        description: `returns an array of boosts`
    })
    async getBoostsByUser(@Param('eos_account_name') eos_account_name): Promise<any> {
        return this.userService.getBoostsByUser(eos_account_name);
    }

    @Get(':eos_account_name/rewards')
    @ApiOperation({ summary: 'Get rewards and slashes for a user' })
    @ApiParam({
        name: 'eos_account_name',
        description: `Max 12-char EOS account name
        Example: kedartheiyer`
    })
    @ApiResponse({
        status: 200,
        description: `returns 
            {
                rewards: Array,
                slashes: Array
            }`
    })
    @UsePipes(new JoiValidationPipe(UserQuerySchema, ['query']))
    async getRewards(@Param('eos_account_name') eos_account_name, @Query() query): Promise<any> {
        return this.userService.getRewards(eos_account_name, query);
    }

    @Get(':eos_account_name/activity')
    @ApiOperation({ summary: 'Get miscellaneous stats for a user' })
    @ApiParam({
        name: 'eos_account_name',
        description: `Max 12-char EOS account name
        Example: kedartheiyer`
    })
    @ApiResponse({
        status: 200,
        description: `returns 
            {
                votes: Array, 
                proposals: Array 
            }`
    })
    async getActivity(@Param('eos_account_name') eos_account_name): Promise<any> {
        return this.userService.getActivity(eos_account_name);
    }

    @Post('streaks')
    @ApiOperation({
        summary: 'Deprecated'
    })
    async getStreaks(@Body() users): Promise<any> {
        return this.userService.getProfiles(users);
    }

    @Post('profiles')
    @ApiOperation({
        summary: 'Get user info',
        description: `Body format: An array of users. Example:
            ["kedartheiyer", "eosiochicken"]`
    })
    @ApiResponse({
        status: 201,
        description: `Array of objects, one for each user:
            {
                current: Current editing streak for user,
                best: Longest historical editing streak for user,
                profile: User profile if it exists. null if not,
                edits: total number of edits user has made
            }`
    })
    async getProfiles(@Body() users): Promise<any> {
        return this.userService.getProfiles(users);
    }

    @Get(':eos_account_name/profile')
    @ApiOperation({ summary: 'Deprecated' })
    @ApiParam({
        name: 'eos_account_name',
        description: `Max 12-char EOS account name
        Example: kedartheiyer`
    })
    async getProfile(@Param('eos_account_name') eos_account_name): Promise<any> {
        return this.userService.getProfile(eos_account_name);
    }


    @Post('search')
    @ApiOperation({ 
        summary: `Search Everipedia profiles by a search term`
    })
    @ApiResponse({
        status: 200,
        description: `Returns search results`
    })
    async searchProfiles(@Body() pack: any): Promise<any[]> {
        return this.userService.searchProfiles(pack);
    }

}
