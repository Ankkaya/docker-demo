import { PartialType } from '@nestjs/swagger';
import { CreateMallRechargeActivityDto } from './create-mall-recharge-activity.dto';

export class UpdateMallRechargeActivityDto extends PartialType(CreateMallRechargeActivityDto) {}
