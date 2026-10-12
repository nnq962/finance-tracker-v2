-- migrate:up

-- Which in-app notices a user has read. The notices themselves are worked
-- out from the user's data when asked for (a debt due, a day not written
-- down, AI requests running low…), each under a key that names the thing
-- and its moment ("debt:<id>:<due date>"), so reading one marks just that.
CREATE TABLE notice_reads (
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  key text NOT NULL CHECK (char_length(key) BETWEEN 1 AND 200),
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

-- migrate:down

DROP TABLE notice_reads;
