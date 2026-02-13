import { IsString, MinLength, IsOptional, IsUUID } from 'class-validator';

export class CreateTopicCommentDto {
  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
