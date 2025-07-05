import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UserService } from './user.service';
import { CreateUserRequestDto } from './dto/request/create-user.request.dto';
import { UpdateUserRequestDto } from './dto/request/update-user.request.dto';
import { GetListUserRequestDto } from './dto/request/get-list-user.request.dto';
import { isEmpty } from 'lodash';
import { RoleGuard } from '@core/guards/role.guard';
import { Roles } from '@core/decorators/role.decorator';
import { USER_ROLE_ENUM } from './user.constant';
import { IdParamDto } from '@core/dto/params-id.request.dto';
import { mergePayload } from '@utils/common';

@ApiTags('Người dùng')
@ApiBearerAuth('JWT-auth')
@UseGuards(RoleGuard)
@Roles(USER_ROLE_ENUM.ADMIN)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo người dùng mới' })
  @ApiResponse({ status: 201, description: 'Tạo người dùng thành công' })
  async createUser(@Body() payload: CreateUserRequestDto) {
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }

    return await this.userService.createUser(request);
  }

  @Get('/list')
  @ApiOperation({
    summary: 'Lấy danh sách người dùng với phân trang và bộ lọc',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách người dùng thành công',
  })
  async getUserList(@Query() query: GetListUserRequestDto) {
    const { request, responseError } = query;

    if (!isEmpty(responseError)) {
      return responseError;
    }

    return await this.userService.list(request);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin người dùng thành công',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async getUserById(@Param() params: IdParamDto) {
    const { request, responseError } = params;

    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.userService.getDetail(request.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng theo ID' })
  @ApiResponse({ status: 200, description: 'Cập nhật người dùng thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async updateUser(
    @Param() params: IdParamDto,
    @Body() updateUserDto: UpdateUserRequestDto,
  ) {
    const mergedData = mergePayload(params, updateUserDto);
    const { request, responseError } = mergedData;

    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.userService.updateUser(request.id, request);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm người dùng theo ID' })
  @ApiResponse({ status: 200, description: 'Xóa người dùng thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async deleteUser(@Param() params: IdParamDto) {
    const { request, responseError } = params;

    if (!isEmpty(responseError)) {
      return responseError;
    }

    return await this.userService.deleteUser(request.id);
  }

  @Put(':id/toggle-lock')
  @ApiOperation({ summary: 'Chuyển đổi trạng thái khóa người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật trạng thái khóa người dùng thành công',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async toggleUserLockStatus(@Param() params: IdParamDto) {
    const { request, responseError } = params;

    if (!isEmpty(responseError)) {
      return responseError;
    }

    return await this.userService.toggleUserLockStatus(request.id);
  }
}
