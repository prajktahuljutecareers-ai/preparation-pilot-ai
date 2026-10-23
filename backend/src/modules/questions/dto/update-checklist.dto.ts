import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateChecklistDto {
  @IsBoolean({ message: 'isCompleted must be a boolean' })
  @IsOptional()
  isCompleted?: boolean;

  @IsString()
  @IsOptional()
  label?: string;
}

