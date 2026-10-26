-- A context's user of the store: it reads the rows of its scope and nothing else, and keeps its
-- views in a database of its own. {scope} is the context's scope, {password} the `store_password`
-- of its `chronicles` secret.

CREATE DATABASE IF NOT EXISTS `{scope}`;

-- limits a query cannot lift, because they are its profile's, not settings a request passes
CREATE SETTINGS PROFILE IF NOT EXISTS `{scope}` SETTINGS
  max_execution_time = 30 CONST,
  max_result_rows = 10001 CONST,
  max_result_bytes = 67108864 CONST,
  max_memory_usage = 4000000000 CONST,
  max_concurrent_queries_for_user = 4 CONST;

CREATE USER IF NOT EXISTS `{scope}` IDENTIFIED WITH sha256_password BY '{password}'
  DEFAULT DATABASE chronicles SETTINGS PROFILE '{scope}';

GRANT SELECT ON chronicles.events TO `{scope}`;
GRANT SELECT ON chronicles.states TO `{scope}`;
GRANT SELECT ON chronicles.encounters TO `{scope}`;
GRANT SELECT, CREATE VIEW, CREATE TABLE, INSERT, DROP VIEW, DROP TABLE ON `{scope}`.* TO `{scope}`;

-- when its materialized views were last refreshed
GRANT SELECT ON system.view_refreshes TO `{scope}`;

-- replaced rather than kept: a policy outlives its user, and one left to a user made again would
-- apply to no one, which reads as no restriction at all
CREATE ROW POLICY OR REPLACE `{scope}` ON chronicles.events, chronicles.states, chronicles.encounters
  USING scope = '{scope}' TO `{scope}`;
