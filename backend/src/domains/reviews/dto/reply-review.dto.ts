import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class ReplyReviewDto {
  @ApiProperty({ description: '商家回复内容', example: '感谢支持，欢迎再次购买' })
  @IsString()
  @MaxLength(1000)
  replyContent: string;
}
