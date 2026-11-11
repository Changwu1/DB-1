# CLAUDE.md — กติกาสำหรับ repo นี้

## อ่านก่อนทุก task

1. อ่าน `docs/00-dictionary.md` ก่อนสร้างหรือแก้ไขโค้ดใด ๆ
2. อ่าน `docs/05-decisions.md` ก่อนทุก task — เอกสารนี้ชนะ spec ทุกฉบับ

## ชื่อและภาษา

- ใช้ **ชื่อจากพจนานุกรม** (`docs/00-dictionary.md`) เท่านั้นในโค้ด, คอมเมนต์, และ database column
- เมื่อต้องแปลงเป็น identifier ภาษาอังกฤษ ให้ทับศัพท์อย่างสม่ำเสมอและเก็บ mapping ใน `lib/dict-transliteration.ts`
- UI copy ภาษาไทย มาจาก spec section 7 ทุกตัวอักษร — ห้ามแต่งเองหรือใช้ภาษาอังกฤษแทน

## เมื่อ spec ขัดแย้งกัน

- ถ้า `docs/05-decisions.md` ครอบคลุม → ใช้ 05-decisions
- ถ้า 05-decisions ไม่ครอบคลุม → **หยุดและถามก่อน ห้ามเดา**

## ค่า [?]

- ใช้ค่า default ที่ spec ระบุไว้
- เก็บใน `lib/constants.ts` เพียงที่เดียว พร้อม comment `// [?] รอยืนยัน`
- **ห้ามแต่งค่าขึ้นเอง**

## Pure functions ใน lib/

- ทุก rule table จาก spec → pure function ใน `lib/`
- ใส่ rule ID (`D3`, `R1`, `C4`, …) ใน comment เสมอ
- ตัวอย่าง: `getAssessmentResult(answers)`, `pickMythOfDay(state, today)`

## Unit tests

- ทุก section 8 test case จาก spec → unit test ใน Vitest
- **ชิ้นนั้นถือว่าเสร็จก็ต่อเมื่อ test ผ่านทุกข้อ**
- สร้าง test ก่อนสร้าง screen เสมอ

## Simulated date

- ทุก date/time logic อ่านจาก `getNow()` ใน `lib/time.ts` เท่านั้น
- ห้าม `new Date()` หรือ `Date.now()` โดยตรงในโค้ดฟีเจอร์

## Safety screens — ห้ามข้าม

- **STOP screen ต้องแสดงเสมอ** และล็อกถาวร — ห้ามมี path ใดที่ข้ามได้
- **REFER user ต้องไม่เข้าถึงโปรแกรม** (diary, suggestion, recap)
- ตรวจสอบสิทธิ์ตาม `assessment: ผลลัพธ์` ทุกครั้งที่ผู้ใช้เข้า route ที่ต้อง auth

## Stack

- Next.js App Router + TypeScript
- Supabase (auth + Postgres) · RLS: แต่ละ user เห็นแค่ row ของตัวเอง
- Tailwind CSS · mobile-first · 380px
- Vitest
- Deploy: Vercel

## ลำดับการสร้าง

accounts → assessment → diary + checklist → education → suggestion → recap + final ISI
