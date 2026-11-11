# ข้อตัดสินใจข้ามทีม (Cross-Team Decisions)

**สถานะ: OVERRIDE** — เอกสารนี้ชนะ spec ทุกฉบับที่ยังไม่ได้อัปเดต
อ้างอิง: การประชุมทีม 11 พ.ย. 2026

---

## D1 — ไม่มี assessment: สาเหตุเริ่มต้น

MVP ไม่มีการ personalise เนื้อหาตามสาเหตุ จึงไม่มีฟิลด์ `assessment: สาเหตุเริ่มต้น`
- **ผลกระทบต่อ Education**: rule B5 ("Worry keeps the loop going") ถูกลบออก เพราะมันต้องการ `assessment: สาเหตุเริ่มต้น` ที่ไม่มีอีกแล้ว
- **ชนะ**: education spec section 3 ที่ระบุ `assessment: สาเหตุเริ่มต้น` เป็น input

## D2 — Education "why" cards ผูกกับ Suggestion ผ่านปุ่ม "ทำไม?"

Education "why" cards (จาก pop-up) แนบกับ suggestion S1, S2, S3, S4 และ S7 เท่านั้น ผ่านปุ่ม **"ทำไม?"** บน suggestion card
- Education ไม่มี threshold เป็นของตัวเอง — ทุก threshold อยู่ที่ suggestion (Lunn)
- **ชนะ**: education spec ที่ไม่ได้ระบุการเชื่อมกับ suggestion

## D3 — Suggestion และ why cards ล็อกจนกว่า education: ยอมรับกฎแล้ว = yes

- Suggestion S1–S10 และ "ทำไม?" cards ทั้งหมด: ล็อก จนกว่าผู้ใช้จะยืนยันกฎครบ 6 ข้อ
- Safety messages SF1–SF4: **ไม่ล็อก** แสดงเสมอเมื่อเข้าเงื่อนไข
- **ชนะ**: suggestion spec ที่ไม่ได้กล่าวถึงการล็อกนี้

## D4 — MVP ไม่มี sleep window

ไม่มีการคำนวณหรือแสดง sleep window ในทุก MVP screen
- `suggestion: เวลาเข้านอนที่แนะนำ` ถูกลบออกจากพจนานุกรม
- Education B4 ("Going to bed too early") ถูกปิด เพราะอาศัย sleep window
- **ชนะ**: education spec และ suggestion spec ที่ระบุ sleep window เป็น input

## D5 — ตัวเลขงีบยังไม่เปิดจนกว่าหมอยืนยัน

ไม่ใส่ตัวเลขที่เจาะจงในข้อความที่ผู้ใช้เห็น (เช่น "นอกจากนี้ ถ้างีบควรงีบไม่เกิน X นาที") จนกว่าหมอ Surat ยืนยัน
- ใช้ **1 ค่าคงที่** ร่วมกันทั้งแอป เก็บใน `lib/constants.ts` กับ comment `// [?]`
- ค่าคงที่ที่เปิดใช้ในพจนานุกรม: `ค่าคงที่: เวลางีบสูงสุด` และ `ค่าคงที่: เวลางีบช้าสุด`

## D6 — เก็บ lesson: เวลาเป้าหมายที่จะตื่น ที่หน้ากฎ ข้อ 1 ตั้งแต่วันที่ 1

- Target wake time เก็บในหน้า rules confirmation ตอนยืนยันกฎข้อ 1 (ไม่ใช่ใน diary หรือ onboarding)
- เริ่มตั้งแต่วันแรกของโปรแกรม
- เจ้าของ: Yue
- **ผลต่อ test case ของ Washi**: 8.1 เปลี่ยนเป็น คืนที่ 2 = ใช่ และผลรายสัปดาห์ = 4/6

## D7 — Diary reminder อยู่ที่หน้า "บันทึกแล้ว" เงื่อนไขเฉพาะ

Reminder กฎรายวันแสดงเฉพาะเมื่อ:
1. เป็น save ครั้งแรกของคืนนั้น (ไม่ใช่ backfill และไม่ใช่การแก้ไข)
2. `คำนวณ: ลุกตรงเวลาเป้าหมาย = ไม่ใช่`

แสดงใน screen "บันทึกแล้ว" ต่อจาก diary save ปกติ ไม่ใช่ pop-up แยก

## D8 — สิทธิ์เข้าแอปตามผลลัพธ์ assessment

| ผลลัพธ์ | สิทธิ์ |
|---|---|
| GO | ทุกส่วน (diary, education, suggestion, recap) |
| NOT-FIT | Education เท่านั้น: pop-up "How sleep works", อ่านกฎ (read-only), myths; ไม่มี diary หรือ suggestion; ปุ่ม "ดูเคล็ดลับการนอน" เปิดหน้า read-only rules |
| REFER | หน้าผลลัพธ์เท่านั้น |
| STOP | หน้าผลลัพธ์เท่านั้น; ล็อกถาวร ย้อนกลับไม่ได้ |

**ชนะ**: assessment spec section 7 ที่ร่างสิทธิ์ไว้ก่อนหน้า

## D9 — Final ISI = ISI 7 ข้อเท่านั้น ครบ 4 สัปดาห์จากวันกด เริ่มสัปดาห์ที่ 1

- Final ISI ถามเฉพาะ 7 ข้อ ISI (ไม่ถามคำถาม assessment อื่น)
- ถามเมื่อครบ 28 วัน นับจากวันที่ผู้ใช้กดปุ่ม **"เริ่มสัปดาห์ที่ 1"** โดยใช้ `getNow()`
- ผลไปที่ recap เพื่อเทียบกับ `assessment: คะแนน ISI ตอนเริ่ม`
- **ชนะ**: assessment spec ข้อ 2 ที่ไม่ได้ระบุ timing ชัดเจน
