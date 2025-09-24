import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface CacheStatus {
  jobId: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  mediaType: 'movie' | 'tv';
  mediaId: number;
  progress?: string;
  error?: string;
  completedAt?: Date;
}

export interface CacheStatsMessage {
  type: 'cache-status';
  data: {
    type: 'queue-stats' | 'job-enqueued';
    stats?: {
      pending: number;
      active: number;
      total: number;
    };
    jobId?: string;
    mediaType?: 'movie' | 'tv';
    mediaId?: number;
  };
}

export interface CacheMessage {
  type: 'cache-status' | 'cache-completed' | 'cache-failed' | 'ping' | 'pong';
  data?: any;
}

export function useCacheStatus(mediaType: 'movie' | 'tv', mediaId: number) {
  const [status, setStatus] = useState<CacheStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch initial cache status
  useEffect(() => {
    if (!mediaId) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/cache-status/${mediaType}/${mediaId}`);
        const data = await response.json();
        
        if (data.status !== 'not_found') {
          setStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch cache status:', error);
      }
    };

    fetchStatus();
  }, [mediaType, mediaId]);

  // WebSocket connection management
  useEffect(() => {
    if (!mediaId) return;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/cache-status`;
        
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('Cache status WebSocket connected');
          setIsConnected(true);
          // Clear reconnection timeout if connection succeeds
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = undefined;
          }
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message: CacheMessage = JSON.parse(event.data);
            handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        wsRef.current.onclose = (event) => {
          console.log('Cache status WebSocket closed:', event.code, event.reason);
          setIsConnected(false);
          
          // Attempt to reconnect after delay (exponential backoff)
          if (!reconnectTimeoutRef.current) {
            const delay = Math.min(1000 * Math.pow(2, 1), 30000); // Cap at 30 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectTimeoutRef.current = undefined;
              connectWebSocket();
            }, delay);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('Cache status WebSocket error:', error);
          setIsConnected(false);
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
      }
    };

    const handleMessage = (message: CacheMessage) => {
      switch (message.type) {
        case 'cache-status':
          if (message.data && (message.data.mediaType === mediaType && message.data.mediaId === mediaId)) {
            setStatus(message.data);
          }
          break;
          
        case 'cache-completed':
          if (message.data && message.data.mediaType === mediaType && message.data.mediaId === mediaId) {
            setStatus(prev => prev ? { ...prev, status: 'completed' } : null);
            
            // Invalidate and refetch the movie/TV data to get updated Cloudinary URLs
            queryClient.invalidateQueries({ 
              queryKey: [`/api/${mediaType}s`, mediaId.toString()]
            });
            
            // Show success message (optional)
            console.log(`Cache completed for ${mediaType} ${mediaId}`);
          }
          break;
          
        case 'cache-failed':
          if (message.data && message.data.mediaType === mediaType && message.data.mediaId === mediaId) {
            setStatus(prev => prev ? { ...prev, status: 'failed', error: message.data.error } : null);
            console.error(`Cache failed for ${mediaType} ${mediaId}:`, message.data.error);
          }
          break;
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, [mediaType, mediaId, queryClient]);

  // Ping/pong to keep connection alive
  useEffect(() => {
    if (!isConnected || !wsRef.current) return;

    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  return {
    status,
    isConnected,
    isOptimizing: status && (status.status === 'pending' || status.status === 'active'),
    isCompleted: status && status.status === 'completed',
    isFailed: status && status.status === 'failed',
    progress: status?.progress || null,
    error: status?.error || null
  };
}