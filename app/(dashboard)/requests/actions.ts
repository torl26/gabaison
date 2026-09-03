'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { respondToRequestSchema } from '@/lib/validations/respond-to-request';
import { cancelRequestSchema } from '@/lib/validations/cancel-request';
import { completeRequestSchema, consultationFeedbackSchema, reviewSchema } from '@/lib/validations/review';
import { type ActionResult, ok, err } from '@/lib/actions/types';

export async function respondToMatchRequestAction(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();

  if (!user) {
    return err('ログインしてください');
  }

  const parsed = respondToRequestSchema.safeParse({
    requestId: formData.get('requestId'),
    decision: formData.get('decision'),
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('match_requests')
    .update({ status: parsed.data.decision })
    .eq('id', parsed.data.requestId);

  if (error) {
    return err('更新に失敗しました: ' + error.message);
  }

  revalidatePath('/requests');
  return ok(undefined);
}

export async function cancelMatchRequestAction(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();

  if (!user) {
    return err('ログインしてください');
  }

  const parsed = cancelRequestSchema.safeParse({
    requestId: formData.get('requestId'),
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('match_requests')
    .update({ status: 'cancelled' })
    .eq('id', parsed.data.requestId);

  if (error) {
    return err('更新に失敗しました: ' + error.message);
  }

  revalidatePath('/requests');
  return ok(undefined);
}

export async function completeMatchRequestAction(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();

  if (!user) {
    return err('ログインしてください');
  }

  const parsed = completeRequestSchema.safeParse({
    requestId: formData.get('requestId'),
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const supabase = await createClient();

  const { data: request } = await supabase
    .from('match_requests')
    .select('mentor_id, status')
    .eq('id', parsed.data.requestId)
    .maybeSingle();
  if (!request || request.mentor_id !== user.id || request.status !== 'accepted') {
    return err('相談を完了にできるのは、承認したメンターのみです');
  }

  const { error } = await supabase
    .from('match_requests')
    .update({ status: 'completed' })
    .eq('id', parsed.data.requestId);

  if (error) {
    return err('更新に失敗しました: ' + error.message);
  }

  revalidatePath('/requests');
  return ok(undefined);
}

export async function submitReviewAction(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();

  if (!user) {
    return err('ログインしてください');
  }

  const parsed = reviewSchema.safeParse({
    requestId: formData.get('requestId'),
    rating: Number(formData.get('rating')),
    comment: formData.get('comment') ?? '',
  });

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');
  }

  const supabase = await createClient();

  // The mentor being reviewed comes from the request itself, never the form.
  // RLS re-checks that this student was on the match and that it is completed.
  const { data: request } = await supabase
    .from('match_requests')
    .select('mentor_id')
    .eq('id', parsed.data.requestId)
    .maybeSingle();

  if (!request) {
    return err('対象の申請が見つかりません');
  }

  const { error } = await supabase.from('reviews').insert({
    match_id: parsed.data.requestId,
    reviewer_id: user.id,
    reviewee_id: request.mentor_id,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  });

  if (error) {
    return err('レビューの投稿に失敗しました: ' + error.message);
  }

  revalidatePath('/requests');
  revalidatePath(`/mentors/${request.mentor_id}`);
  revalidatePath(`/users/${request.mentor_id}`);
  return ok(undefined);
}

export async function submitConsultationFeedbackAction(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) return err('ログインしてください');

  const parsed = consultationFeedbackSchema.safeParse({
    requestId: formData.get('requestId'),
    rating: Number(formData.get('rating')),
    reflection: formData.get('reflection') ?? '',
  });
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? '入力内容を確認してください');

  const supabase = await createClient();
  const { data: request } = await supabase
    .from('match_requests')
    .select('student_id, mentor_id, status')
    .eq('id', parsed.data.requestId)
    .maybeSingle();

  if (!request || request.status !== 'completed') return err('完了した相談が見つかりません');
  const isStudent = request.student_id === user.id;
  const isMentor = request.mentor_id === user.id;
  if (!isStudent && !isMentor) return err('このアンケートには回答できません');

  const { error } = await supabase.from('consultation_feedback').insert({
    match_id: parsed.data.requestId,
    author_id: user.id,
    target_id: isStudent ? request.mentor_id : request.student_id,
    author_role: isStudent ? 'student' : 'mentor',
    rating: parsed.data.rating,
    reflection: parsed.data.reflection,
  });
  if (error) return err('アンケートの送信に失敗しました: ' + error.message);

  if (isStudent) {
    await supabase.from('reviews').insert({
      match_id: parsed.data.requestId,
      reviewer_id: user.id,
      reviewee_id: request.mentor_id,
      rating: parsed.data.rating,
      comment: parsed.data.reflection,
    });
  }

  revalidatePath('/requests');
  revalidatePath(`/mentors/${request.mentor_id}`);
  revalidatePath(`/users/${request.mentor_id}`);
  return ok(undefined);
}
