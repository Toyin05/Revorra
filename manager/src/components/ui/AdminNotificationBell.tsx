import { useState, useEffect } from "react"
import { Bell, Check, X, RefreshCw, AlertCircle, DollarSign, FileCheck, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import adminApi from "@/api/adminAxios"
import { useToast } from "@/hooks/use-toast"

export default function AdminNotificationBell({ refreshTrigger = 0 }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    pendingTasks: 0,
    pendingWithdrawals: 0,
    pendingCoupons: 0,
    totalPending: 0,
    notifications: []
  })
  const { toast } = useToast()

  useEffect(() => {
    loadNotifications()
  }, [refreshTrigger])

  const loadNotifications = async () => {
    try {
      const res = await adminApi.get("/admin/notifications")
      setData(res.data.data)
    } catch (error) {
      console.error("Failed to load admin notifications:", error)
    }
  }

  const formatTime = (dateStr: string) => {
    if (!dateStr) return ""
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

  const totalPending = data.pendingTasks + data.pendingWithdrawals

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative cursor-pointer">
          <Bell className="h-5 w-5" />
          {totalPending > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white animate-pulse">
              {totalPending > 9 ? '9+' : totalPending}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Admin Alerts</h3>
            {totalPending > 0 && (
              <Badge variant="destructive" className="h-5 px-2 text-xs animate-pulse">
                {totalPending} pending
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 cursor-pointer"
            onClick={loadNotifications}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 p-3 border-b bg-muted/30">
          <div 
            className="flex items-center gap-2 p-2 rounded-lg bg-card border cursor-pointer hover:bg-accent transition-colors"
            onClick={() => { setOpen(false); window.location.href = '/tasks'; }}
          >
            <div className="relative">
              <FileCheck className="h-4 w-4 text-orange-500" />
              {data.pendingTasks > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tasks</p>
              <p className="font-semibold">{data.pendingTasks}</p>
            </div>
          </div>
          <div 
            className="flex items-center gap-2 p-2 rounded-lg bg-card border cursor-pointer hover:bg-accent transition-colors"
            onClick={() => { setOpen(false); window.location.href = '/withdrawals'; }}
          >
            <div className="relative">
              <DollarSign className="h-4 w-4 text-green-500" />
              {data.pendingWithdrawals > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Withdrawals</p>
              <p className="font-semibold">{data.pendingWithdrawals}</p>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          {(data.notifications || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No new notifications</p>
              <p className="text-xs mt-1">Check Tasks & Withdrawals pages</p>
            </div>
          ) : (
            <div className="divide-y">
              {data.notifications.map((notification: any) => (
                <div 
                  key={notification.id}
                  className="p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getTypeIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTime(notification.createdAt)}</p>
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