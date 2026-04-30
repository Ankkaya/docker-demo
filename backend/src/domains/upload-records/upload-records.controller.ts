import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { UploadRecordsService } from './upload-records.service';
import { QueryUploadRecordDto } from './dto/query-upload-record.dto';

@ApiTags('后台接口/文件记录')
@Controller('upload-records')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadRecordsController {
  constructor(private readonly uploadRecordsService: UploadRecordsService) {}

  @Get()
  @ApiOperation({ summary: '上传记录列表' })
  @ApiOkResponse()
  findAll(@Query() query: QueryUploadRecordDto) {
    return this.uploadRecordsService.findAll(query);
  }
}
