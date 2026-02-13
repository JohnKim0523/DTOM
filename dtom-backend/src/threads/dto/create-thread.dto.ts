import { IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ThreadPermission, ThreadType } from '../entities/thread.entity';

export class CreateThreadDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsEnum(ThreadPermission)
  permission?: ThreadPermission;

  @IsOptional()
  @IsEnum(ThreadType)
  type?: ThreadType;
}
