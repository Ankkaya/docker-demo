import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  Body,
  ParseArrayPipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { MinioService } from './minio.service';
import { BufferedFile } from './dto/file.dto';
import { UploadResponseDto, FileListResponseDto, FileStatResponseDto } from './dto/response.dto';

@ApiTags('文件存储')
@Controller('files')
@ApiBearerAuth()
export class MinioController {
  constructor(private readonly minioService: MinioService) {}

  /**
   * 上传单个文件
   */
  @Post('upload')
  @ApiOperation({ summary: '上传单个文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '文件',
        },
        path: {
          type: 'string',
          description: '存储路径（可选）',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: BufferedFile,
    @Query('path') path?: string,
  ): Promise<UploadResponseDto> {
    const result = await this.minioService.uploadFile(file, path);
    return {
      code: 200,
      message: '上传成功',
      data: {
        filename: file.originalname,
        url: result.url,
        etag: result.etag,
      },
    };
  }

  /**
   * 上传多个文件
   */
  @Post('upload/multiple')
  @ApiOperation({ summary: '上传多个文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: '文件列表',
        },
        path: {
          type: 'string',
          description: '存储路径（可选）',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadFiles(
    @UploadedFiles() files: BufferedFile[],
    @Query('path') path?: string,
  ): Promise<{ code: number; message: string; data: Array<{ filename: string; url: string; etag: string }> }> {
    const results = await this.minioService.uploadFiles(files, path);
    return {
      code: 200,
      message: '上传成功',
      data: results.map((result, index) => ({
        filename: files[index].originalname,
        url: result.url,
        etag: result.etag,
      })),
    };
  }

  /**
   * 获取文件 URL
   */
  @Get('url')
  @ApiOperation({ summary: '获取文件访问 URL' })
  async getFileUrl(
    @Query('filename') filename: string,
    @Query('expiry') expiry?: string,
  ): Promise<{ code: number; message: string; data: { url: string } }> {
    const url = await this.minioService.getFileUrl(
      filename,
      expiry ? parseInt(expiry, 10) : undefined,
    );
    return {
      code: 200,
      message: 'success',
      data: { url },
    };
  }

  /**
   * 删除文件
   */
  @Delete('delete')
  @ApiOperation({ summary: '删除文件' })
  async deleteFile(
    @Body('filename') filename: string,
  ): Promise<{ code: number; message: string }> {
    await this.minioService.deleteFile(filename);
    return {
      code: 200,
      message: '删除成功',
    };
  }

  /**
   * 批量删除文件
   */
  @Delete('delete/batch')
  @ApiOperation({ summary: '批量删除文件' })
  async deleteFiles(
    @Body('filenames', new ParseArrayPipe({ items: String })) filenames: string[],
  ): Promise<{ code: number; message: string }> {
    await this.minioService.deleteFiles(filenames);
    return {
      code: 200,
      message: '删除成功',
    };
  }

  /**
   * 列出文件
   */
  @Get('list')
  @ApiOperation({ summary: '列出文件' })
  async listFiles(
    @Query('prefix') prefix?: string,
    @Query('recursive') recursive?: string,
  ): Promise<FileListResponseDto> {
    const files = await this.minioService.listFiles(
      prefix,
      recursive === 'true',
    );
    return {
      code: 200,
      message: 'success',
      data: files.map(file => ({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        etag: file.etag,
        prefix: file.prefix,
      })),
    };
  }

  /**
   * 获取文件信息
   */
  @Get('stat')
  @ApiOperation({ summary: '获取文件信息' })
  async getFileStat(
    @Query('filename') filename: string,
  ): Promise<FileStatResponseDto> {
    const stat = await this.minioService.getFileStat(filename);
    return {
      code: 200,
      message: 'success',
      data: {
        size: stat.size,
        etag: stat.etag,
        lastModified: stat.lastModified,
        contentType: stat.metaData?.['content-type'],
      },
    };
  }

  /**
   * 获取预签名上传 URL
   */
  @Get('presigned-upload')
  @ApiOperation({ summary: '获取预签名上传 URL（用于前端直传）' })
  async getPresignedUploadUrl(
    @Query('filename') filename: string,
    @Query('expiry') expiry?: string,
  ): Promise<{ code: number; message: string; data: { url: string } }> {
    const url = await this.minioService.getPresignedUploadUrl(
      filename,
      expiry ? parseInt(expiry, 10) : undefined,
    );
    return {
      code: 200,
      message: 'success',
      data: { url },
    };
  }

  /**
   * 检查文件是否存在
   */
  @Get('exists')
  @ApiOperation({ summary: '检查文件是否存在' })
  async fileExists(
    @Query('filename') filename: string,
  ): Promise<{ code: number; message: string; data: { exists: boolean } }> {
    const exists = await this.minioService.fileExists(filename);
    return {
      code: 200,
      message: 'success',
      data: { exists },
    };
  }
}
