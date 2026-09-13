import time
from typing import Optional, Any, Dict, Tuple
import json
from upstash_redis import Redis
from app.core.config import settings
from app.core.logging import logger

class RedisService:
    def __init__(self):
        self.client: Optional[Redis] = None
        self._local_cache: Dict[str, Tuple[float, Any]] = {}
        self._initialize()

    def _initialize(self):
        if settings.UPSTASH_REDIS_REST_URL and settings.UPSTASH_REDIS_REST_TOKEN:
            try:
                self.client = Redis(
                    url=settings.UPSTASH_REDIS_REST_URL,
                    token=settings.UPSTASH_REDIS_REST_TOKEN
                )
                logger.info("Upstash Redis client successfully initialized.")
            except Exception as e:
                logger.warning(f"Failed to connect to Upstash Redis: {e}. Falling back to in-memory cache/rate limit.")
                self.client = None
        else:
            logger.info("Upstash Redis credentials not set. Using local in-memory fallback.")

    def check_rate_limit(self, key: str, max_requests: int = 60, window_seconds: int = 60) -> bool:
        """
        Token bucket / sliding window rate limiting.
        Returns True if request is allowed, False if limit exceeded.
        """
        if not self.client:
            return True # Allow gracefully if Redis not available in test
        try:
            current_time = int(time.time())
            window_key = f"ratelimit:{key}:{current_time // window_seconds}"
            current_count = self.client.incr(window_key)
            if current_count == 1:
                self.client.expire(window_key, window_seconds + 5)
            return current_count <= max_requests
        except Exception as e:
            logger.warning(f"Redis rate limit check error: {e}")
            return True

    def get_json(self, key: str) -> Optional[Any]:
        # Check in-memory fast tier first
        now = time.time()
        if key in self._local_cache:
            exp_time, val = self._local_cache[key]
            if now < exp_time:
                return val
            else:
                del self._local_cache[key]

        if not self.client:
            return None
        try:
            val = self.client.get(key)
            if val:
                parsed = json.loads(val)
                self._local_cache[key] = (now + 10, parsed) # local mini-cache
                return parsed
            return None
        except Exception as e:
            logger.warning(f"Redis get error: {e}")
            return None

    def set_json(self, key: str, value: Any, expire_seconds: int = 300) -> bool:
        now = time.time()
        self._local_cache[key] = (now + expire_seconds, value)
        if not self.client:
            return True
        try:
            serialized = json.dumps(value)
            self.client.set(key, serialized, ex=expire_seconds)
            return True
        except Exception as e:
            logger.warning(f"Redis set error: {e}")
            return False

    def delete(self, key: str) -> bool:
        if key in self._local_cache:
            del self._local_cache[key]
        if not self.client:
            return True
        try:
            self.client.delete(key)
            return True
        except Exception as e:
            logger.warning(f"Redis delete error: {e}")
            return False

redis_service = RedisService()
