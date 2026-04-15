import { PartialType } from '@nestjs/swagger';
import { CreatePrintTemplateDto } from './create-print-template.dto';

export class UpdatePrintTemplateDto extends PartialType(CreatePrintTemplateDto) {}
