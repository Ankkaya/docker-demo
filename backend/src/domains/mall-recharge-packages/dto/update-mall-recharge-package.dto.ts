import { PartialType } from '@nestjs/swagger';
import { CreateMallRechargePackageDto } from './create-mall-recharge-package.dto';

export class UpdateMallRechargePackageDto extends PartialType(CreateMallRechargePackageDto) {}
