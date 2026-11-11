/**
 * Mapping from Thai dictionary names (docs/00-dictionary.md) to English identifiers
 * used in code and database columns.
 *
 * Rules:
 * - Piece prefix maps to a table or object namespace
 * - Names are transliterated, not translated
 * - Add here before using any new name in code
 */

export const DICT: Record<string, string> = {
  // บัญชี
  'บัญชี: ชื่อบัญชี': 'profiles.account_name',
  'บัญชี: อีเมล': 'auth.users.email',

  // Assessment inputs
  'assessment: ความยินยอม': 'assessment_responses.consent',
  'assessment: อายุ': 'assessment_responses.age',
  'assessment: ประเภทปัญหาการนอน': 'assessment_responses.sleep_problem_types',
  'assessment: คืนที่นอนไม่หลับต่อสัปดาห์': 'assessment_responses.nights_per_week',
  'assessment: ระยะเวลาที่มีปัญหาการนอน': 'assessment_responses.problem_duration',
  'assessment: โอกาสนอนเพียงพอ': 'assessment_responses.adequate_opportunity',
  'assessment: ISI ข้อ 1–7': 'assessment_responses.isi_q1…isi_q7',
  'assessment: คะแนน ISI ตอนเริ่ม': 'assessment_responses.isi_score_start',
  'assessment: คะแนน ISI ตอนจบ': 'assessment_responses.isi_score_end',
  'assessment: 2Q ข้อ 1–2': 'assessment_responses.q2_q1, q2_q2',
  'assessment: 9Q ข้อ 3.3–3.11': 'assessment_responses.q9_q3_3…q9_q3_11',
  'assessment: คะแนน 9Q รวม': 'assessment_responses.q9_total',
  'assessment: คำตอบ 9Q ข้อคิดทำร้ายตนเอง': 'assessment_responses.q9_q3_11',
  'assessment: ข้อห้าม 5 ข้อ': 'assessment_responses.contraindication_*',
  'assessment: ทำงานเป็นกะ': 'assessment_responses.shift_work',
  'assessment: ตั้งครรภ์/หลังคลอด 6 เดือน': 'assessment_responses.pregnant_postnatal',
  'assessment: RLS 4 ข้อ': 'assessment_responses.rls_q1…rls_q4',
  'assessment: STOP-Bang ข้อกรน/เหนื่อย/หยุดหายใจ': 'assessment_responses.stop_bang_snore / tired / observed',
  'assessment: ความดันโลหิตสูง': 'assessment_responses.hypertension',
  'assessment: ส่วนสูง': 'assessment_responses.height_cm',
  'assessment: น้ำหนัก': 'assessment_responses.weight_kg',
  'assessment: BMI': 'assessment_responses.bmi',
  'assessment: รอบคอ': 'assessment_responses.neck_circumference_in',
  'assessment: เพศกำเนิด': 'assessment_responses.biological_sex',
  'assessment: การใช้สิ่งช่วยหลับ': 'assessment_responses.sleep_aid_*',
  'assessment: คะแนน STOP-Bang': 'assessment_responses.stop_bang_score',
  'assessment: ผลลัพธ์': 'assessment_responses.result',
  'assessment: แจ้งเตือนพิเศษ (flag)': 'assessment_responses.flags',

  // Education
  'education: ยอมรับกฎแล้ว': 'education_state.rules_accepted',
  'education: กฎที่ยืนยันแล้ว': 'education_state.confirmed_rules',
  'education: การ์ดล่าสุดที่อ่าน': 'education_state.last_card_tab1 / last_card_tab2',
  'education: ลำดับความเชื่อผิด': 'education_state.myth_order',
  'education: ความเชื่อผิดวันนี้': 'education_state.myth_today',
  'education: วันที่แสดงความเชื่อผิด': 'education_state.myth_shown_date',
  'education: ซ่อนความเชื่อผิดวันนี้': 'education_state.myth_hidden_today',

  // Lesson
  'lesson: เวลาเป้าหมายที่จะตื่น': 'lesson_settings.target_wakeup_time',

  // Diary
  'diary: เวลาขึ้นเตียง': 'diary_entries.bedtime',
  'diary: เวลาปิดไฟ': 'diary_entries.lights_out',
  'diary: เวลากว่าจะหลับ': 'diary_entries.sleep_onset_min',
  'diary: จำนวนครั้งที่ตื่นกลางดึก': 'diary_entries.wakeup_count',
  'diary: เวลาตื่นกลางดึกรวม': 'diary_entries.wakeup_duration_min',
  'diary: เวลาตื่นครั้งสุดท้าย': 'diary_entries.final_wakeup',
  'diary: เวลาลุกจากเตียง': 'diary_entries.out_of_bed',
  'diary: คุณภาพการนอน': 'diary_entries.sleep_quality',
  'diary: วันที่ของคืน': 'diary_entries.night_date',
  'diary: เวลาที่ส่งบันทึก': 'diary_entries.submitted_at',
  'diary: กรอกย้อนหลัง': 'diary_entries.is_backfill',

  // Calculated
  'คำนวณ: เวลาบนเตียง': 'diary_entries.time_in_bed_min',
  'คำนวณ: เวลาหลับจริง': 'diary_entries.sleep_time_min',
  'คำนวณ: ประสิทธิภาพการนอน': 'diary_entries.sleep_efficiency_pct',
  'คำนวณ: ลุกตรงเวลาเป้าหมาย': 'diary_entries.on_target_wakeup',
  'คำนวณ: จำนวนคืนที่ใช้ได้': '(computed weekly)',
  'คำนวณ: เวลาหลับจริงเฉลี่ยรายสัปดาห์': '(computed weekly)',
  'คำนวณ: เวลาบนเตียงเฉลี่ยรายสัปดาห์': '(computed weekly)',
  'คำนวณ: ประสิทธิภาพการนอนรายสัปดาห์': '(computed weekly)',
  'คำนวณ: เวลากว่าจะหลับเฉลี่ยรายสัปดาห์': '(computed weekly)',
  'คำนวณ: จำนวนเช้าที่ลุกตรงเวลาเป้าหมาย': '(computed weekly)',
  'คำนวณ: ช่วงเวลาลุกจากเตียง': '(computed in suggestion)',
  'คำนวณ: จำนวนคืนที่หลับยากหรือตื่นนาน': '(computed in suggestion)',

  // Checklist
  'checklist: จำนวนวันที่รับแสงหลังตื่น': 'weekly_checklists.days_morning_light',
  'checklist: จำนวนวันที่ดื่มคาเฟอีนใกล้นอน': 'weekly_checklists.days_caffeine_near_bed',
  'checklist: จำนวนวันที่งีบกลางวัน': 'weekly_checklists.days_napped',
  'checklist: จำนวนวันที่ออกกำลังกาย': 'weekly_checklists.days_exercised',
  'checklist: จำนวนวันที่ดื่มแอลกอฮอล์ใกล้นอน': 'weekly_checklists.days_alcohol_near_bed',
  'checklist: จำนวนวันที่กินมื้อหนักหรือออกกำลังหนักใกล้นอน': 'weekly_checklists.days_heavy_meal_or_exercise',
  'checklist: จำนวนวันที่หรี่ไฟก่อนนอน': 'weekly_checklists.days_dim_light',
  'checklist: จำนวนวันที่ใช้จอบนเตียง': 'weekly_checklists.days_screen_in_bed',
  'checklist: ความถี่ที่ดูนาฬิกาตอนตื่น': 'weekly_checklists.clock_check_frequency',

  // Suggestion
  'suggestion: คิว': 'suggestion_selections.queue',
  'suggestion: 3 ข้อที่แสดง': 'suggestion_selections.shown',
  'suggestion: ข้อที่ผู้ใช้เลือก': 'suggestion_selections.selected',
  'suggestion: วันที่เริ่มสอน': 'suggestion_selections.selected_at',
  'suggestion: ตัวเลือก S1–S10': '(enum values)',
  'safety: ข้อความ SF1–SF4': '(computed in suggestion)',
}
