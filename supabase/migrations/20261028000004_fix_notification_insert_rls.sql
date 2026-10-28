-- Fix notifications RLS so authenticated users/actions can send notifications to other users
DROP POLICY IF EXISTS "Users view and manage own notifications" ON public.notifications;

CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (recipient_id = auth.uid());

CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Users delete own notifications"
ON public.notifications FOR DELETE TO authenticated
USING (recipient_id = auth.uid());

CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (true);
