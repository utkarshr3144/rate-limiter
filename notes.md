Rate Limiter
1. What is a Rate Limiter?
A rate limiter controls how many requests a client can make to a server during a specified period.
Example rule:
A user can make at most 5 requests every 60 seconds.
If the user exceeds the limit, the server rejects additional requests, commonly with:
HTTP/1.1 429 Too Many Requests
​
The response may include a Retry-After header indicating when the client can retry.
2. Why Do We Need Rate Limiting?
Rate limiting helps to:
Prevent one client from overwhelming an API.
Reduce abusive or automated traffic.
Limit brute-force attempts against login and password-reset endpoints.
Control infrastructure costs and excessive database operations.
Preserve capacity and availability for other users.
Rate limiting is one layer of protection. It does not replace authentication, authorization, input validation, or broader abuse detection.
3. How It Works
Suppose the limit is 5 requests per user per 60 seconds.
The client sends a request.
Middleware identifies the client, for example by authenticated user ID or IP address.
The limiter checks the client's request count and time window.
If the request is within the limit, it updates the counter and allows the request to continue.
If the limit is exceeded, it rejects the request with HTTP 429.
The exact reset behaviour depends on the chosen algorithm.
4. Common Rate-Limiting Algorithms
4.1 Fixed Window Counter
Divide time into fixed windows, such as 12:00:00–12:00:59.
Count requests within each window.
Reset the counter when the next window begins.
Advantages
Simple to understand and implement.
Low memory requirements.
Disadvantages
Traffic can spike at a window boundary. A client might send the maximum just before a window ends and another maximum just after it resets.
4.2 Sliding Window Log
Store the timestamps of recent requests.
For each new request, remove timestamps older than the rolling time window.
Allow the request only if the number of remaining timestamps is below the limit.
Advantages
Accurate rolling-window enforcement.
Disadvantages
Can require significant memory because timestamps must be stored.
4.3 Sliding Window Counter
Estimate the rolling-window count using the current window's counter and the previous window's counter.
Often uses the proportion of the previous window that overlaps the rolling window.
Advantages
More memory-efficient than storing every timestamp.
Smooths out fixed-window boundary spikes.
Disadvantages
It is an approximation rather than an exact request log.
4.4 Token Bucket
A bucket holds tokens up to a configured capacity.
Tokens refill at a set rate.
Each request consumes a token.
If there are no tokens available, the request is rejected or delayed.
Advantages
Allows controlled bursts while limiting the long-term request rate.
Commonly used for API throttling.
Disadvantages
Requires clear choices for bucket capacity and refill rate.
4.5 Leaky Bucket
Requests enter a queue or are processed according to a controlled output rate.
This smooths bursts and can produce steady processing.
Advantages
Helps smooth traffic.
Disadvantages
A queued implementation adds complexity and may introduce latency. Some implementations reject overflow instead of queueing requests.
5. Where Rate Limiting Is Used
Endpoint or operation
Typical reason
Login
Reduce password-guessing attempts
Signup
Limit automated account creation
Password reset
Reduce abuse and unwanted messages
URL creation API
Prevent excessive resource creation
Public read API
Share capacity fairly
Expensive operations
Control compute or third-party API costs
Limits should reflect the endpoint's risk and cost. A login endpoint may need a stricter policy than a normal read endpoint.
6. Rate Limiting in a Node.js / Express Backend
A typical request flow is:
Client
  |
  v
Rate-limiter middleware
  |
  +-- Within limit --> API route --> Business logic
  |
  +-- Limit exceeded --> HTTP 429
​
Middleware usually runs before the expensive business logic so rejected requests do not perform unnecessary database or compute work.
Choosing the client identity
A limiter may use:
Authenticated user ID.
IP address.
API key or tenant ID.
A combination of identity and endpoint.
IP-based limiting requires care when the application is behind a reverse proxy. Configure trusted proxies correctly; do not blindly trust arbitrary client-supplied forwarding headers.
7. Why Redis Is Commonly Used
A single in-memory counter may work for a local demo, but it has limitations:
Each server instance has its own memory.
Counters disappear when the process restarts.
Multiple instances can disagree about a client's count.
Redis provides shared, fast storage for counters and expiry information, making it useful for distributed applications.
Example key:
rate-limit:user:123
​
A simplified fixed-window implementation might keep a count and an expiration time for each key.
Important: Checking the count and incrementing it must be atomic. Otherwise, simultaneous requests can all observe available capacity and exceed the configured limit. Use an atomic Redis operation or Lua script appropriate to the chosen algorithm.
For production, also consider key design, expiry, memory usage, failure behaviour, and whether the limiter should fail open or fail closed when Redis is unavailable.
8. HTTP Response
A rate-limited response commonly looks like:
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 30
​
{
  "error": "Too many requests. Please try again later."
}
​
Retry-After is optional. If supplied, it can tell the client how many seconds to wait or provide a retry date.
9. Rate Limiter vs. Related Concepts
Rate limiting: Restricts how frequently requests can be made.
Concurrency limiting: Restricts how many operations can run at the same time.
Load shedding: Rejects work when a service is overloaded to protect its health.
Authentication: Establishes who the client is.
Authorization: Determines what the client is allowed to do.
These mechanisms solve different problems and can be combined.
10. Common Interview Questions
What is a rate limiter, and why is it needed?
What does HTTP 429 Too Many Requests mean?
Compare fixed window, sliding window, token bucket, and leaky bucket.
Why can fixed windows allow bursts at boundaries?
Why use Redis instead of an in-memory JavaScript object?
How do you make a distributed rate-limit check atomic?
How should the limiter identify a client?
How would you rate-limit login attempts differently from public read requests?
What should happen if Redis becomes unavailable?
How is rate limiting different from concurrency limiting?
11. Key Takeaways
A rate limiter restricts requests per client over time.
Exceeded limits commonly result in HTTP 429.
Fixed window is simple; sliding-window approaches improve rolling-window accuracy; token bucket allows controlled bursts; leaky bucket smooths traffic.
Redis is useful when multiple server instances need shared counters.
Atomic updates are essential under concurrent traffic.
Choose limits and client identity based on security, fairness, and endpoint cost.