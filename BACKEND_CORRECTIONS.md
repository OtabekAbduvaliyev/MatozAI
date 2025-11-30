# Backend va Frontend Integratsiya Tahlili

Sizdagi xatolik (`statusCode: 400, "duration must be a number..."`) shuni ko'rsatadiki, Backend `FormData` dan kelgan ma'lumotlarni to'g'ri validatsiya qilolmayapti.

Quyida men Backend spetsifikatsiyasida nimani unutganim va Frontendda nimani to'g'rilash kerakligi keltirilgan.

## 1. Backenddagi Xatoliklar (Spec bo'yicha)

Men spetsifikatsiyada DTO larni yozganda `multipart/form-data` xususiyatini hisobga olib, **Type transformation** qo'shishni unutibman.

### ❌ Muammo:

`CreateSessionDto` da `duration` faqat `@IsNumber()` deb belgilangan. `FormData` orqali u string ("8.0665") bo'lib keladi va validatsiyadan o'tmaydi.

### ✅ Yechim (Backend kodi uchun):

Backenddagi `src/sessions/dto/create-session.dto.ts` faylini quyidagicha o'zgartirish kerak:

```typescript
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsIn,
} from "class-validator";
import { Type } from "class-transformer"; // <-- SHUNI QO'SHISH KERAK

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @Type(() => Number) // <-- BU QATOR MANDA YO'Q EDI. BU STRINGNI RAQAMGA O'GIRADI
  @IsNumber()
  @Min(0)
  duration: number;

  @IsOptional()
  @IsIn(["lat", "cyr"])
  script?: string;

  @IsOptional()
  audioBlob?: any;
}
```

## 2. Frontenddagi Kamchiliklar

Frontendda `storageService.ts` da biz `FormData` yuboryapmiz, bu to'g'ri. Ammo Backend javob qaytarganda (ayniqsa xatolik bo'lganda) biz foydalanuvchiga aniq xabarni ko'rsatmayapmiz.

### ❌ Muammo:

Fayl yuklashda xatolik bo'lsa (masalan 400 Bad Request), Frontend shunchaki konsolga yozib qo'yyapti, foydalanuvchi esa "yuklanmayapti" deb o'ylaydi.

### ✅ Yechim (Frontend kodi uchun):

`storageService.ts` dagi `saveSession` funksiyasini xatolarni to'g'ri ushlaydigan qilish kerak.

## 3. Umumiy Xulosa

**Backendga aytilmagan narsalar:**

1. `CreateSessionDto` da `@Type(() => Number)` ishlatish shartligi (Multipart requestlar uchun).
2. `main.ts` da `app.useGlobalPipes(new ValidationPipe({ transform: true }))` sozlamasi borligi (bu bo'lishi kerak, lekin `@Type` siz baribir ishlamaydi).

**O'zim ulamagan narsalar (Frontend):**

1. Xatolik yuz berganda `App.tsx` ga xabar qaytarish (Toast message).
2. `audioUrl` ni Backenddan olganda uni o'ynatish logikasi (`AudioPlayer` da).

---

## 🚀 Tezkor Tuzatish Rejasi

1. **Backend:** `CreateSessionDto` ga `@Type(() => Number)` qo'shing.
2. **Backend:** Agar `script` maydoni ham `FormData` da kelsa, u ham string bo'lishi mumkin, unga tegish shart emas.
3. **Frontend:** Men hozir `storageService.ts` ni shunday o'zgartiramanki, u xatolik bo'lsa aniqroq ma'lumot beradi.
