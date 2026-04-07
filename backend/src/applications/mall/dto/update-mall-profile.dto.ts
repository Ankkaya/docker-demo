import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMallProfileDto {
  @ApiPropertyOptional({
    description: '昵称',
    example: '柚子汽水',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @ApiPropertyOptional({
    description: '头像地址',
    example: '/files/preview?filename=avatars/1/avatar.png',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
