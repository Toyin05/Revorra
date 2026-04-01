import { useState, useEffect } from "react"
import { Bell, Check, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "@/api/notificationsApi"
import { useToast } from "@/hooks/use-toast"

export default function NotificationBell({ refreshTrigger = 0 }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadNotifications()
  }, [refreshTrigger])

  const loadNotifications = async () => {
    try {
      const res = await getNotifications()
      setNotifications(res.data.data.notifications || [])
      setUnreadCount(res.data.data.unreadCount || 0)
    } catch (error) {
      console.error("Failed to load notifications:", error)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id)
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      setNotifications(notifications.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast({ title: "All notifications marked as read" })
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id)
      const wasUnread = notifications.find(n => n.id === id && !n.isRead)
      setNotifications(notifications.filter(n => n.id !== id))
      if (wasUnread) {
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      console.error("Failed to delete notification:", error)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TASK_SUBMISSION':
        return '📋'
      case 'TASK_APPROVED':
        return '✅'
      case 'TASK_REJECTED':
        return '❌'
      case 'WITHDRAWAL_REQUEST':
        return '💰'
      case 'WITHDRAWAL_APPROVED':
        return '🎉'
      case 'WITHDRAWAL_REJECTED':
        return '📉'
      case 'NEW_REFERRAL':
        return '👥'
      case 'COUPON_GENERATED':
        return '🎫'
      default:
        return '🔔'
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative cursor-pointer">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-2 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs cursor-pointer"
              onClick={handleMarkAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`relative p-3 hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  {!notification.isRead && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                  )}
                  
                  <div className="flex items-start gap-3 pl-2">
                    <span className="text-xl">{getTypeIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTime(notification.createdAt)}</p>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 cursor-pointer"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 cursor-pointer text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}