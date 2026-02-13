import { IsString, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsOptional()
  content?: string;
}
