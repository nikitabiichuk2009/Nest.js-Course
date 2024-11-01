import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  getBookmarks(userId: number) {
    return this.prisma.bookmark.findMany({
      where: { userId },
    });
  }

  getBookmarkById(userId: number, bookmarkId: number) {
    return this.prisma.bookmark.findFirst({
      where: { id: bookmarkId, userId },
    });
  }

  createBookmark(userId: number, dto: CreateBookmarkDto) {
    return this.prisma.bookmark.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  editBookmarkById(userId: number, bookmarkId: number, dto: EditBookmarkDto) {
    return this.prisma.bookmark.update({
      where: { id: bookmarkId, userId },
      data: { ...dto },
    });
  }

  deleteBookmarkById(userId: number, bookmarkId: number) {
    return this.prisma.bookmark.delete({
      where: { id: bookmarkId, userId },
    });
  }
}
