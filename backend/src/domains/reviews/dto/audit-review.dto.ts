import { ApiProperty } from '@nestjs/swagger';
import { ReviewStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class AuditReviewDto {
  @ApiProperty({
    description: '审核状态',
    enum: [ReviewStatus.APPROVED, ReviewStatus.REJECTED, ReviewStatus.HIDDEN],
    example: ReviewStatus.APPROVED,
  })
  @IsEnum(ReviewStatus)
  status: 'APPROVED' | 'REJECTED' | 'HIDDEN';
}
