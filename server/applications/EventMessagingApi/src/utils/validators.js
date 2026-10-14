const TOPIC_RE = /^[A-Za-z0-9._-]{1,249}$/;

const httpError = (status, message) => Object.assign(new Error(message), { status });

// Returns an error message, or null when the topic is acceptable.
function topicProblem(topic) {
  if (typeof topic !== 'string' || topic === '') return 'topic is required';
  if (!TOPIC_RE.test(topic)) return 'topic must match [A-Za-z0-9._-]{1,249}';
  if (topic === '.' || topic === '..') return "topic cannot be '.' or '..'";
  if (topic.startsWith('__')) return "topic cannot start with '__' (internal topics are not allowed)";
  return null;
}

function assertTopic(topic) {
  const p = topicProblem(topic);
  if (p) throw httpError(400, p);
}

function isHttpUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value);
    return (u.protocol === 'http:' || u.protocol === 'https:') && !!u.hostname;
  } catch {
    return false;
  }
}

module.exports = { TOPIC_RE, httpError, topicProblem, assertTopic, isHttpUrl };
