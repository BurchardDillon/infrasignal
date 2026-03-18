-- Allow 'feed' as an agent_name in job_runs
ALTER TABLE job_runs DROP CONSTRAINT job_runs_agent_name_check;
ALTER TABLE job_runs ADD CONSTRAINT job_runs_agent_name_check
  CHECK (agent_name IN ('discovery', 'news', 'qualification', 'queue', 'feed'));
