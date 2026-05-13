import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

class TextBody {
  @IsString()
  body!: string;

  @IsOptional()
  @IsBoolean()
  previewUrl?: boolean;
}

class TemplateLanguage {
  @IsString()
  code!: string;
}

class TemplateBody {
  @IsString()
  name!: string;

  @ValidateNested()
  @Type(() => TemplateLanguage)
  language!: TemplateLanguage;

  @IsOptional()
  @IsArray()
  components?: unknown[];
}

export class SendMessageDto {
  // Either channelId (our internal id) or fromPhoneNumberId (Meta phone_number_id).
  @IsOptional()
  @IsString()
  channelId?: string;

  @IsOptional()
  @IsString()
  fromPhoneNumberId?: string;

  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'to must be E.164' })
  to!: string;

  @IsEnum(['text', 'template'])
  type!: 'text' | 'template';

  @IsOptional()
  @ValidateNested()
  @Type(() => TextBody)
  text?: TextBody;

  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateBody)
  template?: TemplateBody;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
