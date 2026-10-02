import { z } from 'zod';

export const responseSchema = z.object({
  member_name: z
    .string()
    .trim()
    .min(1, '이름을 입력해주세요.')
    .max(50, '이름이 너무 깁니다.')
    .transform((s) => s.normalize('NFC')),
  designated_book_id: z.number().int().positive(),
  other_book_ids: z
    .array(z.number().int().positive())
    .length(5, '나머지도서는 정확히 5권 선택해야 합니다.')
    .refine((ids) => new Set(ids).size === ids.length, '같은 책을 두 번 선택할 수 없습니다.'),
});

export type ResponseInput = z.infer<typeof responseSchema>;
