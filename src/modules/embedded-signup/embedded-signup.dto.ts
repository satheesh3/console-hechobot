import { IsObject, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class EmbeddedSignupCallbackDto {
  // The client we're onboarding numbers for. Issued by /admin/clients.
  @IsUUID()
  clientId!: string;

  @IsString()
  wabaId!: string;

  @IsString()
  phoneNumberId!: string;

  @Matches(/^\+[1-9]\d{6,14}$/)
  displayPhoneNumber!: string;

  @IsOptional()
  @IsString()
  verifiedName?: string;

  // Whatever YCloud handed back from the embedded signup flow (channel id,
  // tokens, business verification status, etc.) — stored verbatim.
  @IsOptional()
  @IsObject()
  ycloudMetadata?: Record<string, unknown>;
}
