-- Tasks are now live all day (toggle via chat or the tasks page), and XP is
-- computed once at end-of-day instead of at a one-time submission. There is
-- no more separate "notes" field or a single stored "first AI reply" —
-- a day's entire conversation lives in checkin_messages from message #1
-- onward, and the task summary is derived live from task_completions.

alter table daily_logs drop column ai_response;
alter table daily_logs drop column notes;
