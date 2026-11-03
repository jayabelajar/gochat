package redis

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

type Client struct {
	rdb        *redis.Client
	isFallback bool
	mu         sync.RWMutex
	memoryMap  map[string]string
	subscribers []chan string
}

func Connect(redisAddr string) *Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:         redisAddr,
		DialTimeout:  2 * time.Second,
		ReadTimeout:  2 * time.Second,
		WriteTimeout: 2 * time.Second,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("Redis connection failed (%v). Operating in graceful in-memory fallback mode.", err)
		return &Client{
			isFallback:  true,
			memoryMap:   make(map[string]string),
			subscribers: make([]chan string, 0),
		}
	}

	log.Println("Successfully connected to Redis")
	return &Client{
		rdb: rdb,
	}
}

func (c *Client) SetPresence(ctx context.Context, userID string, status string, ttl time.Duration) error {
	if c.isFallback {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.memoryMap["presence:"+userID] = status
		return nil
	}
	return c.rdb.Set(ctx, fmt.Sprintf("presence:%s", userID), status, ttl).Err()
}

func (c *Client) GetPresence(ctx context.Context, userID string) (string, error) {
	if c.isFallback {
		c.mu.RLock()
		defer c.mu.RUnlock()
		status, exists := c.memoryMap["presence:"+userID]
		if !exists {
			return "offline", nil
		}
		return status, nil
	}
	val, err := c.rdb.Get(ctx, fmt.Sprintf("presence:%s", userID)).Result()
	if err == redis.Nil {
		return "offline", nil
	}
	return val, err
}

func (c *Client) PublishEvent(ctx context.Context, channel string, message string) error {
	if c.isFallback {
		c.mu.RLock()
		defer c.mu.RUnlock()
		for _, sub := range c.subscribers {
			select {
			case sub <- message:
			default:
			}
		}
		return nil
	}
	return c.rdb.Publish(ctx, channel, message).Err()
}

func (c *Client) Close() error {
	if c.isFallback {
		return nil
	}
	return c.rdb.Close()
}

