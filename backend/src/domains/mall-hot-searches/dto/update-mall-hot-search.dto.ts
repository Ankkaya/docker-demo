import { PartialType } from '@nestjs/swagger';
import { CreateMallHotSearchDto } from './create-mall-hot-search.dto';

export class UpdateMallHotSearchDto extends PartialType(CreateMallHotSearchDto) {}
