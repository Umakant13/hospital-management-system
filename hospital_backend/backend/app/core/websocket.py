import socketio
from typing import Dict, Set
import asyncio

# Create Socket.IO server with proper CORS configuration
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8000', 'https://hospital-management-system-zt8o.onrender.com'],
    logger=True,
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25
)

print("🚀 Socket.IO server initialized with CORS origins: localhost:3000, localhost:8000")

# Store connected clients by user_id
connected_clients: Dict[int, Set[str]] = {}

@sio.event
async def connect(sid, environ, auth):
    """Handle client connection"""
    print(f"🔌 WebSocket: Client attempting to connect: {sid}")
    print(f"🔌 WebSocket: Auth data: {auth}")
    
    # Get user_id from auth
    user_id = auth.get('user_id') if auth else None
    print(f"🔌 WebSocket: Extracted user_id: {user_id}")
    
    if user_id:
        if user_id not in connected_clients:
            connected_clients[user_id] = set()
        connected_clients[user_id].add(sid)
        print(f"✅ WebSocket: User {user_id} connected with session {sid}")
        print(f"✅ WebSocket: Total connected clients: {list(connected_clients.keys())}")
    else:
        print(f"⚠️ WebSocket: Connection without user_id! Session: {sid}")

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f"❌ WebSocket: Client disconnecting: {sid}")
    
    # Remove from connected clients
    for user_id, sessions in list(connected_clients.items()):
        if sid in sessions:
            sessions.remove(sid)
            print(f"❌ WebSocket: Removed session {sid} from user {user_id}")
            if not sessions:
                del connected_clients[user_id]
                print(f"❌ WebSocket: User {user_id} has no more sessions")
            break
    print(f"📊 WebSocket: Remaining connected clients: {list(connected_clients.keys())}")

async def send_notification_to_user(user_id: int, notification_data: dict):
    """Send notification to a specific user"""
    print(f"📡 WebSocket: Sending to user {user_id}. Connected clients: {list(connected_clients.keys())}")
    if user_id in connected_clients:
        for sid in connected_clients[user_id]:
            try:
                await sio.emit('notification', notification_data, room=sid)
                print(f"✅ Notification sent to user {user_id}, session {sid}")
            except Exception as e:
                print(f"❌ Error sending to session {sid}: {e}")
    else:
        print(f"⚠️ User {user_id} is not connected via WebSocket")

async def broadcast_notification(notification_data: dict):
    """Broadcast notification to all connected users"""
    await sio.emit('notification', notification_data)
